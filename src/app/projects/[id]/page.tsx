import { connectDB } from "@/lib/db";
import Project from "@/lib/models/Project";
import Media from "@/lib/models/Media";
import { notFound } from "next/navigation";
import ProjectDetails from "@/components/ProjectDetails";
import { ProjectType, ProjectMedia } from "@/types/project";


// On définit précisément ce que le composant va recevoir après le .populate()
type ProjectWithPopulatedUsers = Omit<ProjectType, 'allowedUsers'> & {
    allowedUsers: Array<{ _id: string; name?: string; email: string }>;
};

interface Props {
    params: Promise<{ id: string }>;
}

// ... tes imports

export default async function ProjectPage({ params }: Props) {
    await connectDB();
    const { id } = await params;

    const projectDoc = await Project.findById(id)
        .populate("user", "name")
        .populate("allowedUsers", "name email") // On récupère les objets
        .lean();

    const mediaDocs = await Media.find({ project: id }).lean();

    if (!projectDoc) notFound();

    // On transforme les documents Mongoose en objets JSON simples
    const projectData = JSON.parse(JSON.stringify(projectDoc));
    const mediaData = JSON.parse(JSON.stringify(mediaDocs));

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4">
                <ProjectDetails
                    // On utilise le type spécifique au lieu de any
                    project={projectData as ProjectWithPopulatedUsers}
                    media={mediaData as ProjectMedia[]}
                />
            </div>
        </main>
    );
}
