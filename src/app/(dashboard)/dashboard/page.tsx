import { redirect } from "next/navigation";
import Link from "next/link";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { IncomingRequestsList } from "@/components/dashboard/IncomingRequestsList";
import { RecentTasksList } from "@/components/dashboard/RecentTasksList";
import type { IncomingRequest, Task } from "@/types/database";
import { ChevronDown, FileSpreadsheet } from "lucide-react";

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
  const groupId = user.group_id;

  const taskSelect =
    "id, title, description, status, due_date, assigned_to, created_at, created_by, updated_at, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role)";

  const [
    recentTasksRes,
    totalTasksRes,
    todoRes,
    inProgressRes,
    doneRes,
    requestsRes,
    activeProjectsRes,
    teamMembersRes,
    allTasksForChartRes,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(taskSelect)
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("group_id", groupId),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "todo"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "in_progress"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "done"),
    supabase
      .from("incoming_requests")
      .select("*", { count: "exact" })
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "in_progress"),
    supabase
      .from("users")
      .select("id, full_name, email")
      .eq("group_id", groupId),
    supabase
      .from("tasks")
      .select("assigned_to, status")
      .eq("group_id", groupId),
  ]);

  const queryError =
    recentTasksRes.error?.message ||
    totalTasksRes.error?.message ||
    requestsRes.error?.message;

  const recentTasks = (recentTasksRes.data as unknown as Task[]) ?? [];
  const totalTasks = totalTasksRes.count ?? 0;
  const todoCount = todoRes.count ?? 0;
  const inProgressCount = inProgressRes.count ?? 0;
  const doneCount = doneRes.count ?? 0;
  const incomingRequests = (requestsRes.data as IncomingRequest[]) ?? [];
  const pendingRequests = requestsRes.count ?? 0;
  const activeProjectsCount = activeProjectsRes.count ?? 0;

  // Build real team task distribution from DB
  const teamMembers = teamMembersRes.data ?? [];
  const allTasks = allTasksForChartRes.data ?? [];

  const taskDistribution = teamMembers
    .map((member) => {
      const memberTasks = allTasks.filter((t) => t.assigned_to === member.id);
      const todoTasks = memberTasks.filter((t) => t.status === "todo").length;
      const inProgressTasks = memberTasks.filter((t) => t.status === "in_progress").length;
      const doneTasks = memberTasks.filter((t) => t.status === "done").length;
      const total = todoTasks + inProgressTasks + doneTasks;
      return {
        name: member.full_name || member.email?.split("@")[0] || "?",
        todo: todoTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
        total,
      };
    })
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Real donut chart percentages
  const totalForDonut = todoCount + inProgressCount + doneCount;
  const donePercent = totalForDonut > 0 ? Math.round((doneCount / totalForDonut) * 100) : 0;
  const inProgressPercent = totalForDonut > 0 ? Math.round((inProgressCount / totalForDonut) * 100) : 0;
  const todoPercent = totalForDonut > 0 ? 100 - donePercent - inProgressPercent : 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Header Actions matching screenshot */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ekip ve Görev Yönetimi</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Mevcut ekip görevleri ve durumuna genel bakış.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition">
            This Month
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition">
            <FileSpreadsheet className="h-4 w-4" />
            Rapor İndir
          </button>
        </div>
      </div>

      {queryError && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Veriler yüklenirken bir hata oluştu: {queryError}
        </div>
      )}

      {/* Main KPI Stats Cards */}
      <StatsCards
        totalTasks={totalTasks}
        todoCount={todoCount}
        inProgressCount={inProgressCount}
        doneCount={doneCount}
        pendingRequests={pendingRequests}
        activeProjectsCount={activeProjectsCount}
      />

      {/* Grid of charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Team Task Distribution Bar Chart */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Ekip Görev Dağılımı</h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">En aktif ekip üyeleri</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-emerald-800" />
                Tamamlanan
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500/60" />
                Devam Eden
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-slate-200" />
                Bekleyen
              </span>
            </div>
          </div>
          
          {/* Custom SVG Grouped Bar Chart */}
          {taskDistribution.length === 0 ? (
            <div className="mt-6 flex h-64 items-center justify-center text-sm text-slate-400 font-semibold">
              Henüz ekip üyelerine atanmış görev bulunmuyor.
            </div>
          ) : (
            <div className="mt-6 flex h-64 items-end justify-between gap-6 px-2">
              {taskDistribution.map((item, idx) => {
                const maxVal = Math.max(...taskDistribution.map(d => Math.max(d.done, d.inProgress, d.todo)), 1);
                const doneHeight = (item.done / maxVal) * 100;
                const inProgressHeight = (item.inProgress / maxVal) * 100;
                const todoHeight = (item.todo / maxVal) * 100;

                // Truncate name for display
                const displayName = item.name.length > 12 
                  ? item.name.substring(0, 10) + "…" 
                  : item.name;

                return (
                  <div key={idx} className="group flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    <div className="relative w-full flex items-end justify-center gap-1 h-full pb-2 border-b border-slate-100">
                      {/* Done Bar */}
                      <div 
                        className="w-2.5 rounded-t bg-emerald-800 transition-all duration-300 hover:bg-emerald-950"
                        style={{ height: `${doneHeight}%`, minHeight: item.done > 0 ? '4px' : '0' }}
                        title={`Tamamlanan: ${item.done}`}
                      />
                      {/* In Progress Bar */}
                      <div 
                        className="w-2.5 rounded-t bg-emerald-500/60 transition-all duration-300 hover:bg-emerald-500"
                        style={{ height: `${inProgressHeight}%`, minHeight: item.inProgress > 0 ? '4px' : '0' }}
                        title={`Devam Eden: ${item.inProgress}`}
                      />
                      {/* Todo Bar */}
                      <div 
                        className="w-2.5 rounded-t bg-slate-200 transition-all duration-300 hover:bg-slate-300"
                        style={{ height: `${todoHeight}%`, minHeight: item.todo > 0 ? '4px' : '0' }}
                        title={`Bekleyen: ${item.todo}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-full" title={item.name}>{displayName}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Task Status Overview Donut Chart */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-50 pb-4">
            <h3 className="text-sm font-bold text-slate-800">Görev Durumu Özeti</h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Görev durumu dağılımı</p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center h-40 w-40">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background track */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                
                {/* Done Segment */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#064e3b" strokeWidth="3" 
                  strokeDasharray={`${donePercent} ${100 - donePercent}`} strokeDashoffset="0" />
                
                {/* In Progress Segment */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6ee7b7" strokeWidth="3" 
                  strokeDasharray={`${inProgressPercent} ${100 - inProgressPercent}`} strokeDashoffset={`${-donePercent}`} />

                {/* Todo Segment */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#cbd5e1" strokeWidth="3" 
                  strokeDasharray={`${todoPercent} ${100 - todoPercent}`} strokeDashoffset={`${-(donePercent + inProgressPercent)}`} />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-800">{donePercent}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tamamlandı</span>
              </div>
            </div>

            {/* Legends */}
            <div className="mt-6 w-full space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#064e3b]" />
                  Tamamlanan
                </span>
                <span className="text-slate-800 font-bold">{donePercent}%</span>
              </div>
              
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6ee7b7]" />
                  Devam Eden
                </span>
                <span className="text-slate-800 font-bold">{inProgressPercent}%</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#cbd5e1]" />
                  Bekleyen
                </span>
                <span className="text-slate-800 font-bold">{todoPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom list section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Son Görevler</h3>
            <Link href="/board" className="text-xs font-bold text-emerald-800 hover:underline">Tümünü Gör</Link>
          </div>
          <RecentTasksList tasks={recentTasks} totalCount={totalTasks} />
        </section>

        {/* Incoming requests / Email sync */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Gelen Talepler / E-posta Taslakları</h3>
            <Link href="/board" className="text-xs font-bold text-emerald-800 hover:underline">Yönet</Link>
          </div>
          <IncomingRequestsList requests={incomingRequests} />
        </section>
      </div>
    </div>
  );
}
