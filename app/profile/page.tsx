'use client'
import { useUser } from '../../lib/useUser'

export default function ProfilePage() {
  const { user, loading } = useUser()
  if (loading) return <div className="mx-auto max-w-2xl p-6">Loading…</div>
  if (!user) return <div className="mx-auto max-w-2xl p-6">Not signed in</div>
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm">Email: {user.email ?? '-'}</div>
        <div className="text-sm">Name: {user.name ?? '-'}</div>
        <div className="text-sm">Role: {user.role ?? '-'}</div>
      </div>
    </div>
  )
}

