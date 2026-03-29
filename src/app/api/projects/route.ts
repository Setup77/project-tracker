import { connectDB } from "@/lib/db";
import { Types } from "mongoose";
import { getProjects, createProject } from "@/lib/services/projectService";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { ProjectStatus } from "@/types/project";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// 1. Ajoutez userId à l'interface
interface DecodedToken {
  id?: string;
  _id?: string;
  sub?: string;
  userId?: string; // <--- Ajoutez ceci
}

// ✅ Liste blanche des types autorisés
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export async function GET() {
  try {
    await connectDB();
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    // 1. Vérification Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded = verifyToken(token as string) as DecodedToken | null;
    const userId = decoded?.userId || decoded?.id || decoded?._id;

    if (!userId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // 2. Récupération du FormData
    const formData = await req.formData();
    const mediaListToCreate = [];

    const title = formData.get("title");
    const description = formData.get("description");
    const status = formData.get("status");

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof status !== "string"
    ) {
      return NextResponse.json(
        { message: "Champs invalides" },
        { status: 400 },
      );
    }

    if (!title || !description) {
      return NextResponse.json(
        { message: "Données manquantes" },
        { status: 400 },
      );
    }

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_")) {
        const file = value as File;

        // 🛡️ SÉCURITÉ 1 : Vérifier le type MIME
        if (!ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json(
            { message: `Format non supporté : ${file.name}` },
            { status: 400 },
          );
        }

        // 🛡️ SÉCURITÉ 2 : Vérifier la taille (côté serveur)
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { message: `Fichier trop lourd : ${file.name}` },
            { status: 400 },
          );
        }

        // 🛡️ SÉCURITÉ 3 : Nettoyer le nom du fichier (anti-injection de chemin)
        const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
        const fileName = `${Date.now()}-${safeName}`;

        let subFolder = "files";
        if (file.type.startsWith("image/")) subFolder = "images";
        else if (file.type.startsWith("video/")) subFolder = "videos";

        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          subFolder,
        );
        const filePath = path.join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, Buffer.from(bytes));

        const titleValue = formData.get(`title_${key.split("_")[1]}`);

        const safeTitle =
          typeof titleValue === "string" && titleValue.trim() !== ""
            ? titleValue
            : file.name;

        // On prépare l'objet média pour le service
        mediaListToCreate.push({
          title: safeTitle, // ✅ toujours string,
          url: `/uploads/${subFolder}/${fileName}`,
          publicId: fileName,
          fileType: file.type,
          fileSize: file.size,
          uploadedBy: new Types.ObjectId(userId),
        });
      }
    }

    const newProject = await createProject(
      {
        title,
        description,
        status: status as ProjectStatus,
        user: userId,
        allowedUsers: JSON.parse((formData.get("userIds") as string) || "[]"),
      },
      mediaListToCreate,
    );

    return NextResponse.json(
      {
        message: "Projet créé avec succès",
        project: newProject,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("Erreur POST Project:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
