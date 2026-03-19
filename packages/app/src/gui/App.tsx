import { Component, createSignal, For, onMount, Show } from "solid-js"

interface Skill {
  name: string
  description: string
  location: string
}

interface Message {
  id: string
  type: "user" | "agent" | "system"
  content: string
  sender?: string
}

const App: Component = () => {
  const [connected, setConnected] = createSignal(false)
  const [sessionId, setSessionId] = createSignal<string | null>(null)
  const [messages, setMessages] = createSignal<Message[]>([])
  const [input, setInput] = createSignal("")
  const [skills, setSkills] = createSignal<Skill[]>([])
  const [apiUrl, setApiUrl] = createSignal("http://localhost:3000")
  const [socket, setSocket] = createSignal<any>(null)
  const [status, setStatus] = createSignal<"disconnected" | "connecting" | "connected">("disconnected")

  let socketRef: any = null

  onMount(async () => {
    await loadSkills()
  })

  const loadSkills = async () => {
    try {
      const res = await fetch(`${apiUrl()}/api/skills`)
      if (res.ok) {
        const data = await res.json()
        setSkills(data.skills || [])
      }
    } catch (e) {
      console.error("Failed to load skills:", e)
    }
  }

  const addMessage = (content: string, type: Message["type"], sender?: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      type,
      content,
      sender,
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const connect = () => {
    if (socketRef) {
      socketRef.disconnect()
    }

    setStatus("connecting")
    addMessage("Connecting to server...", "system")

    const io = (window as any).io
    if (!io) {
      addMessage("Socket.io not loaded. Please include the socket.io script.", "system")
      setStatus("disconnected")
      return
    }

    socketRef = io(apiUrl(), {
      path: "/agent/socket.io",
      transports: ["websocket", "polling"],
      timeout: 10000,
    })

    setSocket(socketRef)

    socketRef.on("connect", () => {
      setStatus("connected")
      setConnected(true)
      addMessage("Connecting to agent...", "system")

      socketRef.emit("start_session", {}, (response: any) => {
        if (response.status === "started") {
          setSessionId(response.sessionId)
          addMessage("Session started. Type a message to begin.", "system")
        } else {
          addMessage("Failed to start session: " + (response.message || "Unknown error"), "system")
        }
      })
    })

    socketRef.on("output", (data: any) => {
      if (data.type === "stdout") {
        addMessage(data.data, "agent")
      } else {
        addMessage("[Error] " + data.data, "system")
      }
    })

    socketRef.on("session_ended", (data: any) => {
      addMessage(`Session ended with code: ${data.exitCode}`, "system")
      setSessionId(null)
      setConnected(false)
      setStatus("disconnected")
    })

    socketRef.on("error", (data: any) => {
      addMessage("Error: " + data.error, "system")
    })

    socketRef.on("disconnect", () => {
      setConnected(false)
      setStatus("disconnected")
      if (sessionId()) {
        addMessage("Disconnected from server", "system")
      }
    })

    socketRef.on("connect_error", (error: any) => {
      setStatus("disconnected")
      addMessage("Failed to connect: " + error.message, "system")
    })
  }

  const disconnect = () => {
    if (socketRef && sessionId()) {
      socketRef.emit("end_session", { sessionId: sessionId() })
      setSessionId(null)
    }
  }

  const sendMessage = () => {
    const msg = input().trim()
    if (!msg || !socketRef || !sessionId()) return

    addMessage(msg, "user", "You")
    setInput("")

    socketRef.emit("send_message", { sessionId: sessionId(), message: msg }, (response: any) => {
      if (response.status !== "sent") {
        addMessage("Failed to send: " + (response.message || "Unknown error"), "system")
      }
    })
  }

  const interrupt = () => {
    if (socketRef && sessionId()) {
      socketRef.emit("interrupt", { sessionId: sessionId() })
    }
  }

  const selectSkill = (skillName: string) => {
    setInput(`/${skillName}`)
  }

  const formatMarkdown = (text: string) => {
    return text
      .replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")
  }

  return (
    <div class="app">
      <div class="sidebar">
        <div class="sidebar-header">
          <h1>OpenCode Agent</h1>
          <div class="version">GUI v1.0</div>
          <div class="session-controls">
            <button onClick={connect} disabled={status() === "connected"}>
              Start Session
            </button>
            <button onClick={disconnect} class="secondary" disabled={!connected()}>
              End
            </button>
          </div>
          <div class="connection-settings">
            <label for="apiUrl">API Server URL:</label>
            <input
              type="text"
              id="apiUrl"
              value={apiUrl()}
              onInput={(e) => setApiUrl(e.currentTarget.value)}
              disabled={status() === "connected"}
            />
          </div>
        </div>
        <div class="sidebar-content">
          <div class="skills-section">
            <h2>Available Skills</h2>
            <div class="skill-list">
              <Show when={skills().length > 0} fallback={<p class="loading">Loading skills...</p>}>
                <For each={skills()}>
                  {(skill) => (
                    <div class="skill-item" onClick={() => selectSkill(skill.name)}>
                      <h3>/{skill.name}</h3>
                      <p>{skill.description || "No description"}</p>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </div>
        </div>
      </div>

      <div class="main">
        <div class="chat-header">
          <h2>Chat</h2>
          <div class="session-status">
            <span>
              {status() === "connected" ? "Connected" : status() === "connecting" ? "Connecting..." : "Disconnected"}
            </span>
            <span class={`status-dot ${status() === "connected" ? "connected" : "disconnected"}`} />
          </div>
        </div>

        <div class="messages">
          <Show
            when={messages().length > 0}
            fallback={
              <div class="empty-state">
                <h2>Welcome to OpenCode Agent</h2>
                <p>Start a session to begin chatting with the AI agent.</p>
                <button onClick={connect}>Start Session</button>
              </div>
            }
          >
            <For each={messages()}>
              {(msg) => (
                <div class={`message ${msg.type}`}>
                  <Show when={msg.sender}>
                    <div class="sender">{msg.sender}</div>
                  </Show>
                  <div innerHTML={formatMarkdown(msg.content)} />
                </div>
              )}
            </For>
          </Show>
        </div>

        <div class="input-area">
          <div class="input-wrapper">
            <input
              type="text"
              placeholder="Type your message..."
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              disabled={!sessionId()}
            />
            <button onClick={sendMessage} disabled={!sessionId()}>
              Send
            </button>
          </div>
          <button class="danger" onClick={interrupt} disabled={!sessionId()}>
            Interrupt
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
