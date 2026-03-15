"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react"; // Optional: install lucide-react
import { ProjectType, ProjectStatus } from "@/types/project"; // Utilise l'interface pure

interface Props {
  project: ProjectType;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case ProjectStatus.ACTIVE: return "bg-green-100 text-green-700 border-green-200";
    case ProjectStatus.COMPLETED: return "bg-blue-100 text-blue-700 border-blue-200";
    case ProjectStatus.ARCHIVED: return "bg-gray-100 text-gray-700 border-gray-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

export default function ProjectCard({ project }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(project.createdAt));

  async function handleDelete() {
    if (!confirm("Supprimer ce projet définitivement ?")) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/projects/${project._id}`);
      toast.success("Projet supprimé");
      router.refresh();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  }
  // Check if user is populated or just an ID string
  const authorName = typeof project.user === 'object' ? project.user.name : "Anonyme";

  return (
    <div className="group relative border border-gray-200 p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border ${getStatusStyles(project.status || "active")}`}>
          {project.status || "active"}
        </span>


        {/* Action Buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => toast.success("Édition bientôt disponible")} // Placeholder for edit logic
            className="p-1.5 text-gray-400 cursor-pointer hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <h2 className="font-bold text-lg text-gray-900 mb-1">{project.title}</h2>
      <p className="text-gray-500 text-sm line-clamp-2 mb-6">
        {project.description || "Aucune description."}
      </p>

      <div className="flex justify-between items-center text-[11px] text-gray-400 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-600 italic">Par: {authorName}</span>
        </div>
        <time>Créé le {formattedDate}</time>
      </div>


    </div>
  );
}
