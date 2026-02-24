'use client'
import { useTheme } from './theme-provider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      className="rounded-lg bg-card px-2 py-1 text-sm hover:bg-border/30"
      title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}

