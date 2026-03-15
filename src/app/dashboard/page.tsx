import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/db"
import Project from "@/lib/models/Project"
import ProjectCard from "@/components/ProjectCard"
import { verifyToken } from "@/lib/utils/auth"
import { ProjectType } from "@/types/project"
import CreateProjectForm from "@/components/CreateProjectForm"

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

  await connectDB();

  // Filter: If showAll is false, only fetch projects where user matches decoded.id
  const query = showAll ? { user: { $ne: decoded.userId } } : { user: decoded.userId };

const rawProjects = await Project.find(query)
  .populate("user", "name") // Fetches only the 'name' field from the User collection
  .sort({ createdAt: -1 })
  .lean();

// Serialize for Client Components
const projects: ProjectType[] = JSON.parse(JSON.stringify(rawProjects));

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
