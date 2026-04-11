import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Project from "@/lib/models/Project";
import { Media } from "@/lib/models/Media";

export async function GET() {
  try {
    await connectDB();

    const [totalUsers, totalProjects, totalMedia, activeProjects] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Media.countDocuments(),
      Project.countDocuments({ status: "active" }), // Projets terminés ou actifs
    ]);

    // Calcul du taux (évite la division par zéro)
    const completionRate = totalProjects > 0 
      ? Math.round((activeProjects / totalProjects) * 100) 
      : 0;

    return NextResponse.json({
      totalUsers,
      totalProjects,
      totalMedia,
      completionRate,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur stats" }, { status: 500 });
  }
}
