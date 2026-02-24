import { Health } from "../components/health"

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Next 16 + Tailwind v4</h1>
        <p className="text-fg-muted">
          React 19, ESLint 9 (Flat), TypeScript 5.9 — wired for a NestJS API
        </p>
      </header>
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-lg font-medium">Backend Health</h2>
        <Health />
      </section>
    </div>
  )
}

