'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '../lib/useUser'

export function AvatarMenu() {
  const { user, logout } = useUser()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])
  if (!user) return (
    <div className="flex items-center gap-3">
      <Link href="/auth/sign-in" className="text-fg hover:underline">Sign In</Link>
      <Link href="/auth/sign-up" className="text-fg hover:underline">Sign Up</Link>
    </div>
  )
  const letter = (user.name ?? user.email ?? 'U').slice(0, 1).toUpperCase()
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-fg text-bg"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {letter}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-card p-1 shadow">
          <div className="px-2 py-1 text-xs text-fg-muted">{user.email ?? 'user'}</div>
          <Link role="menuitem" href="/profile" className="block rounded px-2 py-1 text-sm hover:bg-border/30">Profile</Link>
          <Link role="menuitem" href="/settings" className="block rounded px-2 py-1 text-sm hover:bg-border/30">Settings</Link>
          {user.role === 'admin' && (
            <Link role="menuitem" href="/dashboard/admin" className="block rounded px-2 py-1 text-sm hover:bg-border/30">Admin</Link>
          )}
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-border/30"
            onClick={() => logout()}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

