'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id?: string
  email?: string
  name?: string
  role?: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let active = true
    async function run() {
      setLoading(true)
      const res = await fetch('/api/auth/me', { cache: 'no-store' }).catch(() => null)
      if (!active) return
      if (!res || !res.ok) {
        setUser(null)
        setLoading(false)
        return
      }
      const data = (await res.json().catch(() => null)) as User | null
      if (!active) return
      setUser(data)
      setLoading(false)
    }
    run()
    return () => {
      active = false
    }
  }, [])

  async function logout() {
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {})
    setUser(null)
    router.push('/auth/sign-in')
  }

  return { user, loading, logout }
}

