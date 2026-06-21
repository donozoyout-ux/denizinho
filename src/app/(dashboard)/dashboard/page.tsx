import { redirect } from "next/navigation";
import Link from "next/link";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { IncomingRequestsList } from "@/components/dashboard/IncomingRequestsList";
import { RecentTasksList } from "@/components/dashboard/RecentTasksList";
import type { IncomingRequest, Task } from "@/types/database";
import { ChevronDown, FileSpreadsheet, BarChart2 } from "lucide-react";

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

  // Mock task status percentages matching the screenshot (Completed 55%, In Progress 30%, Pending 15%)
  const taskDistribution = [
    { name: "Sarah K.", volunteers: 30, staff: 23, coordinators: 6 },
    { name: "David L.", volunteers: 44, staff: 39, coordinators: 14 },
    { name: "Maria R.", volunteers: 29, staff: 23, coordinators: 7 },
    { name: "Alex T.", volunteers: 36, staff: 20, coordinators: 6 },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Header Actions matching screenshot */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Charity Management</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Overview of current team tasks and status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition">
            This Month
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition">
            <FileSpreadsheet className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {queryError && (
        <div className="mb-6 rounded-xl border border-amber-250 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Veriler yüklenirken bir hata oluştu: {queryError}
        </div>
      )}

      {/* Main KPI Stats Cards */}
      <StatsCards
        totalTasks={totalTasks}
        todoCount={todoRes.count ?? 0}
        inProgressCount={inProgressRes.count ?? 0}
        doneCount={doneRes.count ?? 0}
        pendingRequests={pendingRequests}
      />

      {/* Grid of charts matching screenshot 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Team Task Distribution Bar Chart */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Team Task Distribution</h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Most active team members</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-emerald-800" />
                Volunteers
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500/60" />
                Staff
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-slate-200" />
                Coordinators
              </span>
            </div>
          </div>
          
          {/* Custom SVG Grouped Bar Chart */}
          <div className="mt-6 flex h-64 items-end justify-between gap-6 px-2">
            {taskDistribution.map((item, idx) => {
              const maxVal = 50;
              const volHeight = (item.volunteers / maxVal) * 100;
              const staffHeight = (item.staff / maxVal) * 100;
              const coordHeight = (item.coordinators / maxVal) * 100;

              return (
                <div key={idx} className="group flex flex-1 flex-col items-center gap-2 h-full justify-end">
                  <div className="relative w-full flex items-end justify-center gap-1 h-full pb-2 border-b border-slate-100">
                    {/* Volunteers Bar */}
                    <div 
                      className="w-2.5 rounded-t bg-emerald-800 transition-all duration-300 hover:bg-emerald-950"
                      style={{ height: `${volHeight}%` }}
                      title={`Volunteers: ${item.volunteers}`}
                    />
                    {/* Staff Bar */}
                    <div 
                      className="w-2.5 rounded-t bg-emerald-500/60 transition-all duration-300 hover:bg-emerald-500"
                      style={{ height: `${staffHeight}%` }}
                      title={`Staff: ${item.staff}`}
                    />
                    {/* Coordinators Bar */}
                    <div 
                      className="w-2.5 rounded-t bg-slate-200 transition-all duration-300 hover:bg-slate-350"
                      style={{ height: `${coordHeight}%` }}
                      title={`Coordinators: ${item.coordinators}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Task Status Overview Donut Chart */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-50 pb-4">
            <h3 className="text-sm font-bold text-slate-800">Task Status Overview</h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Tasks status breakdown</p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center h-40 w-40">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background track */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                
                {/* 55% Segment (Completed) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#064e3b" strokeWidth="3" 
                  strokeDasharray="55 100" strokeDashoffset="0" />
                
                {/* 30% Segment (In Progress) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6ee7b7" strokeWidth="3" 
                  strokeDasharray="30 100" strokeDashoffset="-55" />

                {/* 15% Segment (Pending) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#cbd5e1" strokeWidth="3" 
                  strokeDasharray="15 100" strokeDashoffset="-85" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-800">55%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
              </div>
            </div>

            {/* Legends */}
            <div className="mt-6 w-full space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#064e3b]" />
                  Completed
                </span>
                <span className="text-slate-800 font-bold">55%</span>
              </div>
              
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6ee7b7]" />
                  In Progress
                </span>
                <span className="text-slate-800 font-bold">30%</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#cbd5e1]" />
                  Pending
                </span>
                <span className="text-slate-800 font-bold">15%</span>
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
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Recent Tasks</h3>
            <Link href="/board" className="text-xs font-bold text-emerald-800 hover:underline">View All</Link>
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
