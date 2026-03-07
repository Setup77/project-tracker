import { connectDB } from "@/lib/db"
import Project from "@/lib/models/Project"
import ProjectCard from "@/components/ProjectCard"

export default async function Dashboard() {

  await connectDB()

  const projects = await Project.find().lean()

  return (
    <div>

      <h1 className="text-2xl font-bold mb-6">
        Liste des Projets
      </h1>

      <div className="grid gap-4">

        {projects.map((p) => (
          <ProjectCard
            key={p._id.toString()}
            project={p}
          />
        ))}

      </div>

    </div>
  )
}