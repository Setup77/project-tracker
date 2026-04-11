import { Schema, model, models } from "mongoose";

// 1. Define the Interface (avoids 'any' later)
export interface IUser {
  _id: string;
  name?: string;
  email: string;
  password?: string;
  avatar: string; 
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true, index: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "default.jpg" }, 
  },
  { timestamps: true },
);

// 2. Export the model
const User = models.User || model<IUser>("User", UserSchema);
export default User;
