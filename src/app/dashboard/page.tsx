import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/db"
import Project from "@/lib/models/Project"
import ProjectCard from "@/components/ProjectCard"
import { verifyToken } from "@/lib/utils/auth"
import { IProject } from "@/types/project"


export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const decoded = verifyToken(token);
  if (!decoded) redirect("/login");

  await connectDB();

  // Typage propre de la récupération
  const projects = await Project.find().lean() as unknown as IProject[];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Liste des Projets</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard
            key={p._id.toString()}
            project={p}
          />
        ))}
        
        {projects.length === 0 && (
          <p className="text-gray-500 italic">Aucun projet à afficher.</p>
        )}
      </div>
    </div>
  )
}
