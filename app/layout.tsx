import "./globals.css"
import type { ReactNode } from "react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { UserProvider } from "../lib/user-context"
import { currentUser } from "../lib/server/user"

export default async function RootLayout(props: { children: ReactNode }) {
  const user = await currentUser()
  return (
    <html lang="en">
      <body className="bg-bg text-fg antialiased">
        <UserProvider initial={user}>
          <div className="flex min-h-dvh flex-col">
            <Header />
            <main className="flex-1">{props.children}</main>
            <Footer />
          </div>
        </UserProvider>
      </body>
    </html>
  )
}
