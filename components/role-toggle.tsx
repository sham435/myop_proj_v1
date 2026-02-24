'use client'
import { useState } from 'react'
import { useUser } from '../lib/useUser'

export function RoleToggle() {
  const [loading, setLoading] = useState(false)
  const { user } = useUser()
  async function setRole(role: 'admin' | 'user') {
    setLoading(true)
    await fetch('/api/auth/role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) }).catch(() => {})
    setLoading(false)
    location.reload()
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-fg-muted">Role:</span>
      <button type="button" className="rounded border border-border px-2 py-1 text-sm" onClick={() => setRole('user')} disabled={loading}>
        User{user?.role === 'user' ? ' ✓' : ''}
      </button>
      <button type="button" className="rounded border border-border px-2 py-1 text-sm" onClick={() => setRole('admin')} disabled={loading}>
        Admin{user?.role === 'admin' ? ' ✓' : ''}
      </button>
    </div>
  )
}
