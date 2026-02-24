import { redirect } from "next/navigation"
import { cookies } from "next/headers"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export default async function AdminPage() {
  const jar = await cookies()
  const token = jar.get("token")?.value
  if (!token) redirect("/auth/sign-in")
  const res = await fetch(`${base}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  }).catch(() => null)
  if (!res || !res.ok) redirect("/dashboard")
  const me = (await res.json().catch(() => ({}))) as { role?: string }
  if (me.role !== "admin") redirect("/dashboard")

  return (
    <div className="mx-auto max-w-6xl p-4">
      <section className="rounded-lg border border-border bg-card p-4">
        <h1 className="mb-2 text-lg font-medium">Admin</h1>
        <p className="text-sm text-fg-muted">You have admin access.</p>
      </section>
    </div>
  )
}

