import Project, { IProject } from "../models/Project";
import { ProjectType, ProjectStatus } from "@/types/project";
import { Media, IMedia } from "@/lib/models/Media";
import { Types } from "mongoose";

/**
 * Récupère tous les projets
 */
// Interface pour représenter le projet après le populate
interface PopulatedProject extends Omit<IProject, "user"> {
  _id: Types.ObjectId;
  user: {
    _id: Types.ObjectId;
    name: string;
  } | null;
}

/**
 * Récupère tous les projets avec les utilisateurs associés
 */
export async function getProjects(): Promise<ProjectType[]> {
  try {
    const data = await Project.find()
      .populate<{ user: { _id: Types.ObjectId; name: string } }>("user", "name")
      .sort({ createdAt: -1 })
      .lean<PopulatedProject[]>(); // ✅ Utilisation du type peuplé

    return data.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),

      // ✅ Sécurisation typée du user
      user: doc.user
        ? {
            _id: doc.user._id.toString(),
            name: doc.user.name,
          }
        : "unknown",
    })) as unknown as ProjectType[];
  } catch (error) {
    console.error("Erreur getProjects:", error);
    throw new Error("Erreur de récupération des projets");
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
 * Récupère un projet spécifique par son ID
 */
export async function getProjectById(id: string): Promise<ProjectType | null> {
  return await Project.findById(id).lean();
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
