import { currentUser } from '../../lib/server/user'
import { updateName } from './actions'

export default async function SettingsPage() {
  const user = await currentUser()
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>
      <form action={updateName} className="space-y-3">
        <div>
          <label className="block text-xs text-fg-muted" htmlFor="name">Display name</label>
          <input
            id="name"
            name="name"
            className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-border"
            defaultValue={(user as any)?.name ?? ''}
            placeholder="Your name"
          />
        </div>
        <button type="submit" className="rounded bg-fg px-3 py-2 text-bg">Save</button>
      </form>
    </div>
  )
}
