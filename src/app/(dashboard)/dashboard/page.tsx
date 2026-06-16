import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { IncomingRequestsList } from "@/components/dashboard/IncomingRequestsList";
import type { IncomingRequest } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const taskQuery = supabase.from("tasks").select("*", { count: "exact" });
  const tasksPromise = user?.role === "patron"
    ? taskQuery
    : taskQuery.eq("assigned_to", user!.id);

  const requestsPromise = user?.role === "patron"
    ? supabase
        .from("incoming_requests")
        .select("*", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [], count: 0 });

  // Parallel fetch to optimize page speed
  const [tasksRes, requestsRes] = await Promise.all([
    tasksPromise,
    requestsPromise
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

      {user?.role === "patron" && (
        <section className="mt-10">
          <Header
            title="Gelen Talepler / E-posta Taslakları"
            description="Gelen istekleri resmi görevlere dönüştürün"
          />
          <IncomingRequestsList requests={incomingRequests ?? []} />
        </section>
      )}
    </div>
  );
}
