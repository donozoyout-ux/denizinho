import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { TaskTable } from "@/components/table/TaskTable";
import type { Task } from "@/types/database";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TablePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.group_id) {
    redirect("/group-setup");
  }

  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header
        title="Tablo Görünümü"
        description="Tüm görevlerin Excel benzeri liste görünümü"
      />
      <TaskTable tasks={(tasks as Task[]) ?? []} user={user} />
    </div>
  );
}
