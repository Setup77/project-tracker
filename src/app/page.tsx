import { connectDB } from "@/lib/db";
import Project, { IProject } from "@/lib/models/Project";

export default async function Dashboard() {
  await connectDB();

  // Use the interface to type the result of the query
  const projects = await Project.find().lean<IProject[]>();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Listes des Projets</h1>
      <div className="grid gap-4">
        {projects.map((p) => (
          // p is now typed as IProject, so p._id and p.title are recognized
          <div key={p._id.toString()} className="p-4 border rounded shadow-sm">
            {p.title}
          </div>
        ))}
      </div>
    </div>
  );
}
