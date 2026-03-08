import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/utils/auth"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"

export async function GET() {

  const token = (await cookies()).get("token")?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  const decoded = verifyToken(token)

  if (!decoded || typeof decoded !== "object") {
    return NextResponse.json({ user: null })
  }

  await connectDB()

  const user = await User.findById(decoded.userId)
    .select("name email")
    .lean()

  return NextResponse.json({
    user
  })
}