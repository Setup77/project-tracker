import { connectDB } from "@/lib/db"
import { getProjectById, deleteProject } from "@/lib/services/projectService"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB()

  const project = await getProjectById(params.id)

  return NextResponse.json(project)
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB()

  await deleteProject(params.id)

  return NextResponse.json({ success: true })
}