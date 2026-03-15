import { connectDB } from "@/lib/db";
import { getProjects, createProject } from "@/lib/services/projectService";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

// 1. Ajoutez userId à l'interface
interface DecodedToken {
  id?: string;
  _id?: string;
  sub?: string;
  userId?: string; // <--- Ajoutez ceci
}

export async function GET() {
  await connectDB();
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Veuillez vous connecter (Token manquant)" },
        { status: 401 },
      );
    }

    // Use the interface instead of 'any'
    const decoded = verifyToken(token) as DecodedToken | null;
    console.log("CONTENU DU TOKEN ->", decoded);
    // Check multiple possible ID keys safely
    const userId =
      decoded?.userId || decoded?.id || decoded?._id || decoded?.sub;

    if (!userId) {
      return NextResponse.json(
        { message: "Session invalide (ID absent du token)" },
        { status: 401 },
      );
    }

    const body = await req.json();

    // Ensure title and description are present for server-side validation
    if (!body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        { message: "Titre et description obligatoires" },
        { status: 400 },
      );
    }

    const project = await createProject({
      ...body,
      user: userId,
    });

    return NextResponse.json(project);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("Erreur POST Project:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
