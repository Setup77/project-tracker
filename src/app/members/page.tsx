"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

interface Member {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}


export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(""); // État pour la recherche

    useEffect(() => {
        let isMounted = true;
        const fetchMembers = async () => {
            try {
                setLoading(true);
                // On passe le terme de recherche à l'API
                const res = await axios.get(`/api/users?page=${page}&search=${search}`);
                if (isMounted) {
                    setMembers(res.data.members);
                    setTotalPages(res.data.totalPages);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // Optionnel : Ajouter un debounce ici pour éviter d'appeler l'API à chaque touche
        const timeoutId = setTimeout(fetchMembers, 300);
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [page, search]); // Se déclenche si la page OU la recherche change

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Membres de la plateforme</h1>

                {/* BARRE DE RECHERCHE */}
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Rechercher par nom..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1); // Reset à la page 1 lors d'une recherche
                        }}
                        className="w-full pl-4 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {loading && members.length === 0 ? (
                <p className="text-center text-gray-500">Chargement...</p>
            ) : (
                <>
                    {members.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {members.map((member) => (
                                <div key={member._id} className="border p-4 rounded-xl shadow-sm hover:shadow-md transition bg-white flex items-center gap-4">
                                    <div className="relative w-16 h-16">
                                        <Image

                                            src={`/uploads/avatar/${member.avatar || "default.jpg"}`}
                                            alt={member.name || "Avatar membre"}
                                            fill
                                            className="rounded-full object-cover border"

                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "/uploads/avatar/default.jpg";
                                            }}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-bold text-gray-800 truncate uppercase">{member.name}</h2>
                                        <p className="text-sm text-gray-400 mb-2 truncate">{member.email}</p>
                                        <div className="flex gap-4 text-xs font-semibold text-blue-600">
                                            <Link
                                                href={`/profile/${member._id}`}
                                                className="hover:text-blue-800 underline"
                                            >
                                                Profil
                                            </Link>

                                            <Link href={`/projects?userId=${member._id}`} className="hover:text-blue-800 underline">
                                                Projets
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            Aucun membre trouvé pour {search}
                        </div>
                    )}

                    {/* Pagination visible seulement s'il y a plus d'une page */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 border rounded-md cursor-pointer disabled:opacity-30 bg-white"
                            >
                                Précédent
                            </button>
                            <span className="text-sm font-medium">Page {page} / {totalPages}</span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 border rounded-md cursor-pointer disabled:opacity-30 bg-white"
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
