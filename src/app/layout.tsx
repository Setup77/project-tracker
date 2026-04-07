import "./globals.css"
import { Toaster } from "react-hot-toast"
import Navbar from "@/components/Navbar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="fr">
      <body>

        <Navbar />

        <main className="max-w-6xl mx-auto p-6">
          {children}
        </main>

        <Toaster position="top-right" />

      </body>
    </html>
  )
}