import "./globals.css"
import type { ReactNode } from "react"
import { Inter, Playfair_Display } from "next/font/google"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { UserProvider } from "../lib/user-context"
import { ThemeProvider } from "../components/theme-provider"
import { currentUser } from "../lib/server/user"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

export default async function RootLayout(props: { children: ReactNode }) {
  const user = await currentUser()
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-bg text-fg antialiased font-sans">
        <ThemeProvider>
          <UserProvider initial={user}>
            <div className="flex min-h-dvh flex-col">
              <Header />
              <main className="flex-1">{props.children}</main>
              <Footer />
            </div>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
