'use client'
import { useState } from 'react'
import { useUser } from '../../lib/useUser'

export default function SettingsPage() {
  const { user } = useUser()
  const [name, setName] = useState(user?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const ok = await fetch('/api/settings/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then((r) => r.ok).catch(() => false)
    setLoading(false)
    setMsg(ok ? 'Saved' : 'Failed')
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-fg-muted">Display name</label>
          <input
            className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-border"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <button type="submit" className="rounded bg-fg px-3 py-2 text-bg disabled:opacity-60" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-fg-muted">{msg}</p>}
    </div>
  )
}

