import { Schema, model, models, Document, Types } from "mongoose";
import { ProjectStatus } from "@/types/project";

export interface IProject extends Document {
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: number; 
  user: Types.ObjectId;
  allowedUsers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.ACTIVE,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    // ✅ Très important pour que les virtuals apparaissent dans les résultats JSON (API)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ProjectSchema.virtual("media", {
  ref: "Media",
  localField: "_id",
  foreignField: "project",
});

const Project = models.Project || model<IProject>("Project", ProjectSchema);
export default Project;
