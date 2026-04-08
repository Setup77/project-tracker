export enum ProjectStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export interface ProjectMedia {
  _id: string;
  title: string;
  url: string;
  fileType: string;
  fileSize: number;
}

export interface ProjectType {
  _id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  user:

    | {
        _id: string;
        name: string;
      }
    | string;
  media: ProjectMedia[]; // ✅ Utilise l'interface détaillée ici
  createdAt: Date;
  updatedAt: Date;
}
