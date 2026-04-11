import { NextResponse, NextRequest } from "next/server"; // Ajout de NextRequest
import { connectDB } from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const decoded = verifyToken(token) as { email: string } | null;
    if (!decoded) return NextResponse.json({ message: "Token invalide" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const getAll = searchParams.get("all") === "true"; // Vérifie si on demande tout
    const search = searchParams.get("search") || "";

    type UserFilter = {
      email: { $ne: string | undefined };
      name?: { $regex: string; $options: string };
    };

    const query: UserFilter = { email: { $ne: decoded.email } };
    if (search) query.name = { $regex: search, $options: "i" };

    // CAS 1 : Récupérer TOUS les membres (sans pagination)
    if (getAll) {
      const members = await User.find(query)
        .select("_id name email avatar")
        .sort({ name: 1 });
      
      return NextResponse.json(members);
    }

    // CAS 2 : Récupérer avec PAGINATION (ton code actuel)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 12;
    const skip = (page - 1) * limit;

    const [members, totalMembers] = await Promise.all([
      User.find(query)
        .select("_id name email avatar")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      members,
      totalPages: Math.ceil(totalMembers / limit),
      currentPage: page,
    });

  } catch (error) {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
