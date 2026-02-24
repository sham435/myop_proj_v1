import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const name = body?.name
  if (typeof name !== "string") return NextResponse.json({ ok: false }, { status: 400 })
  const jar = await cookies()
  const token = jar.get("token")?.value
  if (!token) return NextResponse.json({ ok: false }, { status: 401 })
  const res = await fetch(`${base}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  }).catch(() => null)
  if (!res || !res.ok) return NextResponse.json({ ok: false }, { status: 401 })
  jar.set({
    name: "name",
    value: name,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  })
  return NextResponse.json({ ok: true })
}

