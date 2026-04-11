"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, LayoutDashboard, Users, FolderKanban, CheckCircle2 } from "lucide-react";

import { FileText } from "lucide-react";

interface User {
  name: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, completionRate: 0, totalMedia: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, statsRes] = await Promise.all([
          axios.get("/api/auth/me").catch(() => ({ data: { user: null } })),
          axios.get("/api/stats")
        ]);
        setUser(userRes.data.user);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Erreur fetch", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen py-12 px-4">
      {/* ... SECTION HERO EXISTANTE ... */}


      <section className="flex flex-col items-center justify-center text-center mb-20">
        <div className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-sm font-medium mb-6">
          Version 1.0 disponible
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
          Gérez vos projets avec <span className="text-blue-600">Project Tracker</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          La plateforme collaborative pour suivre l&apos;avancement de vos petits projets,
          partager vos succès et découvrir les réalisations de la communauté.
        </p>

        {!loading && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                  Commencer maintenant
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/register"
                  className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-all"
                >
                  Créer un compte
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <p className="text-gray-500 font-medium italic">
                  Ravi de vous revoir, <span className="text-gray-900 not-italic font-bold">{user.name}</span> !
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                  >
                    <LayoutDashboard size={18} />
                    Mon Dashboard
                  </Link>
                  <Link
                    href="/members"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                  >
                    <Users size={18} />
                    Membres
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </section>



      {/* SECTION STATISTIQUES RÉELLES */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Projets */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <FolderKanban size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Projets</div>
        </div>

        {/* Membres */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
            <Users size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Membres</div>
        </div>

        {/* Fichiers/Médias */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
            <FileText size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalMedia}</div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Médias</div>
        </div>

        {/* Taux de complétion */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Actifs</div>
        </div>
      </section>
    </div>
  );
}
