import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/utils/hash";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name, email, password } = await req.json();

    // 1. Validation de base côté serveur (Sécurité)
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 6 caractères" },
        { status: 400 }
      );
    }

    // 2. Vérification de l'existence (insensible à la casse)
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // 3. Hachage et Création
    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
    });

    // 4. Sécurité : Ne jamais renvoyer le mot de passe dans la réponse
    const { password: _, ...userWithoutPassword } = user._doc;

    return NextResponse.json(
      { 
        message: "Compte créé avec succès", 
        user: userWithoutPassword 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur Register:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" }, 
      { status: 500 }
    );
  }
}
