import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          MyApp
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-fg hover:underline">
            Dashboard
          </Link>
          <Link href="/auth/sign-in" className="text-fg hover:underline">
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  )
}

