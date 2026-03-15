export enum ProjectStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export interface ProjectType {
  _id: string;
  title: string;
  description?: string;
  status: ProjectStatus; // Utilise l'Enum ici
  // User can be populated with name/email
  user:
    | {
        _id: string;
        name: string;
      }
    | string;
  createdAt: Date;
  updatedAt: Date;
}
