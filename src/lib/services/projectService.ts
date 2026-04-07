import Project, { IProject } from "../models/Project";
import { ProjectType, ProjectStatus } from "@/types/project";
import { Media, IMedia } from "@/lib/models/Media";
import { Types } from "mongoose";

// Interface pour typer les données brutes de MongoDB
interface ProjectLeanDoc extends Omit<IProject, "user"> {
  _id: Types.ObjectId;
  user: { _id: Types.ObjectId; name: string } | null;
}

/**
 * RÉCUPÈRE TOUS LES PROJETS (C'est cette fonction qui manquait)
 */
export async function getProjects(): Promise<ProjectType[]> {
  try {

    const projects = await Project.find()
      .populate<{ user: { _id: Types.ObjectId; name: string } }>("user", "name")
      .sort({ createdAt: -1 })
      .lean<ProjectLeanDoc[]>();

    const projectsWithMedia = await Promise.all(
      projects.map(async (doc) => {
        const mediaList = await Media.find({ project: doc._id }).lean<
          IMedia[]
        >();

        return {
          // On ne fait plus ...doc pour éviter de traîner des ObjectIDs complexes
          _id: doc._id.toString(),
          title: doc.title,
          description: doc.description || "",
          status: doc.status,
          // Nettoyage de allowedUsers pour éviter l'erreur "Only plain objects"
          allowedUsers: (doc.allowedUsers || []).map((id) => id.toString()),

          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),

          user: doc.user
            ? {
                _id: doc.user._id.toString(),
                name: doc.user.name,
              }
            : "Anonyme",

          media: mediaList.map((m) => ({
            _id: m._id.toString(),
            title: m.title,
            url: m.url,
          })),
        };
      }),
    );

    return projectsWithMedia as unknown as ProjectType[];
  } catch (error) {
    console.error("Erreur getProjects:", error);
    return [];
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
