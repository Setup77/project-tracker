import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { verifyToken } from "@/lib/utils/auth";
import Project from "../../../../lib/models/Project";
import { Media, IMedia } from "../../../../lib/models/Media";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface DecodedToken {
  id?: string;
  _id?: string;
  sub?: string;
  userId?: string;
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function PUT(req: Request, { params }: RouteParams) {
  await connectDB();

  const { id } = await params;

  const project = await Project.findById(id);

  if (!project) {
    return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const decoded = verifyToken(token as string) as DecodedToken | null;
  const userId = decoded?.userId || decoded?.id || decoded?._id || decoded?.sub;

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  if (project.user.toString() !== userId) {
    return NextResponse.json(
      { message: "Interdit : Vous n'êtes pas l'auteur de ce projet" },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const progress = parseInt((formData.get("progress") as string) || "0", 10);

    const allowedUsers = JSON.parse(
      (formData.get("allowedUsers") as string) || "[]",
    );

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

      await Media.deleteMany({
        _id: { $in: deletedMediaIds },
      });
    }

    const existingMediaRaw = formData.get("existingMedia");

    if (existingMediaRaw) {
      const existingMedia = JSON.parse(existingMediaRaw as string);

      for (const m of existingMedia) {
        const replacementFile = formData.get(`replace_${m._id}`) as File | null;

        if (replacementFile && replacementFile.size > 0) {
          const oldMedia = await Media.findById(m._id);

          if (oldMedia) {
            try {
              await unlink(path.join(process.cwd(), "public", oldMedia.url));
            } catch (e) {}
          }

          const fileData = await uploadFile(replacementFile);

          await Media.findByIdAndUpdate(m._id, {
            title: m.title,
            ...fileData,
          });
        } else {
          await Media.findByIdAndUpdate(m._id, {
            title: m.title,
          });
        }
      }
    }

    const newMediaToCreate = [];
    const newFiles = formData.getAll("newFiles") as File[];
    const newTitles = formData.getAll("newTitles") as string[];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];

      if (file.size > MAX_FILE_SIZE) {
        continue;
      }

      const fileData = await uploadFile(file);

      newMediaToCreate.push({
        ...fileData,
        title: newTitles[i] || file.name,
        project: new Types.ObjectId(id),
        uploadedBy: new Types.ObjectId(userId),
      });
    }

    if (newMediaToCreate.length > 0) {
      await Media.insertMany(newMediaToCreate);
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        status,
        progress,
        allowedUsers,
      },
      {
        returnDocument: "after",
      },
    );

    return NextResponse.json(updatedProject);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue";

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

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

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { message: "Projet non trouvé" },
        { status: 404 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded = verifyToken(token as string) as DecodedToken | null;
    const userId =
      decoded?.userId || decoded?.id || decoded?._id || decoded?.sub;

    if (!userId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (project.user.toString() !== userId) {
      return NextResponse.json(
        { message: "Interdit : Vous n'êtes pas l'auteur de ce projet" },
        { status: 403 },
      );
    }

    const projectMedias: IMedia[] = await Media.find({
      project: id,
    });

    for (const media of projectMedias) {
      try {
        let subFolder = "files";

        if (media.fileType.startsWith("image/")) {
          subFolder = "images";
        } else if (media.fileType.startsWith("video/")) {
          subFolder = "videos";
        }

        const filePath = path.join(
          process.cwd(),
          "public",
          "uploads",
          subFolder,
          media.publicId,
        );

        await unlink(filePath);
      } catch (err) {
        console.error(`Erreur suppression fichier: ${media.publicId}`, err);
      }
    }

    await Media.deleteMany({
      project: id,
    });

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return NextResponse.json(
        { message: "Projet non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Projet et médias supprimés avec succès",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    return NextResponse.json(
      {
        message: "Erreur lors de la suppression",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

async function uploadFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Format non supporté : ${file.name}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop lourd : ${file.name} (Max 10Mo)`);
  }

  const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();

  const fileName = `${Date.now()}-${safeName}`;

  let subFolder = "files";

  if (file.type.startsWith("image/")) {
    subFolder = "images";
  } else if (file.type.startsWith("video/")) {
    subFolder = "videos";
  }

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
