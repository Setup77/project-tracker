"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Loader2, RefreshCw } from "lucide-react" // Pense à installer lucide-react

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    captcha: ""
  })

  const [captchaValues, setCaptchaValues] = useState({ a: 0, b: 0 })

  useEffect(() => {
    regenerateCaptcha()
  }, [])

  function regenerateCaptcha() {
    setCaptchaValues({
      a: Math.floor(Math.random() * 10),
      b: Math.floor(Math.random() * 10)
    })
    setFormData(prev => ({ ...prev, captcha: "" }))
  }

  // Validations mémoïsées pour la performance
  const validations = {
    name: formData.name.length >= 3,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    password: formData.password.length >= 6,
    confirm: formData.password === formData.confirmPassword && formData.password !== "",
    captcha: parseInt(formData.captcha) === captchaValues.a + captchaValues.b
  }

  const isFormValid = Object.values(validations).every(Boolean)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid || loading) return

    setLoading(true)
    try {
      const res = await axios.post("/api/auth/register", formData)
      toast.success(res.data.message || "Compte créé avec succès")
      router.push("/login")
    } catch (error: unknown) {
      let message = "Échec de l'inscription"
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error || message
      }

      toast.error(message)
      regenerateCaptcha()
    } finally {
      setLoading(false)
    }
  }

  const getBorderStyle = (isValid: boolean, value: string) => {
    if (!value) return "border-gray-200 focus:border-black"
    return isValid ? "border-green-500" : "border-red-500"
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh] bg-gray-50 px-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl w-full max-w-md space-y-5 shadow-lg border border-gray-100"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
          <p className="text-sm text-gray-500">Rejoignez-nous en quelques clics</p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Nom complet"
              className={`border p-3 w-full rounded-lg outline-none transition-all ${getBorderStyle(validations.name, formData.name)}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {!validations.name && formData.name && <p className="text-[10px] text-red-500 mt-1">Minimum 3 caractères</p>}
          </div>

          <input
            type="email"
            placeholder="Email"
            className={`border p-3 w-full rounded-lg outline-none transition-all ${getBorderStyle(validations.email, formData.email)}`}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Mot de passe (6+ caractères)"
            className={`border p-3 w-full rounded-lg outline-none transition-all ${getBorderStyle(validations.password, formData.password)}`}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            className={`border p-3 w-full rounded-lg outline-none transition-all ${getBorderStyle(validations.confirm, formData.confirmPassword)}`}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />

          <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Sécurité : {captchaValues.a} + {captchaValues.b} = ?</span>
              <button type="button" onClick={regenerateCaptcha} className="text-gray-400 hover:text-black transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
            <input
              type="number"
              placeholder="Résultat"
              className={`border p-2 w-full rounded outline-none ${getBorderStyle(validations.captcha, formData.captcha)}`}
              value={formData.captcha}
              onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
            />
          </div>
        </div>

        <button
          disabled={!isFormValid || loading}
          className={`group flex items-center justify-center p-3 w-full text-white rounded-lg font-semibold transition-all duration-200 ${isFormValid && !loading
              ? "bg-black hover:bg-gray-800 cursor-pointer shadow-md active:scale-95"
              : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          {loading ? "Traitement..." : "Créer mon compte"}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Déjà un compte ? <a href="/login" className="text-black font-bold hover:underline">Se connecter</a>
        </p>
      </form>
    </div>
  )
}
