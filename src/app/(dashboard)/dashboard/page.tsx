import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { IncomingRequestsList } from "@/components/dashboard/IncomingRequestsList";
import { RecentTasksList } from "@/components/dashboard/RecentTasksList";
import type { IncomingRequest, Task } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Kullanıcının grubu yoksa group-setup'a yönlendir
  if (!user.group_id) {
    redirect("/group-setup");
  }

  const supabase = await createClient();

  // Herkes kendi grubunun görevlerini görür (RLS group_id bazlı filtreleyecek)
  const tasksPromise = supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role)", { count: "exact" })
    .order("created_at", { ascending: false });

  const requestsPromise = supabase
    .from("incoming_requests")
    .select("*", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Parallel fetch to optimize page speed
  const [tasksRes, requestsRes] = await Promise.all([
    tasksPromise,
    requestsPromise,
  ]);

  const tasks = tasksRes.data;
  const totalTasks = tasksRes.count;

  const todoCount = tasks?.filter((t) => t.status === "todo").length ?? 0;
  const inProgressCount =
    tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const doneCount = tasks?.filter((t) => t.status === "done").length ?? 0;

  const incomingRequests = (requestsRes.data as IncomingRequest[]) ?? [];
  const pendingRequests = requestsRes.count ?? 0;

  return (
    <div>
      <Header
        title={`Hoş geldiniz, ${user?.full_name || user?.email}`}
        description="Görev yönetim panelinize genel bakış"
      />

      <StatsCards
        totalTasks={totalTasks ?? 0}
        todoCount={todoCount}
        inProgressCount={inProgressCount}
        doneCount={doneCount}
        pendingRequests={pendingRequests}
      />

      <section className="mt-10">
        <Header
          title="Son Görevler"
          description="Ekibinizin üzerinde çalıştığı güncel görevler"
        />
        <RecentTasksList tasks={(tasks as Task[]) ?? []} />
      </section>

      <section className="mt-10">
        <Header
          title="Gelen Talepler / E-posta Taslakları"
          description="Gelen istekleri resmi görevlere dönüştürün"
        />
        <IncomingRequestsList requests={incomingRequests ?? []} />
      </section>
    </div>
  );
}
