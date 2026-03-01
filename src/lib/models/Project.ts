import { Schema, model, models } from "mongoose";

// 1. Define the Interface
export interface IProject {
  _id: string; 
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

// 2. Export the model
const Project = models.Project || model<IProject>("Project", ProjectSchema);
export default Project;
