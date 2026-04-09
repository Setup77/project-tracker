"use client";

import { ProjectType, ProjectMedia } from "@/types/project"; // Importe tes types
import { Calendar, User, FileText, Download, Users } from "lucide-react";
import Image from "next/image";

// On définit ce à quoi ressemble un utilisateur populé
interface PopulatedUser {
    _id: string;
    name?: string;
    email: string;
}

// On crée une version du projet où allowedUsers est un tableau d'objets
interface ProjectDetailsProps extends Omit<ProjectType, 'allowedUsers'> {
    allowedUsers: PopulatedUser[];
}

interface Props {
    project: ProjectDetailsProps;
    media: ProjectMedia[];
}


// Inside ProjectDetails.tsx or your types file



export default function ProjectDetails({ project, media }: Props) {
    // Extract author name safely based on your Union Type
    const authorName = typeof project.user === 'object' ? project.user.name : "Admin";

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <header className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
                        {project.status}
                    </span>
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">{project.title}</h1>
                <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={16} />
                    </div>
                    <span className="text-sm font-medium">Par {authorName}</span>
                </div>

                {/* PROGRESS BAR (Affichée uniquement si > 0) */}
                {project.progress > 0 && (
                    <div className="mt-6">
                        <div className="flex justify-between mb-1 text-xs font-bold uppercase text-gray-400">
                            <span>Progression</span>
                            <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>
                )}

            </header>

            {/* DESCRIPTION */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" /> Description
                </h3>
                <div
                    className="prose prose-blue max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: project.description || "" }}
                />
            </section>

            {/* SECTION: ASSIGNED USERS */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users size={18} className="text-blue-600" />
                    Équipe sur le projet
                </h3>

                <div className="flex flex-wrap gap-3">
                    {/* The creator is always part of the team */}
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            {typeof project.user === 'object' ? project.user.name.charAt(0) : "A"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-blue-900">
                                {typeof project.user === 'object' ? project.user.name : "Admin"}
                            </span>
                            <span className="text-[10px] text-blue-600 font-medium">Responsable</span>
                        </div>
                    </div>

                    {/* List of allowed users */}

                    {project.allowedUsers && project.allowedUsers.length > 0 ? (
                        project.allowedUsers.map((u) => ( // Plus besoin de :any ici !
                            <div key={u._id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                                    {(u.name || u.email).charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-gray-700">
                                    {u.name || u.email}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 italic py-2">Aucun collaborateur additionnel.</p>
                    )}

                </div>
            </section>


            {/* GALERIE MÉDIAS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {media.map((item) => (
                    <div key={item._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                        <div className="relative h-64 bg-gray-100 flex items-center justify-center">
                            {/* 1. IMAGES */}
                            {item.fileType.startsWith("image/") ? (
                                <Image src={item.url} alt={item.title} fill className="object-cover" />
                            ) :
                                /* 2. VIDÉOS */
                                item.fileType.startsWith("video/") ? (
                                    <video src={item.url} controls className="h-full w-full object-cover" />
                                ) :
                                    /* 3. PDF */
                                    item.fileType === "application/pdf" ? (
                                        <Image
                                            src="/uploads/images/media_pdf.jpeg"
                                            alt="PDF Icon"
                                            width={100}
                                            height={100}
                                            className="object-contain"
                                        />
                                    ) :
                                        /* 4. WORD */
                                        (item.fileType.includes("word") || item.fileType.includes("officedocument.wordprocessingml")) ? (
                                            <Image
                                                src="/uploads/images/media_doc.png"
                                                alt="Word Icon"
                                                width={100}
                                                height={100}
                                                className="object-contain"
                                            />
                                        ) :
                                            /* 5. EXCEL */
                                            (item.fileType.includes("excel") || item.fileType.includes("spreadsheetml")) ? (
                                                <Image
                                                    src="/uploads/images/media_xls.png"
                                                    alt="Excel Icon"
                                                    width={100}
                                                    height={100}
                                                    className="object-contain"
                                                />
                                            ) : (
                                                /* 6. PAR DÉFAUT / AUTRES */
                                                <div className="flex flex-col items-center justify-center">
                                                    <Download size={48} className="text-gray-300" />
                                                    <span className="text-[10px] text-gray-400 mt-2 uppercase font-bold">Fichier</span>
                                                </div>
                                            )}
                        </div>

                        <div className="p-4 flex justify-between items-center bg-gray-50/50">
                            <h4 className="font-medium text-gray-800 truncate text-sm">{item.title}</h4>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all"
                            >
                                <Download size={18} className="text-blue-600" />
                            </a>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
