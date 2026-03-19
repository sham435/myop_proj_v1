import path from "path"
import { pathToFileURL } from "url"
import z from "zod"
import { Tool } from "./tool"
import { Skill } from "../skill"
import { PermissionNext } from "../permission/next"
import { Ripgrep } from "../file/ripgrep"
import { iife } from "@/util/iife"
import { Config } from "../config/config"
import { Agent } from "../agent/agent"
import { Session } from "../session"
import { MessageV2 } from "../session/message-v2"
import { Identifier } from "../id/id"
import { SessionPrompt } from "../session/prompt"
import { defer } from "@/util/defer"

const SkillParameters = z.object({
  name: z.string().describe("The name of the skill to invoke"),
  args: z.array(z.string()).optional().describe("Arguments to pass to the skill (for $ARGUMENTS, $1, $2, etc.)"),
})

export const SkillTool = Tool.define("skill", async (ctx) => {
  const skills = await Skill.all()

  const agent = ctx?.agent
  const accessibleSkills = agent
    ? skills.filter((skill) => {
        const rule = PermissionNext.evaluate("skill", skill.name, agent.permission)
        return rule.action !== "deny"
      })
    : skills

  const userInvocable = accessibleSkills.filter((s) => s.user_invocable !== false)

  const description =
    userInvocable.length === 0
      ? "Load a specialized skill that provides domain-specific instructions and workflows. No skills are currently available."
      : [
          "Load a specialized skill that provides domain-specific instructions and workflows.",
          "",
          "When you recognize that a task matches one of the available skills listed below, use this tool to load the full skill instructions.",
          "",
          "The skill will inject detailed instructions, workflows, and access to bundled resources (scripts, references, templates) into the conversation context.",
          "",
          'Tool output includes a `<skill_content name="...">` block with the loaded content.',
          "",
          "Skills can accept arguments via the args parameter. Use $ARGUMENTS, $1, $2, etc. in skill content to reference these arguments.",
          "",
          "The following skills provide specialized sets of instructions for particular tasks",
          "Invoke this tool to load a skill when a task matches one of the available skills listed below:",
          "",
          "<available_skills>",
          ...userInvocable.map((skill) => [
            `  <skill>`,
            `    <name>${skill.name}</name>`,
            `    <description>${skill.description}</description>`,
            `    <context>${skill.context ?? "inline"}</context>`,
            `    <user_invocable>${skill.user_invocable !== false}</user_invocable>`,
            `  </skill>`,
          ]),
          "</available_skills>",
        ].join("\n")

  const examples = userInvocable
    .map((skill) => `'${skill.name}'`)
    .slice(0, 3)
    .join(", ")
  const hint = examples.length > 0 ? ` (e.g., ${examples}, ...)` : ""

  const parameters = SkillParameters.partial().extend({
    name: z.string().describe(`The name of the skill from available_skills${hint}`),
    args: z.array(z.string()).optional().describe("Arguments to pass to the skill (used for $ARGUMENTS, $1, $2, etc.)"),
  })

  return {
    description,
    parameters,
    async execute(params: z.infer<typeof parameters>, ctx: any) {
      const skill = await Skill.get(params.name!)

      if (!skill) {
        const available = await Skill.all().then((x) => Object.keys(x).join(", "))
        throw new Error(`Skill "${params.name}" not found. Available skills: ${available || "none"}`)
      }

      await ctx.ask({
        permission: "skill",
        patterns: [params.name!],
        always: [params.name!],
        metadata: {},
      })

      const args = params.args ?? []
      let content = Skill.substituteArguments(skill.content, args)

      if (skill.context === "fork") {
        return await executeForkSkill(skill, content, ctx)
      }

      return (await executeInlineSkill(skill, content, ctx)) as any
    },
  }
})

