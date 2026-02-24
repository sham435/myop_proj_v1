import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function GET() {
  const jar = await cookies()
  const token = jar.get("token")?.value
  if (!token) return NextResponse.json({ ok: false }, { status: 401 })
  const res = await fetch(`${base}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  }).catch(() => null)
  if (!res || !res.ok) return NextResponse.json({ ok: false }, { status: 401 })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data)
}

