import { Sidebar } from "../../components/sidebar"

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl gap-6 p-4 lg:flex">
      <Sidebar />
      <div className="flex-1 space-y-6">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-lg font-medium">Overview</h2>
          <p className="text-sm text-fg-muted">Welcome to your dashboard.</p>
        </section>
        <section id="activity" className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-lg font-medium">Recent Activity</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">
            <li>Signed in</li>
            <li>Viewed project</li>
            <li>Updated profile</li>
          </ul>
        </section>
        <section id="settings" className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-lg font-medium">Quick Settings</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-border p-3">
              <div className="text-sm font-medium">Notifications</div>
              <div className="text-xs text-fg-muted">Email and push</div>
            </div>
            <div className="rounded border border-border p-3">
              <div className="text-sm font-medium">Theme</div>
              <div className="text-xs text-fg-muted">System</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

