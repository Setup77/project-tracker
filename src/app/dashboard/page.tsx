import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import "@/lib/models/User";
import { verifyToken } from "@/lib/utils/auth"
import CreateProjectForm from "@/components/CreateProjectForm"
import { getProjectsPaged } from "@/lib/services/projectService"; // Importez le service
import ProjectList from "@/components/ProjectList";
import { ChevronLeft, ChevronRight } from "lucide-react";



export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const { view, page: pageParam } = await searchParams;
  const currentPage = Number(pageParam) || 1;
  const showAll = view === "all";

  // Auth & Token (Ta logique existante)
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = verifyToken(token) as { userId: string };

  // Récupération des données paginées
  const { projects, totalPages } = await getProjectsPaged({
    userId: decoded.userId,
    showAll,
    page: currentPage,
    limit: 9
  });

  // Helper pour construire les URLs de pagination
  const getPageLink = (p: number) => {
    const params = new URLSearchParams();
    if (showAll) params.set("view", "all");
    params.set("page", p.toString());
    return `/dashboard?${params.toString()}`;
  };

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

      <ProjectList initialProjects={projects} />

      {/* BLOC PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-16">
          <div className="flex items-center gap-2">

            {/* Bouton Précédent */}
            <a
              href={currentPage > 1 ? getPageLink(currentPage - 1) : "#"}
              className={`p-2 rounded-lg border transition-all ${currentPage === 1
                  ? "opacity-30 cursor-not-allowed pointer-events-none"
                  : "hover:bg-gray-50 text-gray-600"
                }`}
            >
              <ChevronLeft size={20} />
            </a>

            {/* Numéros de pages */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={getPageLink(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border font-medium transition-all ${currentPage === p
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                      : "bg-white text-gray-500 hover:border-blue-300 hover:text-blue-600"
                    }`}
                >
                  {p}
                </a>
              ))}
            </div>

            {/* Bouton Suivant */}
            <a
              href={currentPage < totalPages ? getPageLink(currentPage + 1) : "#"}
              className={`p-2 rounded-lg border transition-all ${currentPage === totalPages
                  ? "opacity-30 cursor-not-allowed pointer-events-none"
                  : "hover:bg-gray-50 text-gray-600"
                }`}
            >
              <ChevronRight size={20} />
            </a>
          </div>

          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            Page {currentPage} sur {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}
