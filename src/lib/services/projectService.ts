import Project, { IProject } from "../models/Project";
import { ProjectType, ProjectStatus } from "@/types/project";
import { Media, IMedia } from "@/lib/models/Media";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";

// Interface pour typer les données brutes de MongoDB
interface ProjectLeanDoc extends Omit<IProject, "user"> {
  _id: Types.ObjectId;
  user: { _id: Types.ObjectId; name: string } | null;
}

// Définissez le type pour les filtres de projets
type ProjectFilter = {
  user?: string | { $ne: string };
};


/**
 * PAGINNATION DES PROJETS
 */

export async function getProjectsPaged({
  userId,
  showAll,
  targetUserId, // Ajout du paramètre
  page = 1,
  limit = 9,
}: {
  userId: string;
  showAll: boolean;
  targetUserId?: string; // Optionnel
  page?: number;
  limit?: number;
}) {
  try {
    await connectDB();
    const skip = (page - 1) * limit;

    // Utilisation du type défini au lieu de 'any'
    let query: ProjectFilter = {};
    
    if (targetUserId) {
      // Cas : Voir les projets d'un membre spécifique
      query = { user: targetUserId };
    } else {
      // Cas : Dashboard classique
      query = showAll ? { user: { $ne: userId } } : { user: userId };
    }

    // 1. Compter le total pour la pagination
    const total = await Project.countDocuments(query);

    // 2. Récupérer les projets paginés
    const projects = await Project.find(query)
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ProjectLeanDoc[]>();

    // 3. Mapper avec les médias (ta logique actuelle)
    const projectsWithMedia = await Promise.all(
      projects.map(async (doc) => {
        const mediaList = await Media.find({ project: doc._id }).lean<
          IMedia[]
        >();
        return {
          _id: doc._id.toString(),
          title: doc.title,
          description: doc.description || "",
          status: doc.status,
          createdAt: doc.createdAt.toISOString(),
          user: doc.user
            ? { _id: doc.user._id.toString(), name: doc.user.name }
            : "Anonyme",
          media: mediaList.map((m) => ({
            _id: m._id.toString(),
            title: m.title,
            url: m.url,
          })),
        };
      }),
    );

    return {
      projects: projectsWithMedia as unknown as ProjectType[],
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error(error);
    return { projects: [], totalPages: 0, currentPage: 1 };
  }
}

/**
 * RÉCUPÈRE UN PROJET PAR SON ID (Mis à jour pour inclure les médias)
 */
export async function getProjectById(id: string): Promise<ProjectType | null> {
  try {
    const project = await Project.findById(id)
      .populate("user", "name")
      .lean<ProjectLeanDoc>();

    if (!project) return null;

    const mediaList = await Media.find({ project: project._id }).lean<
      IMedia[]
    >();

    return {
      ...project,
      _id: project._id.toString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      user: project.user
        ? { _id: project.user._id.toString(), name: project.user.name }
        : "Anonyme",
      media: mediaList.map((m) => ({
        _id: m._id.toString(),
        title: m.title,
        url: m.url,
      })),
    } as unknown as ProjectType;
  } catch (error) {
    return null;
  }
}

export async function createProject(
  projectData: {
    title: string;
    description: string;
    status: ProjectStatus;
    user: string;
    allowedUsers?: string[];
  },
  mediaList: Partial<IMedia>[],
): Promise<IProject> {
  try {
    // 1. Création du projet
    const project = await Project.create(projectData);

    // 2. Création des médias liés au projet
    if (mediaList.length > 0) {
      const mediaWithProjectId = mediaList.map((media) => ({
        ...media,
        project: project._id, // Association avec l'ID MongoDB du projet
      }));

      // insertMany est plus performant que plusieurs .create()
      await Media.insertMany(mediaWithProjectId);
    }

    return project;
  } catch (error) {
    console.error("Erreur Service createProject:", error);
    throw error;
  }
}

/**
 * Met à jour un projet par son ID
 * Retourne le projet mis à jour ou null s'il n'existe pas
 */
export async function updateProject(
  id: string,
  data: Partial<ProjectType>, // Permet d'envoyer seulement les champs à modifier
): Promise<ProjectType | null> {
  try {
    return await Project.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }, // new: true renvoie l'objet APRES modif
    ).lean();
  } catch (error) {
    throw new Error(
      `Erreur lors de la mise à jour du projet (${id}): ${error}`,
    );
  }
}

/**
 * Supprime un projet par son ID
 * Retourne le projet supprimé ou null s'il n'existait pas
 */
export async function deleteProject(id: string): Promise<ProjectType | null> {
  try {
    return await Project.findByIdAndDelete(id).lean();
  } catch (error) {
    throw new Error(
      `Erreur lors de la suppression du projet (${id}): ${error}`,
    );
  }
}


