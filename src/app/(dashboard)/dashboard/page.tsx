import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { IncomingRequestsList } from "@/components/dashboard/IncomingRequestsList";
import { RecentTasksList } from "@/components/dashboard/RecentTasksList";
import type { IncomingRequest, Task } from "@/types/database";

export const revalidate = 30;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.group_id) {
    redirect("/group-setup");
  }

  const supabase = await createClient();

  const taskSelect =
    "id, title, description, status, due_date, assigned_to, created_at, created_by, updated_at, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role)";

  const [
    recentTasksRes,
    totalTasksRes,
    todoRes,
    inProgressRes,
    doneRes,
    requestsRes,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(taskSelect)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "todo"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "done"),
    supabase
      .from("incoming_requests")
      .select("*", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const queryError =
    recentTasksRes.error?.message ||
    totalTasksRes.error?.message ||
    requestsRes.error?.message;

  const recentTasks = (recentTasksRes.data as unknown as Task[]) ?? [];
  const totalTasks = totalTasksRes.count ?? 0;
  const incomingRequests = (requestsRes.data as IncomingRequest[]) ?? [];
  const pendingRequests = requestsRes.count ?? 0;

  return (
    <div>
      <Header
        title={`Hoş geldiniz, ${user?.full_name || user?.email}`}
        description="Görev yönetim panelinize genel bakış"
      />

      {queryError && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Veriler yüklenirken bir hata oluştu: {queryError}
        </div>
      )}

      <StatsCards
        totalTasks={totalTasks}
        todoCount={todoRes.count ?? 0}
        inProgressCount={inProgressRes.count ?? 0}
        doneCount={doneRes.count ?? 0}
        pendingRequests={pendingRequests}
      />

      <section className="mt-10">
        <Header
          title="Son Görevler"
          description="Ekibinizin üzerinde çalıştığı güncel görevler"
        />
        <RecentTasksList tasks={recentTasks} totalCount={totalTasks} />
      </section>

      <section className="mt-10">
        <Header
          title="Gelen Talepler / E-posta Taslakları"
          description="Gelen istekleri resmi görevlere dönüştürün"
        />
        <IncomingRequestsList requests={incomingRequests} />
      </section>
    </div>
  );
}
