import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("token") // Méthode la plus fiable en Next 15

  return NextResponse.json({ message: "Déconnexion réussie" })
}
