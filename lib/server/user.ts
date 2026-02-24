import { cookies } from "next/headers"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function currentUser() {
  const jar = await cookies()
  const token = jar.get("token")?.value
  if (!token) return null
  const res = await fetch(`${base}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  }).catch(() => null)
  if (!res || !res.ok) return null
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!data) return null
  const role = jar.get("role")?.value
  const name = jar.get("name")?.value
  return { ...data, role: role ?? (data as any).role, name: name ?? (data as any).name }
}

