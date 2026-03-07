"use client"

import { useState, useEffect, useMemo  } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [captcha, setCaptcha] = useState("")

  // 1. On utilise un état objet unique pour le captcha
  const [captchaValues, setCaptchaValues] = useState({ a: 0, b: 0 })

  // 2. On génère le captcha uniquement après le montage (côté client)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCaptchaValues({
        a: Math.floor(Math.random() * 10),
        b: Math.floor(Math.random() * 10)
      })
    }, 0)

    return () => clearTimeout(timer)
  }, [])


  const { a: captchaA, b: captchaB } = captchaValues

  function regenerateCaptcha() {
    setCaptchaValues({
      a: Math.floor(Math.random() * 10),
      b: Math.floor(Math.random() * 10)
    })
    setCaptcha("")
  }

  // 3. Calculs dérivés
  const nameValid = name.length >= 3
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length >= 6
  const confirmValid = password === confirmPassword && password !== ""
  
  // On ne valide le captcha que si les chiffres sont générés (> 0 ou via un flag)
  const captchaValid = captchaA + captchaB > 0 && parseInt(captcha) === captchaA + captchaB

  const valid = nameValid && emailValid && passwordValid && confirmValid && captchaValid


  async function handleRegister(e: React.FormEvent) {

    e.preventDefault()

    if (!valid) {
      toast.error("Please fix the form")
      return
    }

    try {

      await axios.post("/api/auth/register", {
        name,
        email,
        password
      })

      toast.success("Account created successfully")

      setTimeout(() => {
        router.push("/login")
      }, 1500)

    } catch (error: unknown) {

      let message = "Registration failed"

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error || message
      }

      toast.error(message)

      regenerateCaptcha()
    }
  }

  function border(valid: boolean, value: string) {

    if (!value) return "border-gray-300"

    return valid
      ? "border-green-500"
      : "border-red-500"
  }

  return (
    <div className="flex items-center justify-center h-[80vh]">

      <form
        onSubmit={handleRegister}
        className="border p-6 rounded w-96 space-y-4 shadow"
      >

        <h1 className="text-xl font-bold text-center">
          Create account
        </h1>

        <input
          type="text"
          placeholder="Name"
          className={`border p-2 w-full ${border(nameValid, name)}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className={`border p-2 w-full ${border(emailValid, email)}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className={`border p-2 w-full ${border(passwordValid, password)}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className={`border p-2 w-full ${border(confirmValid, confirmPassword)}`}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="space-y-2">

          <label className="text-sm flex justify-between">
            Solve: {captchaA} + {captchaB}

            <button
              type="button"
              onClick={regenerateCaptcha}
              className="text-xs text-blue-500"
            >
              refresh
            </button>

          </label>

          <input
            type="number"
            placeholder="Captcha"
            className={`border p-2 w-full ${border(captchaValid, captcha)}`}
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
          />

        </div>

        <button
          disabled={!valid}
          className={`p-2 w-full text-white rounded ${
            valid
              ? "bg-black hover:bg-gray-800"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Create account
        </button>

      </form>

    </div>
  )
}