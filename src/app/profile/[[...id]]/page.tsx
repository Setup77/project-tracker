"use client";
import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";
import { IUser } from "@/lib/models/User";
import { Camera, Loader2, FolderKanban, FileText, Calendar } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const params = useParams();
    const targetId = params.id ? (params.id as string[])[0] : null;

    const [user, setUser] = useState<IUser | null>(null);
    const [stats, setStats] = useState({ totalProjects: 0, totalMedia: 0 });
    const [isMe, setIsMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            // Inside ProfilePage useEffect
            try {
                const meRes = await axios.get("/api/auth/me");
                const myData = meRes.data.user;
                const myId = myData.id || myData._id;

                // Fix: params.id is usually an array with [[...id]]
                const idToLink = Array.isArray(targetId) ? targetId[0] : targetId;

                let currentUser: IUser;

                if (!idToLink || idToLink === myId) {
                    setIsMe(true);
                    currentUser = myData;
                } else {
                    // This will now call the new route app/api/users/[id]/route.ts
                    const otherRes = await axios.get(`/api/users/${idToLink}`);
                    currentUser = otherRes.data;
                    setIsMe(false);
                }

                setUser(currentUser);
                setNewName(currentUser.name || "");

                const statsRes = await axios.get(`/api/users/stats/${currentUser._id}`);
                setStats(statsRes.data);

            } catch (err) {
                console.error(err);
                toast.error("Profil introuvable");
            }

        }
        loadProfile();
    }, [targetId]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", newName);
            if (selectedFile) formData.append("avatar", selectedFile);

            const res = await axios.put("/api/users/profile", formData);
            setUser(res.data);
            toast.success("Profile updated!");
            setPreview(null);
        } catch {
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
            <div className="flex flex-col items-center gap-6">
                {/* Avatar with Upload Trigger */}
                <div className="relative group">
                    <div className="relative w-32 h-32">
                        <Image
                            src={preview || `/uploads/avatar/${user.avatar || "default.jpg"}`}
                            alt="Avatar"
                            fill
                            className="rounded-full object-cover border-4 border-white shadow-lg"
                        />
                    </div>
                    {isMe && (
                        <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer hover:scale-110 transition shadow-md">
                            <Camera size={18} />
                            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                        </label>
                    )}
                </div>

                <div className="text-center w-full space-y-4">
                    <div className="space-y-1">
                        <input
                            disabled={!isMe}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className={`text-2xl font-bold text-center w-full bg-transparent focus:outline-none ${isMe ? 'border-b border-dashed focus:border-blue-500' : ''}`}
                        />
                        <p className="text-gray-400">{user.email}</p>
                    </div>

                    {/* STATS SECTION */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                        <div className="flex flex-col items-center">
                            <FolderKanban className="text-blue-500 mb-1" size={20} />
                            <span className="font-bold text-lg">{stats.totalProjects}</span>
                            <span className="text-xs text-gray-400 uppercase">Projets</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <FileText className="text-orange-500 mb-1" size={20} />
                            <span className="font-bold text-lg">{stats.totalMedia}</span>
                            <span className="text-xs text-gray-400 uppercase">Médias</span>
                        </div>
                    </div>

                    {/* ... après STATS SECTION ... */}

                    <div className="py-6 flex justify-center">
                        <Link
                            href={`/projects?userId=${user._id}`}
                            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-semibold hover:bg-blue-100 transition-all border border-blue-100 shadow-sm shadow-blue-50"
                        >
                            <FolderKanban size={18} />
                            {isMe ? "Voir mes projets" : `Voir les projets de ${user.name}`}
                        </Link>
                    </div>

                    {/* ... avant DATES SECTION ... */}


                    {/* DATES SECTION */}
                    <div className="flex flex-col gap-2 text-xs text-gray-500 pt-2">
                        <div className="flex items-center justify-center gap-2">
                            <Calendar size={14} />
                            <span>Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <p>Dernière mise à jour : {new Date(user.updatedAt).toLocaleDateString('fr-FR')}</p>
                    </div>

                    {isMe && (newName !== user.name || selectedFile) && (
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="bg-black text-white px-8 py-2 rounded-full cursor-pointer font-medium hover:bg-gray-800 disabled:opacity-50 transition"
                        >
                            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
