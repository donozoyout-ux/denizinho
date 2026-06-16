import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { ProjectsDashboard } from "@/components/projects/ProjectsDashboard";
import type { User } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Parallel database fetches to optimize speed
  const [projectsRes, tasksRes] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("tasks").select("id, status, project_id")
  ]);

  return (
    <div className="space-y-8">
      <Header
        title="Projeler"
        description="Projelerinizi oluşturun, durumlarını güncelleyin ve görev ilerlemelerini takip edin."
      />
      <ProjectsDashboard
        initialProjects={projectsRes.data ?? []}
        allTasks={tasksRes.data ?? []}
        user={user as User}
      />
    </div>
  );
}
