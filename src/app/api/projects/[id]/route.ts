import { connectDB } from "@/lib/db";
import { deleteProject } from "@/lib/services/projectService";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises"; // Pour writeFile
import path from "path"; // Pour path
import { Types } from "mongoose"; // Pour Types
import Project from "../../../../lib/models/Project"; // Ton modèle Project
import { Media } from "../../../../lib/models/Media"; // Ton modèle Media

interface RouteParams {
  params: Promise<{ id: string }>; // Next.js 15+ nécessite Promise pour params
}

// --- AJOUTE CETTE FONCTION GET ---
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    // Récupère le projet par son ID
   const project = await Project.findById(id).populate("media"); 

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  await connectDB();
  const { id } = await params;

  const formData = await req.formData();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;

  const deletedMedia = JSON.parse(
    (formData.get("deletedMedia") as string) || "[]",
  );

  // 🗑️ supprimer anciens médias
  if (deletedMedia.length > 0) {
    await Media.deleteMany({ _id: { $in: deletedMedia } });
  }

  // 📁 nouveaux médias
  const newMediaList = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("file_")) {
      const file = value as File;

      const fileName = `${Date.now()}-${file.name}`;
      const uploadPath = path.join(
        process.cwd(),
        "public/uploads/files",
        fileName,
      );

      const bytes = await file.arrayBuffer();
      await writeFile(uploadPath, Buffer.from(bytes));

      const titleValue = formData.get(`title_${key.split("_")[1]}`);

      newMediaList.push({
        title: titleValue || file.name,
        url: `/uploads/files/${fileName}`,
        publicId: fileName,
        fileType: file.type,
        fileSize: file.size,
        project: new Types.ObjectId(id),
      });
    }
  }

  if (newMediaList.length > 0) {
    await Media.insertMany(newMediaList);
  }

  // ✏️ update projet
  const updatedProject = await Project.findByIdAndUpdate(
    id,
    { title, description, status },
    { new: true },
  );

  return NextResponse.json(updatedProject);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedProject = await deleteProject(id);

    if (!deletedProject) {
      return NextResponse.json(
        { message: "Projet non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Projet supprimé avec succès" });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { message: "Erreur lors de la suppression", error: errorMessage },
      { status: 500 },
    );
  }
}
