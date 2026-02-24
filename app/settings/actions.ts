'use server'
import { revalidatePath } from 'next/cache'

const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function updateName(formData: FormData) {
  const name = String(formData.get('name') ?? '')
  if (!name) return
  // Attempt a PATCH to a plausible Nest endpoint; adjust to your API if different
  const token = (await import('next/headers')).cookies().then((c) => c.get('token')?.value)
  const t = await token
  if (t) {
    await fetch(`${base}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ name })
    }).catch(() => {})
  }
  const c = await (await import('next/headers')).cookies()
  c.set({ name: 'name', value: name, httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
  revalidatePath('/settings')
  revalidatePath('/profile')
}

