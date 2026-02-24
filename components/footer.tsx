export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-fg-muted">
        © {new Date().getFullYear()} MyApp
      </div>
    </footer>
  )
}

