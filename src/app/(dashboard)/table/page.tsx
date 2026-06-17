import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isGroupAdmin } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { TaskTable } from "@/components/table/TaskTable";
import type { Task } from "@/types/database";

export const dynamic = "force-dynamic";
export default async function TablePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role)")
    .order("created_at", { ascending: false });

  if (!user || !isGroupAdmin(user)) {
    query = query.eq("assigned_to", user!.id);
  }

  const { data: tasks } = await query;

  return (
    <div>
      <Header
        title="Tablo Görünümü"
        description="Tüm görevlerin Excel benzeri liste görünümü"
      />
      <TaskTable tasks={(tasks as Task[]) ?? []} user={user!} />
    </div>
  );
}
