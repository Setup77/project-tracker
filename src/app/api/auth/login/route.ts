import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import { comparePassword } from "@/lib/utils/hash"
import { generateToken } from "@/lib/utils/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {

  try {

    await connectDB()

    const { email, password } = await req.json()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
    })

    const response = NextResponse.json({
      message: "Login success",
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response

  } catch (error) {

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    )

  }
}