async function executeInlineSkill(skill: z.infer<typeof Skill.Info>, content: string, ctx: any) {
  const dir = path.dirname(skill.location)
  const base = pathToFileURL(dir).href

  content = await Skill.injectCommands(content, ctx.sessionID)

  const limit = 10
  const files = await iife(async () => {
    const arr: string[] = []
    for await (const file of Ripgrep.files({
      cwd: dir,
      follow: false,
      hidden: true,
      signal: ctx.abort,
    })) {
      if (file.includes("SKILL.md")) continue
      arr.push(path.resolve(dir, file))
      if (arr.length >= limit) break
    }
    return arr
  }).then((f) => f.map((file) => `<file>${file}</file>`).join("\n"))

  const allowedToolsNote =
    skill.allowed_tools && skill.allowed_tools.length > 0
      ? `\n\nRestricted tools for this skill: ${skill.allowed_tools.join(", ")}`
      : ""

  return {
    title: `Loaded skill: ${skill.name}`,
    output: `<skill_content name="${skill.name}">
# Skill: ${skill.name}

${content.trim()}

Base directory for this skill: ${base}
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.${allowedToolsNote}
Note: file list is sampled.

<skill_files>
${files}
</skill_files>
</skill_content>`,
    metadata: {
      name: skill.name,
      dir,
      allowed_tools: skill.allowed_tools,
      context: "inline",
    },
  }
}

async function executeForkSkill(skill: z.infer<typeof Skill.Info>, content: string, ctx: any) {
  const agentName = skill.agent ?? "build"
  const agent = await Agent.get(agentName)

  if (!agent) {
    throw new Error(`Skill requires agent "${agentName}" but it was not found`)
  }

  const config = await Config.get()

  content = await Skill.injectCommands(content, ctx.sessionID)

  const hasTaskPermission = agent.permission.some((rule) => rule.permission === "task")

  const allowedToolsRules: z.infer<typeof PermissionNext.Ruleset> = []
  if (skill.allowed_tools && skill.allowed_tools.length > 0) {
    for (const tool of skill.allowed_tools) {
      allowedToolsRules.push({ permission: tool as any, pattern: "*", action: "allow" })
    }
  }

  const session = await iife(async () => {
    return await Session.create({
      parentID: ctx.sessionID,
      title: `Skill: ${skill.name}`,
      permission: [
        {
          permission: "todowrite",
          pattern: "*",
          action: "deny",
        },
        {
          permission: "todoread",
          pattern: "*",
          action: "deny",
        },
        ...(hasTaskPermission ? [] : [{ permission: "task" as const, pattern: "*" as const, action: "deny" as const }]),
        ...allowedToolsRules,
        ...(config.experimental?.primary_tools?.map((t) => ({
          pattern: "*",
          action: "allow" as const,
          permission: t,
        })) ?? []),
      ],
    })
  })

  const msg = await MessageV2.get({ sessionID: ctx.sessionID, messageID: ctx.messageID })
  if (msg.info.role !== "assistant") throw new Error("Not an assistant message")

  const model = agent.model ?? {
    modelID: msg.info.modelID,
    providerID: msg.info.providerID,
  }

  ctx.metadata?.({
    title: `Skill: ${skill.name}`,
    metadata: {
      sessionId: session.id,
      model,
      skillName: skill.name,
    },
  })

  const messageID = Identifier.ascending("message")

  function cancel() {
    SessionPrompt.cancel(session.id)
  }
  ctx.abort.addEventListener("abort", cancel)
  const cleanup = () => ctx.abort.removeEventListener("abort", cancel)

  try {
    const promptParts = await SessionPrompt.resolvePromptParts(content)

    const tools: Record<string, boolean> = {
      todowrite: false,
      todoread: false,
      ...(hasTaskPermission ? {} : { task: false }),
    }

    if (skill.allowed_tools && skill.allowed_tools.length > 0) {
      for (const tool of skill.allowed_tools) {
        tools[tool] = true
      }
    }

    const result = await SessionPrompt.prompt({
      messageID,
      sessionID: session.id,
      model: {
        modelID: model.modelID,
        providerID: model.providerID,
      },
      agent: agent.name,
      tools,
      parts: promptParts,
    })

    const text = result.parts.findLast((x) => x.type === "text")?.text ?? ""

    return {
      title: `Skill completed: ${skill.name}`,
      metadata: {
        sessionId: session.id,
        model,
        name: skill.name,
        context: "fork",
      },
      output: `<skill_result name="${skill.name}">
${text}
</skill_result>

Skill session ID: ${session.id} (for resuming)`,
    }
  } finally {
    cleanup()
  }
}
