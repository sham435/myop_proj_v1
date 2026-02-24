'use client'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type User = { id?: string; email?: string; name?: string; role?: string } | null

type Ctx = {
  user: User
  setUser: (u: User) => void
}

const C = createContext<Ctx | undefined>(undefined)

export function UserProvider(props: { initial: User; children: ReactNode }) {
  const [user, setUser] = useState<User>(props.initial ?? null)
  const value = useMemo(() => ({ user, setUser }), [user])
  return <C.Provider value={value}>{props.children}</C.Provider>
}

export function useUserContext() {
  const v = useContext(C)
  if (!v) throw new Error('UserProvider missing')
  return v
}

