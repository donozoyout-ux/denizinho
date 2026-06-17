import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import type { Task, User, Project } from "@/types/database";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.group_id) {
    redirect("/group-setup");
  }

  const supabase = await createClient();

  // 1. Task query
  const tasksQuery = supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role), creator:users!tasks_created_by_fkey(id, email, full_name)")
    .order("created_at", { ascending: false });

  // 2. Team members query based on group
  const membersQuery = supabase
    .from("users")
    .select("*")
    .eq("group_id", user.group_id)
    .order("full_name");

  // 3. Projects query
  const projectsQuery = supabase.from("projects").select("*").order("title");

  // Fetch all parallelly to reduce latency
  const [tasksRes, teamMembersRes, projectsRes] = await Promise.all([
    tasksQuery,
    membersQuery,
    projectsQuery
  ]);

  return (
    <div>
      <Header
        title="Görev Panosu"
        description="Görevleri sürükleyip bırakarak yönetin"
      />
      <KanbanBoard
        initialTasks={(tasksRes.data as Task[]) ?? []}
        user={user}
        currentUserId={user.id}
        teamMembers={(teamMembersRes.data as User[]) ?? []}
        projects={(projectsRes.data as Project[]) ?? []}
      />
    </div>
  );
}
