import { currentUser } from '../../lib/server/user'

export default async function ProfilePage() {
  const user = await currentUser()
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm">Email: {(user as any)?.email ?? '-'}</div>
        <div className="text-sm">Name: {(user as any)?.name ?? '-'}</div>
        <div className="text-sm">Role: {(user as any)?.role ?? '-'}</div>
      </div>
    </div>
  )
}
