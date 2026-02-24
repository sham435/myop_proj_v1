'use client'
import { useState } from 'react'
import { register } from '../../../lib/client'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const ok = await register({ email, password }).catch(() => false)
    setLoading(false)
    if (ok) router.push('/auth/sign-in')
    else setMessage('Registration failed')
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Sign Up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-border"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-border"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full rounded bg-fg px-3 py-2 text-bg disabled:opacity-60" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-fg-muted">{message}</p>}
    </div>
  )
}
