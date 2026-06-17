import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import type { Task, User, Project } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  // 1. Task query
  let tasksQuery = supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role)")
    .order("created_at", { ascending: false });

  if (user?.role !== "patron") {
    tasksQuery = tasksQuery.eq("assigned_to", user!.id);
  }

  // 2. Team members query based on inviter group filtering
  let membersQuery = supabase.from("users").select("*").order("full_name");
  if (user) {
    if (user.role === "patron") {
      membersQuery = membersQuery.or(`id.eq.${user.id},invited_by.eq.${user.id}`);
    } else if (user.invited_by) {
      membersQuery = membersQuery.or(`id.eq.${user.invited_by},invited_by.eq.${user.invited_by}`);
    } else {
      membersQuery = membersQuery.eq("id", user.id);
    }
  }

  // 3. Projects query
  const projectsQuery = supabase.from("projects").select("*").order("title");

  // Fetch all parallelly to reduce latency (eliminates 3s lag)
  const [tasksRes, teamMembersRes, projectsRes] = await Promise.all([
    tasksQuery,
    membersQuery,
    projectsQuery
  ]);

  return (
    <div>
      <Header
        title="Görev Panosu"
        description={
          user?.role === "patron"
            ? "Görevleri sürükleyip bırakarak yönetin"
            : "Size atanan görevleri tamamlayın"
        }
      />
      <KanbanBoard
        initialTasks={(tasksRes.data as Task[]) ?? []}
        user={user!}
        currentUserId={user!.id}
        teamMembers={(teamMembersRes.data as User[]) ?? []}
        projects={(projectsRes.data as Project[]) ?? []}
      />
    </div>
  );
}
