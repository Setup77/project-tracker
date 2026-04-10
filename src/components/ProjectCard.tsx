"use client";

import { useState, useEffect  } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Ajoute AlertTriangle à la liste
import { Pencil, Trash2, Paperclip, AlertTriangle, Loader2 } from "lucide-react";

import { ProjectType, ProjectStatus } from "@/types/project";
import { IUser } from "@/lib/models/User";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);



  // Récupérer l'utilisateur via ton API /auth/me
  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setCurrentUser(data.user));
  }, []);

  // Comparaison sécurisée
  const projectAuthorId = typeof project.user === "object" ? project.user._id : project.user;
  const isAuthor = currentUser && currentUser._id === projectAuthorId;


    
  // 1. Déterminer la rotation de manière déterministe grâce à l'ID
  // On utilise le dernier caractère de l'ID pour choisir une rotation
  const rotations = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2"];
  const charCode = project._id.charCodeAt(project._id.length - 1);
  const rotation = rotations[charCode % rotations.length];


  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(project.createdAt));




  async function handleDelete() {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/projects/${project._id}`);
      toast.success("Projet supprimé");
      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      // 1. On vérifie si c'est une erreur Axios
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Erreur lors de la suppression";
        toast.error(message);
      } else {
        // 2. Erreur générique
        toast.error("Une erreur inattendue est survenue");
      }

      setIsDeleting(false);
      setIsModalOpen(false);
    }
  }


  const authorName = typeof project.user === "object" ? project.user.name : "Anonyme";
  const mediaCount = project.media?.length || 0;

  return (
    <>
   <div
        className={`
          group relative p-6 bg-white border-l-4 border-l-blue-500 
          transition-all duration-500 ease-out
          shadow-md min-h-[250px] flex flex-col
          ${rotation} 
          hover:rotate-0 hover:-translate-y-3
          /* ... reste de tes classes */
        `}
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-red-700 z-10" />

        {/* Actions : Affichées uniquement si isAuthor est vrai */}
        <div className="relative flex justify-between items-start mb-4 z-10">
           <span className={`text-[10px] uppercase tracking-tighter font-bold px-2 py-0.5 rounded border ${getStatusStyles(project.status)}`}>
          {project.status}
        </span>

          {isAuthor && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => router.push(`/projects/edit/${project._id}`)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer rounded-full transition-all"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="relative flex-grow z-10">
          <Link href={`/projects/${project._id}`}>
            <h2 className="font-serif font-bold text-lg text-gray-900 leading-tight mb-2 hover:text-blue-600 transition-colors">
              {project.title}
            </h2>
          </Link>
          <div
            className="text-gray-600 text-sm italic line-clamp-3"
            dangerouslySetInnerHTML={{ __html: project.description || "" }}
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


      </div>

      {/* MODAL DE CONFIRMATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-50 rounded-full text-red-600 mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Supprimer le projet ?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Cette action supprimera définitivement <span className="font-semibold italic">{project.title}</span> ainsi que ses fichiers.
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                disabled={isDeleting}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white cursor-pointer bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-red-200"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
