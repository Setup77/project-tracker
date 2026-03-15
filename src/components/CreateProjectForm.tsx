"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ProjectStatus } from "@/types/project";
import { ChevronDown, Plus, X } from "lucide-react";

export default function CreateProjectForm() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: ProjectStatus.ACTIVE,
    });

    const resetForm = () => {
        setFormData({ title: "", description: "", status: ProjectStatus.ACTIVE });
        setIsOpen(false);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // --- Client-side Validation ---
        if (!formData.title.trim()) {
            return toast.error("Le titre est obligatoire");
        }
        if (!formData.description.trim()) {
            return toast.error("La description est obligatoire");
        }
        if (formData.description.trim().length < 10) {
            return toast.error("La description doit faire au moins 10 caractères");
        }

        setLoading(true);
        try {
            await axios.post("/api/projects", formData);
            toast.success("Projet créé !");
            resetForm();
            router.refresh();
        } catch (error: unknown) {
            let message = "Erreur lors de la création";

            if (axios.isAxiosError(error)) {
                // Cela affichera "Token manquant" ou "Non autorisé" si c'est le cas
                message = error.response?.data?.message || message;
            }

            toast.error(message);
            console.error("Détail de l'erreur:", error); // Regarde ta console F12
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mb-8 border rounded-xl bg-white shadow-sm overflow-hidden">
            {/* Header / Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpen ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <Plus size={20} className={`transition-transform cursor-pointer duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                    </div>
                    <span className="font-semibold text-gray-800">
                        {isOpen ? "Annuler l'ajout" : "Ajouter un nouveau projet"}
                    </span>
                </div>
                <ChevronDown
                    size={20}
                    className={`text-gray-400 cursor-pointer transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Accordion Content */}
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <form onSubmit={handleSubmit} className="p-6 pt-0 border-t border-gray-100 space-y-5">
                    <div className="space-y-4 pt-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Titre <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Nom du projet..."
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                className="w-full border border-gray-300 p-2.5 rounded-lg bg-white outline-none cursor-pointer"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                                disabled={loading}
                            >
                                {Object.values(ProjectStatus).map((status) => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                placeholder="Expliquez l'objectif du projet..."
                                rows={4}
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="flex-[2] bg-black  cursor-pointer hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? "Création..." : "Créer le projet"}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="flex-1 border cursor-pointer border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            <X size={18} />
                            Annuler
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
}
