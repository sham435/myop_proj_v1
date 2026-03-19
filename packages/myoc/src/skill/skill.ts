import z from "zod"
import path from "path"
import os from "os"
import { Config } from "../config/config"
import { Instance } from "../project/instance"
import { NamedError } from "@opencode-ai/util/error"
import { ConfigMarkdown } from "../config/markdown"
import { Log } from "../util/log"
import { Global } from "@/global"
import { Filesystem } from "@/util/filesystem"
import { Flag } from "@/flag/flag"
import { Bus } from "@/bus"
import { Session } from "@/session"
import { Discovery } from "./discovery"
import { Glob } from "../util/glob"

export namespace Skill {
  const log = Log.create({ service: "skill" })

  export const HooksSchema = z.object({
    pre_invoke: z.string().optional(),
    post_invoke: z.string().optional(),
  })

  export const Info = z.object({
    name: z.string(),
    description: z.string(),
    location: z.string(),
    content: z.string(),
    disable_model_invocation: z.boolean().optional().default(false),
    user_invocable: z.boolean().optional().default(true),
    context: z.enum(["inline", "fork"]).optional().default("inline"),
    agent: z.string().optional(),
    allowed_tools: z.array(z.string()).optional(),
    hooks: HooksSchema.optional(),
    args: z.array(z.string()).optional(),
  })
  export type Info = z.infer<typeof Info>

  export const InvalidError = NamedError.create(
    "SkillInvalidError",
    z.object({
      path: z.string(),
      message: z.string().optional(),
      issues: z.custom<z.core.$ZodIssue[]>().optional(),
    }),
  )

  export const NameMismatchError = NamedError.create(
    "SkillNameMismatchError",
    z.object({
      path: z.string(),
      expected: z.string(),
      actual: z.string(),
    }),
  )

