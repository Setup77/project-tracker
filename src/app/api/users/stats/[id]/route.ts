import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/lib/models/Project";
import { Media } from "@/lib/models/Media";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const [totalProjects, totalMedia] = await Promise.all([
      Project.countDocuments({ user: id }),
      Media.countDocuments({ uploadedBy: id }),
    ]);

    return NextResponse.json({ totalProjects, totalMedia });
  } catch (error) {
    return NextResponse.json({ totalProjects: 0, totalMedia: 0 }, { status: 500 });
  }
}
