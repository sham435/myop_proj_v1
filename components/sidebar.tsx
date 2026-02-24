import Link from "next/link"

export function Sidebar() {
  return (
    <aside className="w-60 border-r border-border bg-card p-4">
      <nav className="space-y-2 text-sm">
        <Link href="/dashboard" className="block rounded px-2 py-1 hover:bg-border/30">
          Overview
        </Link>
        <Link href="/dashboard#activity" className="block rounded px-2 py-1 hover:bg-border/30">
          Activity
        </Link>
        <Link href="/dashboard#settings" className="block rounded px-2 py-1 hover:bg-border/30">
          Settings
        </Link>
      </nav>
    </aside>
  )
}

