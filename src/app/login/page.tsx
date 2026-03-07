"use client"

import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"

export default function LoginPage() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin(e: React.FormEvent) {

    e.preventDefault()

    await axios.post("/api/auth/login", {
      email,
      password,
    })

    router.push("/dashboard")
  }

  return (
    <div className="flex items-center justify-center h-screen">

      <form
        onSubmit={handleLogin}
        className="p-6 border rounded w-80 space-y-4"
      >

        <h1 className="text-xl font-bold">
          Login
        </h1>

        <input
          type="email"
          placeholder="email"
          className="border p-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="password"
          className="border p-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-black text-white p-2 w-full"
        >
          Login
        </button>

      </form>

    </div>
  )
}