'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useUser } from '../lib/useUser'

export function AvatarMenu() {
  const { user, logout } = useUser()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const typeaheadRef = useRef<{ keys: string; t?: number }>({ keys: '' })
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
  function onBtnKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
      requestAnimationFrame(() => {
        const first = ref.current?.querySelector('[data-menuitem]') as HTMLElement | null
        first && first.focus()
      })
    }
  }
  function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(ref.current?.querySelectorAll('[data-menuitem]') ?? []) as HTMLElement[]
    const idx = items.findIndex((el) => el === document.activeElement)
    if (e.key === 'Tab') {
      e.preventDefault()
      const next = e.shiftKey ? items[(idx - 1 + items.length) % items.length] : items[(idx + 1) % items.length]
      next && next.focus()
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      const trig = triggerRef.current
      trig && trig.focus()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = items[(idx + 1) % items.length]
      next && next.focus()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = items[(idx - 1 + items.length) % items.length]
      prev && prev.focus()
    }
    if (e.key === 'Home') {
      e.preventDefault()
      items[0] && items[0].focus()
    }
    if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1] && items[items.length - 1].focus()
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const ta = typeaheadRef.current
      ta.keys += e.key.toLowerCase()
      clearTimeout(ta.t)
      ta.t = window.setTimeout(() => {
        ta.keys = ''
      }, 500)
      const match = items.find((el) => (el.textContent ?? '').trim().toLowerCase().startsWith(ta.keys))
      if (match) {
        e.preventDefault()
        match.focus()
      }
    }
  }
  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-fg text-bg"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onBtnKeyDown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="user-menu"
      >
        {letter}
      </button>
      {open && (
        <div
          id="user-menu"
          role="menu"
          onKeyDown={onMenuKeyDown}
          className="menu-pop absolute right-0 mt-2 w-44 rounded-md border border-border bg-card p-1 shadow outline-none"
          tabIndex={-1}
        >
          <div className="px-2 py-1 text-xs text-fg-muted">{user.email ?? 'user'}</div>
          <Link data-menuitem tabIndex={0} role="menuitem" href="/profile" className="block rounded px-2 py-1 text-sm hover:bg-border/30">Profile</Link>
          <Link data-menuitem tabIndex={0} role="menuitem" href="/settings" className="block rounded px-2 py-1 text-sm hover:bg-border/30">Settings</Link>
          {user.role === 'admin' && (
            <Link data-menuitem tabIndex={0} role="menuitem" href="/dashboard/admin" className="block rounded px-2 py-1 text-sm hover:bg-border/30">Admin</Link>
          )}
          <button
            data-menuitem
            tabIndex={0}
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
