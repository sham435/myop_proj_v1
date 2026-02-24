'use client'
import { useState } from 'react'
import { forgot } from '../../../lib/client'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const ok = await forgot({ email }).catch(() => false)
    setLoading(false)
    setMessage(ok ? 'If an account exists, you will receive an email.' : 'Request failed')
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Forgot Password</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-border"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="w-full rounded bg-fg px-3 py-2 text-bg disabled:opacity-60" disabled={loading} type="submit">
          {loading ? 'Submitting...' : 'Send reset link'}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-fg-muted">{message}</p>}
    </div>
  )
}

