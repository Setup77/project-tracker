import { connectDB } from "@/lib/db"
import { getProjects, createProject } from "@/lib/services/projectService"
import { NextResponse } from "next/server"

export async function GET() {
  await connectDB()

  const projects = await getProjects()

  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  await connectDB()

  const body = await req.json()

  const project = await createProject(body)

  return NextResponse.json(project)
}