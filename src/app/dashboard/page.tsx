import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/db"
import Project from "@/lib/models/Project"
import ProjectCard from "@/components/ProjectCard"
import "@/lib/models/User";
import { verifyToken } from "@/lib/utils/auth"
import { ProjectType } from "@/types/project"
import CreateProjectForm from "@/components/CreateProjectForm"
import { getProjects } from "@/lib/services/projectService"; // Importez le service


// ... imports
import ProjectList from "@/components/ProjectList";



export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

// Remplacez :
// const decoded = verifyToken(token) as { id: string };
// Par :
const decoded = verifyToken(token) as { userId: string }; 

if (!decoded || !decoded.userId) redirect("/login");

  const { view } = await searchParams;
  const showAll = view === "all";

  // ✅ UTILISATION DU SERVICE AU LIEU DE Project.find()
  // On récupère TOUS les projets (qui incluent déjà les médias grâce au service)
  const allProjectsWithMedia = await getProjects();

  // ✅ FILTRAGE MANUEL (pour respecter votre logique showAll)
  const projects = allProjectsWithMedia.filter((p) => {
    const projectUserId = typeof p.user === "object" ? p.user._id : p.user;
    
    if (showAll) {
      return projectUserId !== decoded.userId; // Autres projets
    }
    return projectUserId === decoded.userId; // Mes projets
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* 1. Header with Toggle Link */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {showAll ? "Projets de la communauté" : "Mes Projets"}
        </h1>
        <a
          href={showAll ? "/dashboard" : "/dashboard?view=all"}
          className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
        >
          {showAll ? "← Voir mes projets" : "Voir les projets des autres →"}
        </a>
      </div>

      {/* 2. Hide Form if viewing others' projects */}
      {!showAll && (
        <section className="mb-12">
          <CreateProjectForm />
        </section>
      )}

      {/* 3. Filtered List */}
      <ProjectList initialProjects={projects} />
    </div>
  );
}
