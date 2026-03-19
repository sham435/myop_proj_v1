import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { spawn, ChildProcess } from "child_process"
import { Logger, Injectable } from "@nestjs/common"
import path from "path"
import os from "os"
import fs from "fs"

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name)

  async getAllSkills(): Promise<Array<{ name: string; description: string; location: string }>> {
    try {
      const skillDirs = [
        path.join(os.homedir(), ".claude", "skills"),
        path.join(os.homedir(), ".agents", "skills"),
        // packages/api/.opencode/skill (from cwd)
        path.join(process.cwd(), ".opencode", "skill"),
        // Repo root .opencode/skill (two levels up from packages/api)
        path.join(process.cwd(), "..", "..", ".opencode", "skill"),
        // Built-in skills from myoc package
        path.join(process.cwd(), "..", "..", "packages", "myoc", "src", "builtin-skills"),
      ]

      const skills: Array<{ name: string; description: string; location: string }> = []

      for (const dir of skillDirs) {
        try {
          if (!fs.existsSync(dir)) continue

          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const skillPath = path.join(dir, entry.name, "SKILL.md")
              try {
                if (fs.existsSync(skillPath)) {
                  const content = fs.readFileSync(skillPath, "utf-8")
                  const frontmatter = this.parseFrontmatter(content)
                  if (frontmatter.name) {
                    skills.push({
                      name: frontmatter.name,
                      description: frontmatter.description || "",
                      location: skillPath,
                    })
                  }
                }
              } catch {
                // Skip on error
              }
            }
          }
        } catch {
          // Directory doesn't exist, skip
        }
      }

      return skills
    } catch (error) {
      this.logger.error(`Error getting skills: ${error}`)
      return []
    }
  }

  private parseFrontmatter(content: string): Record<string, string> {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!match) return {}

    const result: Record<string, string> = {}
    const lines = match[1].split("\n")

    for (const line of lines) {
      const colonIndex = line.indexOf(":")
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        result[key] = value
      }
    }

    return result
  }
}

interface AgentSession {
  id: string
  process: ReturnType<typeof spawn>
  clientId: string
}

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/agent",
})
export class AgentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(AgentGateway.name)
  private sessions: Map<string, AgentSession> = new Map()
  private skillsService: SkillsService

  constructor() {
    this.skillsService = new SkillsService()
  }

  afterInit() {
    this.logger.log("Agent WebSocket Gateway initialized")
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
    const session = this.findSessionByClientId(client.id)
    if (session) {
      this.sessions.delete(session.id)
      if (session.process && !session.process.killed) {
        session.process.kill()
      }
    }
  }

  private findSessionByClientId(clientId: string): AgentSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.clientId === clientId) {
        return session
      }
    }
    return undefined
  }

  @SubscribeMessage("start_session")
  async handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { directory?: string; model?: string },
  ) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const opencodePath = process.env.OPENCODE_PATH || "opencode"
    const agentArgs = ["--agent"]

    if (data.directory) {
      agentArgs.push("--directory", data.directory)
    }
    if (data.model) {
      agentArgs.push("--model", data.model)
    }

    this.logger.log(`Starting agent session ${sessionId} with args: ${agentArgs.join(" ")}`)

    const agentProcess = spawn(opencodePath, agentArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    })

    const session: AgentSession = {
      id: sessionId,
      process: agentProcess,
      clientId: client.id,
    }

    this.sessions.set(sessionId, session)

    agentProcess.stdout?.on("data", (chunk: Buffer) => {
      const output = chunk.toString()
      this.logger.debug(`[${sessionId}] stdout: ${output.substring(0, 100)}...`)
      client.emit("output", { sessionId, data: output, type: "stdout" })
    })

    agentProcess.stderr?.on("data", (chunk: Buffer) => {
      const output = chunk.toString()
      this.logger.warn(`[${sessionId}] stderr: ${output}`)
      client.emit("output", { sessionId, data: output, type: "stderr" })
    })

    agentProcess.on("exit", (code: number | null) => {
      this.logger.log(`[${sessionId}] Process exited with code ${code}`)
      client.emit("session_ended", { sessionId, exitCode: code })
      this.sessions.delete(sessionId)
    })

    agentProcess.on("error", (error: Error) => {
      this.logger.error(`[${sessionId}] Process error: ${error.message}`)
      client.emit("error", { sessionId, error: error.message })
    })

    return { sessionId, status: "started" }
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; message: string },
  ) {
    const session = this.sessions.get(data.sessionId)

    if (!session) {
      client.emit("error", { sessionId: data.sessionId, error: "Session not found" })
      return { status: "error", message: "Session not found" }
    }

    if (session.process.stdin?.destroyed) {
      client.emit("error", { sessionId: data.sessionId, error: "Process stdin is closed" })
      return { status: "error", message: "Process stdin is closed" }
    }

    this.logger.log(`[${data.sessionId}] Sending message: ${data.message.substring(0, 50)}...`)
    session.process.stdin?.write(data.message + "\n")

    return { status: "sent" }
  }

  @SubscribeMessage("end_session")
  async handleEndSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const session = this.sessions.get(data.sessionId)

    if (!session) {
      return { status: "error", message: "Session not found" }
    }

    this.logger.log(`[${data.sessionId}] Ending session`)

    if (!session.process.killed) {
      session.process.stdin?.write("\n.exit\n")
      setTimeout(() => {
        if (!session.process.killed) {
          session.process.kill()
        }
      }, 1000)
    }

    this.sessions.delete(data.sessionId)

    return { status: "ended" }
  }

  @SubscribeMessage("interrupt")
  async handleInterrupt(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const session = this.sessions.get(data.sessionId)

    if (!session) {
      return { status: "error", message: "Session not found" }
    }

    this.logger.log(`[${data.sessionId}] Sending interrupt signal`)
    session.process.kill("SIGINT")

    return { status: "interrupted" }
  }

  @SubscribeMessage("get_skills")
  async handleGetSkills(@ConnectedSocket() _client: Socket) {
    try {
      const skills = await this.skillsService.getAllSkills()
      return { status: "success", skills }
    } catch (error) {
      this.logger.error(`Error getting skills: ${error}`)
      return { status: "error", message: String(error) }
    }
  }
}
