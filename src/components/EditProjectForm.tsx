"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ProjectType, ProjectStatus } from "@/types/project";
import { X, Plus, Users } from "lucide-react";

const Editor = dynamic(() => import("@/components/Editor"), {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-100 animate-pulse rounded-lg" />,
});

interface Props {
    project: ProjectType;
}

export default function EditProjectForm({ project }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // 🧠 FORM DATA
    const [formData, setFormData] = useState({
        title: project.title,
        description: project.description || "",
        status: project.status,
        progress: project.progress || 0, // <-- Ajoutez ceci
        // On initialise avec les IDs déjà présents dans allowedUsers
        userIds: project.allowedUsers || [],
    });

    // État pour stocker la liste de tous les utilisateurs (pour le listing)
    const [users, setUsers] = useState<{ _id: string; name?: string; email: string }[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get("/api/users?all=true"); // Ajuste selon ta route
                // Optionnel : filtrer l'admin actuel pour ne pas se partager le projet à soi-même
                setUsers(data);
            } catch (err) {
                toast.error("Erreur lors de la récupération des utilisateurs");
            }
        };
        fetchUsers();
    }, []);

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
            setFormData(prev => ({ ...prev, userIds: [] }));
        } else {
            setFormData(prev => ({ ...prev, userIds: users.map(u => u._id) }));
        }
    };





    // 📦 Médias existants (DB)
    const [existingMedia, setExistingMedia] = useState(project.media || []);

    // 🆕 Nouveaux médias
    const [mediaFiles, setMediaFiles] = useState<
        { file: File; title: string; preview: string; type: string }[]
    >([]);

    // 🗑️ IDs supprimés
    const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);

    // =========================
    // 📁 HANDLE NEW MEDIA
    // =========================
    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        const newMedia = files.map((file) => {
            // Générer un preview seulement pour les images ET les vidéos
            const isPreviewable = file.type.startsWith("image/") || file.type.startsWith("video/");

            return {
                file,
                title: file.name.replace(/\.[^/.]+$/, ""),
                preview: isPreviewable ? URL.createObjectURL(file) : "/file-placeholder.png", // Ne jamais laisser vide ""
                type: file.type,
            };
        });

        setMediaFiles((prev) => [...prev, ...newMedia]);
    };


    const removeMedia = (index: number) => {
        setMediaFiles(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview); // Clean memory
            updated.splice(index, 1);
            return updated;
        });
    };

    const removeExistingMedia = (id: string) => {
        // 1. On ajoute l'ID à la liste des suppressions pour le backend
        setDeletedMediaIds(prev => [...prev, id]);

        // 2. On le retire de l'affichage local (existingMedia)
        setExistingMedia(prev => prev.filter(m => m._id !== id));

        toast.success("Média marqué pour suppression");
    };


    const updateMediaTitle = (index: number, title: string) => {
        setMediaFiles((prev) => {
            const updated = [...prev];
            updated[index].title = title;
            return updated;
        });
    };

    const updateExistingMediaTitle = (id: string, newTitle: string) => {
        setExistingMedia((prev) =>
            prev.map((m) => (m._id === id ? { ...m, title: newTitle } : m))
        );
    };
    const handleReplaceMedia = (id: string, file: File) => {
        // 1. Créer une URL de prévisualisation locale
        const previewUrl = URL.createObjectURL(file);

        // 2. Mettre à jour l'état local (existingMedia)
        setExistingMedia(prev => prev.map(m => {
            if (m._id === id) {
                return {
                    ...m,
                    url: previewUrl,
                    fileType: file.type,
                    // On stocke le fichier brut pour l'upload final
                    // Note: Si votre interface Media n'a pas 'newFile', 
                    // vous devrez peut-être l'ajouter à votre définition de type
                    newFile: file
                };
            }
            return m;
        }));
    };




    // =========================
    // 🚀 SUBMIT
    // =========================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();

            // 1. Données de base
            formDataToSend.append("title", formData.title);
            formDataToSend.append("description", formData.description);
            formDataToSend.append("status", formData.status);
            formDataToSend.append("progress", formData.progress.toString());

            // Dans handleSubmit...
            formDataToSend.append("allowedUsers", JSON.stringify(formData.userIds));


            // 2. Gestion du nettoyage (IDs supprimés)
            formDataToSend.append("deletedMediaIds", JSON.stringify(deletedMediaIds));

            // 3. Médias Existants (Métadonnées + Fichiers de remplacement)
            // On envoie la liste des existants pour mettre à jour les titres en DB
            formDataToSend.append("existingMedia", JSON.stringify(
                existingMedia.map(m => ({ _id: m._id, title: m.title }))
            ));

            existingMedia.forEach((m) => {
                // On "cast" temporairement vers un type qui accepte newFile
                const mediaWithFile = m as ProjectType['media'][0] & { newFile?: File };

                if (mediaWithFile.newFile) {
                    formDataToSend.append(`replace_${m._id}`, mediaWithFile.newFile);
                }
            });



            // 4. Nouveaux Médias
            mediaFiles.forEach((m) => {
                formDataToSend.append("newFiles", m.file);
                formDataToSend.append("newTitles", m.title); // On garde l'ordre pour le backend
            });
            // Change .patch en .put
            const response = await axios.put(`/api/projects/${project._id}`, formDataToSend, {
                headers: { "Content-Type": "multipart/form-data" }
            });


            if (response.status === 200) {
                toast.success("Projet mis à jour avec succès !");
                router.push("/dashboard"); // Ou ta route de liste
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };


    // =========================
    // 🎨 UI
    // =========================
    return (
        <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow space-y-6"
        >
            <h2 className="text-xl font-bold">Modifier le projet</h2>

            {/* TITLE */}
            <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.title}
                onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                }
            />

            {/* STATUS */}
            <select
                className="w-full border p-2 rounded"
                value={formData.status}
                onChange={(e) =>
                    setFormData({
                        ...formData,
                        status: e.target.value as ProjectStatus,
                    })
                }
            >
                {Object.values(ProjectStatus).map((s) => (
                    <option key={s} value={s}>
                        {s}
                    </option>
                ))}
            </select>

            {/* EDITOR */}
            <Editor
                data={formData.description}
                onChange={(data) =>
                    setFormData({ ...formData, description: data })
                }
            />

            <div className="mt-4 p-2 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                        Progression
                    </label>
                    {/* On utilise formData ici pour voir le chiffre changer en direct */}
                    <span className="text-xs font-bold text-blue-600">{formData.progress}%</span>
                </div>

                <div className="relative h-6 flex items-center">
                    {/* 1. LA BARRE DE FOND ET DE REMPLISSAGE (Visuel) */}
                    <div className="absolute w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-150"
                            style={{ width: `${formData.progress}%` }}
                        ></div>
                    </div>

                    {/* 2. L'INPUT RANGE (Invisible mais interactif par-dessus) */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => {
                            const newValue = parseInt(e.target.value, 10);
                            setFormData((prev) => ({ ...prev, progress: newValue }));
                        }}
                        // On rend l'input transparent pour ne voir que le bouton (thumb)
                        className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer accent-blue-700"
                    />
                </div>
            </div>


            {/* --- NOUVEAU : SÉLECTION DES UTILISATEURS --- */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Users size={16} /> Attribué à  :
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



            {/* ================= EXISTING MEDIA ================= */}

            <div>
                <h3 className="font-semibold mb-2">Médias existants</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {existingMedia.map((m) => (
                        <div key={m._id} className="relative border p-2 rounded bg-gray-50">

                            {/* BOUTON DE SUPPRESSION (EXISTANT) */}
                            <button
                                type="button"
                                onClick={() => removeExistingMedia(m._id)}
                                className="absolute -top-2 -right-2 bg-red-600 text-white cursor-pointer rounded-full p-1 hover:scale-110 transition-transform z-20 shadow-sm"
                            >
                                <X size={14} />
                            </button>

                            {/* AJOUTEZ "group" ICI sur le parent direct */}
                            <div className="h-32 w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative group">
                                {/* 1. IMAGES */}
                                {m.fileType.startsWith("image/") ? (
                                    <Image
                                        src={m.url}
                                        alt={m.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) :
                                    /* 2. VIDÉOS */
                                    m.fileType.startsWith("video/") ? (
                                        <video
                                            src={m.url}
                                            className="h-full w-full object-cover"
                                            controls
                                            muted
                                        />
                                    ) :
                                        /* 3. PDF */
                                        m.fileType === "application/pdf" ? (
                                            <Image
                                                src="/uploads/images/media_pdf.jpeg"
                                                alt="PDF Icon"
                                                width={80}
                                                height={80}
                                                className="object-contain"
                                            />
                                        ) :
                                            /* 4. WORD */
                                            (m.fileType.includes("word") || m.fileType.includes("officedocument.wordprocessingml")) ? (
                                                <Image
                                                    src="/uploads/images/media_doc.png"
                                                    alt="Word Icon"
                                                    width={80}
                                                    height={80}
                                                    className="object-contain"
                                                />
                                            ) :
                                                /* 5. EXCEL */
                                                (m.fileType.includes("excel") || m.fileType.includes("spreadsheetml")) ? (
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

                                {/* --- BOUTON DE REMPLACEMENT (S'affiche au survol) --- */}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <div className="bg-white p-2 rounded-full shadow-lg">
                                        <span className="text-xs font-bold text-gray-700">Changer le fichier</span>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleReplaceMedia(m._id, file);
                                        }}
                                    />
                                </label>
                            </div>
                            {/* CHAMP DE MODIFICATION DU TITRE */}
                            <div className="mt-2">
                                <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Titre du fichier</label>
                                <input
                                    type="text"
                                    className="w-full border p-1 text-xs rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={m.title}
                                    onChange={(e) => updateExistingMediaTitle(m._id, e.target.value)}
                                />
                            </div>

                        </div>
                    ))}
                </div>
            </div>


            {/* ================= NEW MEDIA ================= */}

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

            {/* SUBMIT */}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded cursor-pointer"
            >
                {loading ? "Mise à jour..." : "Enregistrer"}
            </button>
        </form>
    );
}