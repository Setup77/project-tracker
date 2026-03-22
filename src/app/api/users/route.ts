import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();

    // 1. Extraire le token des cookies (ajustez le nom "token" selon votre stockage)
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Non autorisé (Token manquant)" }, { status: 401 });
    }

    // 2. Vérifier le token avec votre utilitaire
    const decoded = verifyToken(token) as { email: string } | null;

    if (!decoded || !decoded.email) {
      return NextResponse.json({ message: "Non autorisé (Token invalide)" }, { status: 401 });
    }

    // 3. Récupérer tous les users SAUF celui dont l'email est dans le token
    const users = await User.find({ 
      email: { $ne: decoded.email } 
    }).select("_id name email");

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erreur API Users:", error); // Utilisation de error pour éviter l'erreur de build
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
