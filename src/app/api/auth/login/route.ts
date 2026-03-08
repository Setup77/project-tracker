import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { comparePassword } from "@/lib/utils/hash";
import { generateToken } from "@/lib/utils/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // Importation nécessaire

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email: email.toLowerCase() }); // Normalisation de l'email

    if (!user) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 },
      );
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 },
      );
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
    });

    // Utilisation de l'utilitaire cookies() pour Next.js 15
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax", // Crucial pour la redirection
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ message: "Connexion réussie" });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Connexion échouée" }, { status: 500 });
  }
}
