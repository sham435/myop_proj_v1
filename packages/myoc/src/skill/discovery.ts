import { Log } from "../util/log"

export namespace Discovery {
  const log = Log.create({ service: "skill/discovery" })

  export async function pull(url: string): Promise<string[]> {
    log.info("pulling skills from URL", { url })

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error("Expected JSON array of skill directories")
      }

      return data.filter((item) => typeof item === "string")
    } catch (err) {
      log.error("failed to pull skills from URL", { url, error: err })
      return []
    }
  }
}
