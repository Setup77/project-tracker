import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/utils/auth";
import { getProjectsPaged } from "@/lib/services/projectService";
import ProjectList from "@/components/ProjectList";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/db";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function MemberProjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ userId?: string; page?: string }>;
}) {
    const { userId: targetUserId, page: pageParam } = await searchParams;
    const currentPage = Number(pageParam) || 1;

    // 1. Si pas d'ID, on retourne aux membres
    if (!targetUserId) redirect("/members");

    // 2. Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/login");

    const decoded = verifyToken(token) as { userId: string };

    // 3. Chercher le nom du membre pour le titre
    await connectDB();
    const member = await User.findById(targetUserId).select("name").lean() as { name: string } | null;

    // 4. Récupérer les projets via le service
    const { projects, totalPages } = await getProjectsPaged({
        userId: decoded.userId,
        showAll: false, // Inutile ici car targetUserId est prioritaire
        targetUserId: targetUserId,
        page: currentPage,
        limit: 9
    });

    // 5. Helper pour construire les URLs de pagination (doit pointer vers /projects)
    const getPageLink = (p: number) => {
        return `/projects?userId=${targetUserId}&page=${p}`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Projets de <span className="text-blue-600 uppercase">{member?.name || "Membre"}</span>
                    </h1>
                    <p className="text-gray-500">Liste des travaux publiés par cet utilisateur.</p>
                </div>
                <a href="/members" className="text-sm font-medium text-gray-600 hover:underline">
                    ← Retour aux membres
                </a>
            </div>

            {projects.length > 0 ? (
                <ProjectList initialProjects={projects} />
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
                    <p className="text-gray-500">Aucun projet trouvé pour ce membre.</p>
                </div>
            )}

            {/* BLOC PAGINATION */}
            {totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 mt-16">
                    <div className="flex items-center gap-2">
                        <a
                            href={currentPage > 1 ? getPageLink(currentPage - 1) : "#"}
                            className={`p-2 rounded-lg border transition-all ${currentPage === 1
                                ? "opacity-30 cursor-not-allowed pointer-events-none"
                                : "hover:bg-gray-50 text-gray-600"
                                }`}
                        >
                            <ChevronLeft size={20} />
                        </a>

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
