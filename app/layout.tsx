import "./globals.css"
import type { ReactNode } from "react"

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-dvh bg-bg text-fg antialiased">{props.children}</main>
      </body>
    </html>
  )
}

