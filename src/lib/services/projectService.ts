import Project, { IProject } from "@/lib/models/Project"

export async function getProjects(): Promise<IProject[]> {
  return await Project.find().lean()
}

export async function createProject(data: Partial<IProject>) {
  return await Project.create(data)
}

export async function getProjectById(id: string) {
  return await Project.findById(id)
}

export async function deleteProject(id: string) {
  return await Project.findByIdAndDelete(id)
}