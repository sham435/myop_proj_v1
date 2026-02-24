'use client'
import Link from "next/link"
import { useUser } from "../lib/useUser"
import { usePathname } from "next/navigation"

export function Header() {
  const { user, loading, logout } = useUser()
  const path = usePathname()
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          MyApp
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-fg hover:underline">Dashboard</Link>
          {user?.role === "admin" && <Link href="/dashboard/admin" className="text-fg hover:underline">Admin</Link>}
          {loading ? null : user ? (
            <>
              <span className="text-fg-muted">{user.email ?? "user"}</span>
              <button
                onClick={logout}
                className="rounded bg-fg px-2 py-1 text-xs text-bg"
                aria-current={path === "/auth/sign-in" ? "page" : undefined}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="text-fg hover:underline">Sign In</Link>
              <Link href="/auth/sign-up" className="text-fg hover:underline">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
