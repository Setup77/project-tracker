import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function PUT(req: Request) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded = verifyToken(token as string) as { userId: string };

    if (!decoded)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const file = formData.get("avatar") as File | null;

    const user = await User.findById(decoded.userId);
    let avatarName = user.avatar;

    // Handle File Upload
    if (file && file.size > 0) {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/avatar");
      await mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

      // Delete old avatar if it's not the default one
      if (user.avatar && user.avatar !== "default.jpg") {
        try {
          await unlink(path.join(uploadDir, user.avatar));
        } catch (e) {
          console.error("Old file already gone");
        }
      }
      avatarName = fileName;
    }

    console.log("Saving new avatar name to DB:", avatarName);

    // app/api/users/profile/route.ts

    // ... inside the PUT function after file processing
    console.log("Saving new avatar name to DB:", avatarName); // Debug: check if this is correct

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      {
        name: name,
        avatar: avatarName, // Si le nom passe, ceci DOIT passer si le schéma est correct
      },
      {
        returnDocument: "after", // Remplace 'new: true'
        runValidators: true,
      },
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating profile" },
      { status: 500 },
    );
  }
}
