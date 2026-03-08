"use client"

import { useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { Loader2, LockKeyhole, Mail } from "lucide-react" // npm install lucide-react

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Validation simple pour activer/désactiver le bouton
  const isFormValid = email.includes("@") && password.length >= 6

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid || loading) return

    setLoading(true)
    try {
      const res = await axios.post("/api/auth/login", { email, password })
      toast.success(res.data.message || "Connexion réussie")
      router.refresh() // <--- CRUCIAL : force Next à relire les cookies
      // cookie frontend pour la navbar
      document.cookie = "isLoggedIn=true; path=/"

      router.refresh()

      window.location.href = "/dashboard"

    } catch (error) {
      let message = "Identifiants invalides"
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error || message
      }
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl w-full max-w-sm space-y-6 shadow-lg border border-gray-100"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Bon retour !</h1>
          <p className="text-sm text-gray-500">Connectez-vous à votre compte</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              required
              className="pl-10 border border-gray-200 p-3 w-full rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <LockKeyhole className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Mot de passe"
              required
              className="pl-10 border border-gray-200 p-3 w-full rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          disabled={!isFormValid || loading}
          className={`flex items-center justify-center p-3 w-full text-white rounded-lg font-semibold transition-all ${isFormValid && !loading
            ? "bg-black hover:bg-gray-800 cursor-pointer shadow-md active:scale-95"
            : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-black font-bold hover:underline cursor-pointer"
          >
            S&apos;inscrire
          </button>
        </p>
      </form>
    </div>
  )
}
