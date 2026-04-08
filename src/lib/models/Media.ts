import { Schema, model, models, Document, Types } from "mongoose";

export interface IMedia extends Document {
  title: string; // Le titre modifiable dans le formulaire
  url: string; // URL de stockage (Cloudinary, AWS, etc.)
  publicId: string; // Pour la suppression sur le service de stockage
  fileType: string; // image/png, application/pdf, etc.
  fileSize: number; // ✅ Ajouté (en bytes)
  project: Types.ObjectId;
  uploadedBy: Types.ObjectId;
}

const MediaSchema = new Schema<IMedia>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true }, // ✅ Ajouté
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Media = models.Media || model<IMedia>("Media", MediaSchema);
export default Media; // <--- Ajoute cette ligne
