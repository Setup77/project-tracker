"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import axios from "axios"
import toast from "react-hot-toast"
import { LogOut } from "lucide-react"

interface User {
  name: string
  email: string
}

export default function Navbar() {

  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {

    async function fetchUser() {
      try {
        const res = await axios.get("/api/auth/me")
        setUser(res.data.user)
      } catch {
        setUser(null)
      }
    }

    fetchUser()

  }, [pathname])

  async function handleLogout() {
    try {

      await axios.post("/api/auth/logout")

      toast.success("Déconnexion réussie")

      setUser(null)

      router.push("/login")
      router.refresh()

    } catch {
      toast.error("Erreur lors de la déconnexion")
    }
  }

  return (
    <nav className="border-b p-4 flex justify-between items-center bg-white">

      <Link href="/" className="font-bold text-lg">
        ProjectTracker
      </Link>

      {/* centre navbar */}
      <div className="font-semibold text-gray-700">
        {user?.name}
      </div>

      <div className="flex gap-4 items-center">


        <Link href="/members" className="hover:underline text-gray-600">
          Membres
        </Link>

        {/* Added link for the logged-in user's profile */}
        {user && (
          <Link href="/profile" className="hover:underline text-gray-600">
            Mon Profil
          </Link>
        )}

        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>

        {!user ? (
          <>
            <Link href="/login" className="hover:underline text-blue-600">
              Connexion
            </Link>

            <Link href="/register" className="hover:underline">
              Inscription
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 cursor-pointer font-medium"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        )}

      </div>

    </nav>
  )
}