import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const token = body?.token
  if (!token) return NextResponse.json({ ok: false }, { status: 400 })
  const jar = await cookies()
  jar.set({
    name: "token",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const jar = await cookies()
  jar.delete("token")
  return NextResponse.json({ ok: true })
}

