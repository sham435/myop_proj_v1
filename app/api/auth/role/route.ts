import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const role = body?.role
  if (role !== "admin" && role !== "user") return NextResponse.json({ ok: false }, { status: 400 })
  const jar = await cookies()
  jar.set({
    name: "role",
    value: role,
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
  jar.delete("role")
  return NextResponse.json({ ok: true })
}

