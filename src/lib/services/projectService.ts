import Project from "../models/Project";
// ✅ Importe les types et l'Enum depuis ton fichier de types
import { ProjectType, ProjectStatus } from "@/types/project";

/**
 * Récupère tous les projets
 */
export async function getProjects(): Promise<ProjectType[]> {
  try {
    const data = await Project.find().sort({ createdAt: -1 }).lean();

    // Map each project to ensure _id and dates are strings
    return data.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    })) as ProjectType[];
  } catch (error) {
    throw new Error("Erreur de récupération");
  }
}

/**
 * Crée un nouveau projet
 */
export async function createProject(data: {
  title: string;
  description: string;
  status?: ProjectStatus;
  user: string;
}) {
  try {
    // Dans projectService.ts
    if (!data.title?.trim() || !data.description?.trim()) {
      throw new Error("Le titre et la description sont obligatoires");
    }

    const project = await Project.create({
      title: data.title,
      description: data.description,
      status: data.status || ProjectStatus.ACTIVE,
      user: data.user, // Indispensable pour éviter la ValidationError
    });

    return project.toObject();
  } catch (error) {
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
