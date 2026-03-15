"use client";

import { useState } from "react";
import { ProjectType } from "@/types/project";
import ProjectCard from "./ProjectCard";
import { Search } from "lucide-react";

export default function ProjectList({ initialProjects }: { initialProjects: ProjectType[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = initialProjects.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Totals ({filteredProjects.length})
        </h1>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500 italic">Aucun projet ne correspond à votre recherche.</p>
        </div>
      )}
    </section>
  );
}