  export function substituteArguments(content: string, args: string[]): string {
    const joined = args.join(" ")
    return content
      .replace(/\$ARGUMENTS/g, joined)
      .replace(/\$ARGUMENTS\[(\d+)\]/g, (_, n) => args[parseInt(n) - 1] ?? "")
      .replace(/\$(\d+)/g, (_, n) => args[parseInt(n) - 1] ?? "")
      .replace(/\$@/g, joined)
      .replace(/\$\{(\d+):-([^}]*)\}/g, (_, n, fallback) => args[parseInt(n) - 1] ?? fallback)
  }

  export function extractShellCommands(content: string): string[] {
    const regex = /!`([^`]+)`/g
    const commands: string[] = []
    const matches = Array.from(content.matchAll(regex))
    for (const match of matches) {
      commands.push(match[1])
    }
    return commands
  }

  export async function injectCommands(content: string, _sessionID?: string): Promise<string> {
    const regex = /!`([^`]+)`/g
    let result = content
    const matches = Array.from(result.matchAll(regex))
    for (const match of matches) {
      const command = match[1]
      try {
        const { exec } = await import("child_process")
        const output = await new Promise<string>((resolve, reject) => {
          exec(command, { cwd: Instance.directory }, (error, stdout, stderr) => {
            if (error) reject(error)
            else resolve(stdout || stderr)
          })
        })
        result = result.replace(match[0], output.trim())
      } catch (err) {
        log.warn("skill command injection failed", { command, error: err })
        result = result.replace(match[0], `[Command failed: ${command}]`)
      }
    }
    return result
  }

  const EXTERNAL_DIRS = [".claude", ".agents"]
  const EXTERNAL_SKILL_PATTERN = "skills/**/SKILL.md"
  const OPENCODE_SKILL_PATTERN = "{skill,skills}/**/SKILL.md"
  const SKILL_PATTERN = "**/SKILL.md"

  export const state = Instance.state(async () => {
    const skills: Record<string, Info> = {}
    const dirs = new Set<string>()

    const addSkill = async (match: string) => {
      const md = await ConfigMarkdown.parse(match).catch((err) => {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse skill ${match}`
        Bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
        log.error("failed to load skill", { skill: match, err })
        return undefined
      })

      if (!md) return

      const parsed = Info.pick({ name: true, description: true }).safeParse(md.data)
      if (!parsed.success) {
        log.warn("skill missing name/description", { skill: match, issues: parsed.error.issues })
        return
      }

      if (skills[parsed.data.name]) {
        log.warn("duplicate skill name", {
          name: parsed.data.name,
          existing: skills[parsed.data.name].location,
          duplicate: match,
        })
      }

      dirs.add(path.dirname(match))

      const data = md.data as z.infer<typeof Info>
      skills[parsed.data.name] = {
        name: parsed.data.name,
        description: parsed.data.description,
        location: match,
        content: md.content,
        disable_model_invocation: data.disable_model_invocation ?? false,
        user_invocable: data.user_invocable ?? true,
        context: data.context ?? "inline",
        agent: data.agent,
        allowed_tools: data.allowed_tools,
        hooks: data.hooks,
        args: data.args,
      }
    }

    const scanExternal = async (root: string, scope: "global" | "project") => {
      return Glob.scan(EXTERNAL_SKILL_PATTERN, {
        cwd: root,
        absolute: true,
        include: "file",
        dot: true,
        symlink: true,
      })
        .then((matches) => Promise.all(matches.map(addSkill)))
        .catch((error) => {
          log.error(`failed to scan ${scope} skills`, { dir: root, error })
        })
    }

    if (!Flag.OPENCODE_DISABLE_EXTERNAL_SKILLS) {
      for (const dir of EXTERNAL_DIRS) {
        const root = path.join(Global.Path.home, dir)
        if (!(await Filesystem.isDir(root))) continue
        await scanExternal(root, "global")
      }

      for await (const root of Filesystem.up({
        targets: EXTERNAL_DIRS,
        start: Instance.directory,
        stop: Instance.worktree,
      })) {
        await scanExternal(root, "project")
      }
    }

    for (const dir of await Config.directories()) {
      const matches = await Glob.scan(OPENCODE_SKILL_PATTERN, {
        cwd: dir,
        absolute: true,
        include: "file",
        symlink: true,
      })
      for (const match of matches) {
        await addSkill(match)
      }
    }

    const config = await Config.get()
    for (const skillPath of config.skills?.paths ?? []) {
      const expanded = skillPath.startsWith("~/") ? path.join(os.homedir(), skillPath.slice(2)) : skillPath
      const resolved = path.isAbsolute(expanded) ? expanded : path.join(Instance.directory, expanded)
      if (!(await Filesystem.isDir(resolved))) {
        log.warn("skill path not found", { path: resolved })
        continue
      }
      const matches = await Glob.scan(SKILL_PATTERN, {
        cwd: resolved,
        absolute: true,
        include: "file",
        symlink: true,
      })
      for (const match of matches) {
        await addSkill(match)
      }
    }

    for (const url of config.skills?.urls ?? []) {
      const list = await Discovery.pull(url)
      for (const dir of list) {
        dirs.add(dir)
        const matches = await Glob.scan(SKILL_PATTERN, {
          cwd: dir,
          absolute: true,
          include: "file",
          symlink: true,
        })
        for (const match of matches) {
          await addSkill(match)
        }
      }
    }

    // Load built-in skills from packages/myoc/src/builtin-skills
    const builtInSkillsPath = path.join(import.meta.dir, "..", "builtin-skills")
    if (await Filesystem.isDir(builtInSkillsPath)) {
      const builtInMatches = await Glob.scan(SKILL_PATTERN, {
        cwd: builtInSkillsPath,
        absolute: true,
        include: "file",
        symlink: true,
      })
      for (const match of builtInMatches) {
        await addSkill(match)
      }
    }

    return {
      skills,
      dirs: Array.from(dirs),
    }
  })

  export async function get(name: string) {
    return state().then((x) => x.skills[name])
  }

  export async function all() {
    return state().then((x) => Object.values(x.skills))
  }

  export async function dirs() {
    return state().then((x) => x.dirs)
  }
}
