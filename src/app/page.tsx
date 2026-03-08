import Link from "next/link"

export default function HomePage() {

  return (
    <div className="text-center space-y-6">

      <h1 className="text-4xl font-bold">
        Project Tracker
      </h1>

      <p className="text-gray-600">
       Gestionnaire de petits projets
      </p>

      <div className="flex justify-center gap-4">

        <Link
          href="/login"
          className="bg-black text-white px-6 py-2 rounded"
        >
          Connexion
        </Link>

        <Link
          href="/register"
          className="border px-6 py-2 rounded"
        >
          Inscription
        </Link>

      </div>

    </div>
  )
}