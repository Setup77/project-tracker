import { Schema, model, models, Document, Types } from "mongoose";
import { ProjectStatus } from "@/types/project";

export interface IProject extends Document {
  title: string;
  description?: string;
  status: ProjectStatus;
  user: Types.ObjectId; // Le créateur (Owner)
  allowedUsers: Types.ObjectId[]; // ✅ Les utilisateurs autorisés via le formulaire
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.ACTIVE,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ✅ Liste des IDs sélectionnés dans ton formulaire
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const Project = models.Project || model<IProject>("Project", ProjectSchema);

export default Project;
