"use client";

import { useEffect, useState, use } from "react"; // 1. Ajoute 'use'
import axios from "axios";
import EditProjectForm from "../../../../components/EditProjectForm";
import { ProjectType } from "@/types/project";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  // 2. Déballe les params avec React.use()
  const resolvedParams = use(params); 
  const [project, setProject] = useState<ProjectType | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // 3. Utilise l'ID déballé
        const { data } = await axios.get(`/api/projects/${resolvedParams.id}`);
        setProject(data);
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
      }
    };
    fetchProject();
  }, [resolvedParams.id]);

  if (!project) return <p>Chargement...</p>;

  return <EditProjectForm project={project} />;
}
