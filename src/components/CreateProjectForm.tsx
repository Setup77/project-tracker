"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ProjectStatus } from "@/types/project";
import { ChevronDown, Plus, X, Users } from "lucide-react";
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/Editor'), {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-100 animate-pulse rounded-lg" />
});



// Interface pour typage local
interface UserOption {
    _id: string;
    name?: string;
    email: string;
}

export default function CreateProjectForm() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // États pour la gestion des utilisateurs
    const [users, setUsers] = useState<UserOption[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: ProjectStatus.ACTIVE,
        userIds: [] as string[], // IDs des utilisateurs sélectionnés
    });

    // 1. Charger les utilisateurs au montage
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get("/api/users");
                // Ton API backend doit filtrer l'utilisateur connecté via la session
                setUsers(data);
            } catch (error) {
                console.error("Erreur chargement utilisateurs:", error);
            }
        };
        fetchUsers();
    }, []);

    
    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            status: ProjectStatus.ACTIVE,
            userIds: []
        });

        setMediaFiles([]); // IMPORTANT
        setIsOpen(false);
    };


    const toggleUser = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            userIds: prev.userIds.includes(userId)
                ? prev.userIds.filter(id => id !== userId)
                : [...prev.userIds, userId]
        }));
    };

    const selectAllUsers = () => {
        if (formData.userIds.length === users.length) {
            setFormData({ ...formData, userIds: [] });
        } else {
            setFormData({ ...formData, userIds: users.map(u => u._id) });
        }
    };

    //===MEDIA MULTIPLES
    const [mediaFiles, setMediaFiles] = useState<{ file: File; title: string; preview: string; type: string }[]>([]);

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedExtensions = [
            'image/jpeg', 'image/png', 'image/webp',
            'video/mp4', 'application/pdf',
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
        ];

        const newMedia = files.filter(file => {
            if (!allowedExtensions.includes(file.type)) {
                toast.error(`${file.name} : Format non supporté`);
                return false;
            }
            if (file.size > maxSize) {
                toast.error(`${file.name} : Trop lourd (max 10Mo)`);
                return false;
            }
            return true;
        }).map(file => {
            // --- EXTRACTION DU NOM SANS EXTENSION ---
            // On récupère le nom, on cherche le dernier point, et on coupe avant.
            const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");

            return {
                file,
                title: fileNameWithoutExtension, // Titre par défaut inséré ici
                preview: URL.createObjectURL(file),
                type: file.type
            };
        });

        setMediaFiles(prev => [...prev, ...newMedia]);
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview); // Clean memory
            updated.splice(index, 1);
            return updated;
        });
    };

    const updateMediaTitle = (index: number, title: string) => {
        setMediaFiles(prev => {
            const updated = [...prev];
            updated[index].title = title;
            return updated;
        });
    };
    //===FIN MEDIA MULTIPLES

    //== SOUMISSION DU FORMULAIRE

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("status", formData.status);
        data.append("userIds", JSON.stringify(formData.userIds));

        // Inside handleSubmit
        const plainText = formData.description.replace(/<[^>]*>/g, '').trim();

        if (!plainText) {
            return toast.error("La description est obligatoire");
        }
        if (plainText.length < 10) {
            return toast.error("La description doit faire au moins 10 caractères");
        }


        // Ajout des fichiers et de leurs titres respectifs
        mediaFiles.forEach((m, index) => {
            data.append(`file_${index}`, m.file);
            data.append(`title_${index}`, m.title);
        });

        try {
            await axios.post("/api/projects", data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Projet et médias créés !");
            resetForm();
            setMediaFiles([]); // Clear media
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

    //==FIN  SOUMISSION DU FORMULAIRE


    return (
        <div className="mb-8 border rounded-xl bg-white shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center cursor-pointer justify-between p-5 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpen ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <Plus size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                    </div>
                    <span className="font-semibold text-gray-800">
                        {isOpen ? "Annuler l'ajout" : "Ajouter un nouveau projet"}
                    </span>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform cursor-pointer duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'} overflow-y-auto`}>
                <form onSubmit={handleSubmit} className="p-6 pt-0 border-t border-gray-100 space-y-5">
                    <div className="space-y-4 pt-5">
                        {/* Titre & Statut (inchangés) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                <select
                                    className="w-full border border-gray-300 p-2.5 rounded-lg bg-white outline-none"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                                >
                                    {Object.values(ProjectStatus).map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* --- NOUVEAU : SÉLECTION DES UTILISATEURS --- */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Users size={16} /> Attribué à :
                                </label>
                                <button
                                    type="button"
                                    onClick={selectAllUsers}
                                    className="text-xs text-blue-600 cursor-pointer hover:underline"
                                >
                                    {formData.userIds.length === users.length ? "Tout désélectionner" : "Tout sélectionner"}
                                </button>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <label key={user._id} className="flex items-center gap-2 p-2 bg-white border rounded hover:bg-gray-100 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-black"
                                                checked={formData.userIds.includes(user._id)}
                                                onChange={() => toggleUser(user._id)}
                                            />
                                            <span className="text-sm truncate">{user.name || user.email}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500 italic">Aucun autre utilisateur trouvé.</p>
                                )}
                            </div>
                        </div>

                        {/* --- BLOC MÉDIAS MULTIPLES --- */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Médias (Images, Vidéos, PDF)</label>

                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Plus className="w-8 h-8 mb-2 text-gray-500" />
                                        <p className="text-xs text-gray-500 font-medium">Cliquez pour ajouter des fichiers</p>
                                        <p className="text-[10px] text-gray-400">JPG, PNG, MP4, PDF (max 10Mo)</p>
                                    </div>
                                    <input
                                        key={isOpen ? "open" : "closed"} // ✅ Force le re-render et vide l'input à la fermeture/ouverture
                                        type="file"
                                        className="hidden"
                                        multiple
                                        onChange={handleMediaChange}
                                        accept="image/*,video/mp4,application/pdf,.doc,.docx,.xls,.xlsx"
                                    />

                                </label>
                            </div>

                            {/* Liste des prévisualisations */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {mediaFiles.map((item, index) => (
                                    <div key={index} className="relative border rounded-xl p-3 bg-white shadow-sm flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white cursor-pointer rounded-full p-1 hover:scale-110 transition-transform z-10"
                                        >
                                            <X size={14} />
                                        </button>

                                        <div className="h-32 w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
                                            {/* 1. IMAGES (Aperçu direct du fichier) */}
                                            {item.type.startsWith("image/") ? (
                                                <Image
                                                    src={item.preview}
                                                    alt="preview"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized // Obligatoire pour les blob URLs (URL.createObjectURL)
                                                />
                                            ) :
                                                /* 2. VIDÉOS (On garde la balise <video> car <Image /> ne gère pas la vidéo) */
                                                item.type.startsWith("video/") ? (
                                                    <video
                                                        src={item.preview}
                                                        className="h-full w-full object-cover"
                                                        controls
                                                        muted
                                                    />
                                                ) :
                                                    /* 3. PDF */
                                                    item.type === "application/pdf" ? (
                                                        <Image
                                                            src="/uploads/images/media_pdf.jpeg"
                                                            alt="PDF Icon"
                                                            width={80}
                                                            height={80}
                                                            className="object-contain"
                                                        />
                                                    ) :
                                                        /* 4. WORD */
                                                        (item.type.includes("word") || item.type.includes("officedocument.wordprocessingml")) ? (
                                                            <Image
                                                                src="/uploads/images/media_doc.png"
                                                                alt="Word Icon"
                                                                width={80}
                                                                height={80}
                                                                className="object-contain"
                                                            />
                                                        ) :
                                                            /* 5. EXCEL */
                                                            (item.type.includes("excel") || item.type.includes("spreadsheetml")) ? (
                                                                <Image
                                                                    src="/uploads/images/media_xls.png"
                                                                    alt="Excel Icon"
                                                                    width={80}
                                                                    height={80}
                                                                    className="object-contain"
                                                                />
                                                            ) : (
                                                                /* 6. AUTRES */
                                                                <div className="text-gray-400 flex flex-col items-center">
                                                                    <Plus size={24} />
                                                                    <span className="text-[10px] uppercase">Fichier</span>
                                                                </div>
                                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Titre du média..."
                                            className="text-xs border border-gray-200 p-1.5 rounded outline-none focus:border-black"
                                            value={item.title}
                                            onChange={(e) => updateMediaTitle(index, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <div className="prose-sm ck-custom-editor">

                                <Editor
                                    data={formData.description}
                                    onChange={(data) => setFormData({ ...formData, description: data })}
                                    disabled={loading}
                                />

                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="flex-[2] bg-black hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50">
                            {loading ? "Création..." : "Créer le projet"}
                        </button>
                        <button type="button" onClick={resetForm} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                            <X size={18} /> Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
