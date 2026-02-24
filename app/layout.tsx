import "./globals.css"
import type { ReactNode } from "react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-fg antialiased">
        <div className="flex min-h-dvh flex-col">
          <Header />
          <main className="flex-1">{props.children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
