import { Schema, model, models, Document, Types } from "mongoose";
import { ProjectStatus } from "@/types/project";

export interface IProject extends Document {
  title: string;
  description?: string;
  status: ProjectStatus;
  user: Types.ObjectId;   // ✅ manquant
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

  },
  { timestamps: true }
);

const Project = models.Project || model<IProject>("Project", ProjectSchema);

export default Project;