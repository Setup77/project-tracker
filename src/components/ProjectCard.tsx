"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Paperclip } from "lucide-react";
import { ProjectType, ProjectStatus } from "@/types/project";

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
  const [rotation, setRotation] = useState("rotate-0");

  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(project.createdAt));

  useEffect(() => {
    const rotations = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2"];
    const randomChoice = rotations[Math.floor(Math.random() * rotations.length)];
    setRotation(randomChoice);
  }, []);

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

  const authorName = typeof project.user === "object" ? project.user.name : "Anonyme";
  const mediaCount = project.media?.length || 0;

  const truncatedDescription = project.description && project.description.length > 200
    ? project.description.substring(0, 200) + "..."
    : project.description || "Aucune description.";

  return (
    <div
      className={`
        group relative p-6 bg-white border-l-4 border-l-blue-500 
        transition-all duration-500 ease-out
        ${rotation} hover:rotate-0 hover:-translate-y-3
        shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]
        hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
        min-h-[250px] flex flex-col
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white before:to-gray-50 before:opacity-0 hover:before:opacity-100
      `}
    >
      {/* Punaise / Épingle */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-red-700 shadow-md z-10 group-hover:bg-red-400 transition-colors" />

      {/* Header : Status & Actions */}
      <div className="relative flex justify-between items-start mb-4 z-10">
        <span className={`text-[10px] uppercase tracking-tighter font-bold px-2 py-0.5 rounded border ${getStatusStyles(project.status)}`}>
          {project.status}
        </span>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={() => toast.success("Édition bientôt disponible")} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
            <Pencil size={14} />
          </button>
          <button onClick={handleDelete} disabled={isDeleting} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all disabled:opacity-50">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-grow z-10">
        <Link href={`/projects/${project._id}`}>
          <h2 className="font-serif font-bold text-lg text-gray-900 leading-tight mb-2 hover:text-blue-600 transition-colors cursor-pointer decoration-blue-200 underline-offset-4 hover:underline">
            {project.title}
          </h2>
        </Link>

        <div
          className="text-gray-600 text-sm italic leading-relaxed"
          dangerouslySetInnerHTML={{ __html: truncatedDescription }}
        />
      </div>

      {/* Footer */}
      <div className="relative mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between items-end z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Auteur</span>
          <span className="text-xs text-gray-700 font-semibold">{authorName}</span>
        </div>

        <div className="flex flex-col items-end gap-1">
          {mediaCount > 0 && (
            <div className="flex items-center gap-1 text-blue-600 animate-pulse-slow">
              <Paperclip size={12} className="rotate-12" />
              <span className="text-[10px] font-bold">
                {`${mediaCount} média${mediaCount > 1 ? 's' : ''}`}
              </span>
            </div>
          )}
          <time className="text-[10px] text-gray-400 italic font-light">Le {formattedDate}</time>
        </div>
      </div>

      {/* Effet de courbure subtile en bas à droite au survol */}
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-gray-200/20 to-transparent pointer-events-none rounded-br-xl" />
    </div>
  );
}
