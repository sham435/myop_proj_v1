'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type Ctx = { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void }

const ThemeContext = createContext<Ctx | undefined>(undefined)

export function ThemeProvider(props: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  useEffect(() => {
    const stored = (typeof localStorage !== 'undefined' && (localStorage.getItem('theme') as Theme | null)) || null
    if (stored) setTheme(stored)
    else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark')
  }, [])
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])
  const toggleTheme = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'))
  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{props.children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

