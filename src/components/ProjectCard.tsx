import { IProject } from "@/lib/models/Project"

export default function ProjectCard({ project }: { project: IProject }) {
  return (
    <div className="p-4 border rounded shadow-sm">
      <h2 className="font-semibold">{project.title}</h2>
      <p className="text-gray-500 text-sm">
        {project.description}
      </p>
    </div>
  )
}