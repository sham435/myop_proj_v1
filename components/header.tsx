'use client'
import Link from "next/link"
import { useUser } from "../lib/useUser"
import { AvatarMenu } from "./avatar-menu"
import ThemeToggle from "./theme-toggle"

export function Header() {
  const { user } = useUser()
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          MyApp
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-fg hover:underline">Dashboard</Link>
          {user?.role === "admin" && <Link href="/dashboard/admin" className="text-fg hover:underline">Admin</Link>}
          <ThemeToggle />
          <AvatarMenu />
        </nav>
      </div>
    </header>
  )
}
