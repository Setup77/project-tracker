import { connectDB } from "@/lib/db";
import { updateProject, deleteProject } from "@/lib/services/projectService";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>; // Next.js 15+ nécessite Promise pour params
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updatedProject = await updateProject(id, body);

    if (!updatedProject) {
      return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
    }

    return NextResponse.json(updatedProject);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedProject = await deleteProject(id);

    if (!deletedProject) {
      return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ message: "Projet supprimé avec succès" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { message: "Erreur lors de la suppression", error: errorMessage },
      { status: 500 }
    );
  }
}
