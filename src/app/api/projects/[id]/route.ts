import { connectDB } from "@/lib/db";
import { deleteProject } from "@/lib/services/projectService";
import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises"; // Pour writeFile
import path from "path"; // Pour path
import { cookies } from "next/headers";
import { Types } from "mongoose"; // Pour Types
import { verifyToken } from "@/lib/utils/auth";
import Project from "../../../../lib/models/Project"; // Ton modèle Project
import { Media } from "../../../../lib/models/Media"; // Ton modèle Media

interface RouteParams {
  params: Promise<{ id: string }>; // Next.js 15+ nécessite Promise pour params
}

// 1. Ajoutez userId à l'interface
interface DecodedToken {
  id?: string;
  _id?: string;
  sub?: string;
  userId?: string; // <--- Ajoutez ceci
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10Mo

// 1. Change le type de params en Promise
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectDB();

  // 2. Utilise await pour récupérer l'id
  const { id } = await params;

  console.log("ID reçu par le serveur :", id);
  // 1. Vérification Auth
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const decoded = verifyToken(token as string) as DecodedToken | null;
  const userId = decoded?.userId || decoded?.id || decoded?._id;

  if (!userId)
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  try {
    const formData = await req.formData();

    // 2. Récupération des champs texte
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const progress = parseInt((formData.get("progress") as string) || "0");
    const allowedUsers = JSON.parse(
      (formData.get("allowedUsers") as string) || "[]",
    );

    // 3. Gestion des suppressions (Nettoyage DB + Fichiers physiques)
    const deletedMediaIds = JSON.parse(
      (formData.get("deletedMediaIds") as string) || "[]",
    );
    if (deletedMediaIds.length > 0) {
      const mediasToDelete = await Media.find({
        _id: { $in: deletedMediaIds },
      });
      for (const m of mediasToDelete) {
        try {
          await unlink(path.join(process.cwd(), "public", m.url));
        } catch (e) {
          console.error("Fichier déjà supprimé physiquement");
        }
      }
      await Media.deleteMany({ _id: { $in: deletedMediaIds } });
    }

    // 4. Update Médias Existants (Titres et Remplacements)
    const existingMediaRaw = formData.get("existingMedia");
    if (existingMediaRaw) {
      const existingMedia = JSON.parse(existingMediaRaw as string);
      for (const m of existingMedia) {
        // Vérifier si un fichier de remplacement a été envoyé pour cet ID
        const replacementFile = formData.get(`replace_${m._id}`) as File | null;

        if (replacementFile && replacementFile.size > 0) {
          // Supprimer l'ancien fichier physique
          const oldMedia = await Media.findById(m._id);
          if (oldMedia) {
            try {
              await unlink(path.join(process.cwd(), "public", oldMedia.url));
            } catch (e) {}
          }

          // Upload du nouveau
          const fileData = await uploadFile(replacementFile);
          await Media.findByIdAndUpdate(m._id, {
            title: m.title,
            ...fileData,
          });
        } else {
          // Simple mise à jour du titre
          await Media.findByIdAndUpdate(m._id, { title: m.title });
        }
      }
    }

    // 5. Nouveaux Médias
    const newMediaToCreate = [];
    const newFiles = formData.getAll("newFiles") as File[];
    const newTitles = formData.getAll("newTitles") as string[];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (file.size > MAX_FILE_SIZE) continue;

      const fileData = await uploadFile(file);
      newMediaToCreate.push({
        ...fileData,
        title: newTitles[i] || file.name,
        project: new Types.ObjectId(id),
        uploadedBy: new Types.ObjectId(userId),
      });
    }
    if (newMediaToCreate.length > 0) await Media.insertMany(newMediaToCreate);

    // 6. Update Projet
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { title, description, status, progress, allowedUsers },
       { returnDocument: 'after' } // 👈 Remplace { new: true }
    );

    return NextResponse.json(updatedProject);

    // 1. Remplacement du catch (error: any) par une approche typée
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// 2. Intégration de la validation dans la fonction helper
async function uploadFile(file: File) {
  // Vérification du type MIME (SÉCURITÉ 1)
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Format non supporté : ${file.name}`);
  }

  // Vérification de la taille (SÉCURITÉ 2)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop lourd : ${file.name} (Max 10Mo)`);
  }

  const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
  const fileName = `${Date.now()}-${safeName}`;

  let subFolder = "files";
  if (file.type.startsWith("image/")) subFolder = "images";
  else if (file.type.startsWith("video/")) subFolder = "videos";

  const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

  return {
    url: `/uploads/${subFolder}/${fileName}`,
    publicId: fileName,
    fileType: file.type,
    fileSize: file.size,
  };
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
