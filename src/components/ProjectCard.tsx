import { IProject } from "@/types/project"

interface Props {
  project: IProject
}

export default function ProjectCard({ project }: Props) {
  return (
    <div className="border p-4 rounded">
      <h2 className="font-bold">{project.title}</h2>
      <p>{project.description}</p>
      <p className="text-sm text-gray-500">{project.status}</p>
    </div>
  )
}