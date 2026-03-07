"use client"

import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="border-b p-4 flex justify-between items-center">
      
      <Link href="/" className="font-bold text-lg">
        ProjectTracker
      </Link>

      <div className="flex gap-4">
        <Link href="/login" className="hover:underline">
          Login
        </Link>

        <Link href="/register" className="hover:underline">
          Register
        </Link>

        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
      </div>

    </nav>
  )
}