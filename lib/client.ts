export type LoginBody = { email: string; password: string }
export type LoginResp = { access_token: string } | { token: string } | { accessToken: string }
export type RegisterBody = { email: string; password: string }
export type ForgotBody = { email: string }
export type User = { id?: string; email?: string; name?: string }

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function login(body: LoginBody): Promise<string> {
  const r = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(String(r.status))
  const j: LoginResp = await r.json().catch(() => ({} as any))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (j as any).access_token || (j as any).token || (j as any).accessToken
}

export async function register(body: RegisterBody): Promise<boolean> {
  const r = await fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  return r.ok
}

export async function forgot(body: ForgotBody): Promise<boolean> {
  const r = await fetch(`${base}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  return r.ok
}

export async function me(token: string): Promise<User | null> {
  const r = await fetch(`${base}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => null)
  if (!r || !r.ok) return null
  return r.json().catch(() => null)
}

