import { Header } from "@/components/layout/Header";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getDonors } from "@/lib/donors-store";
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  AlertTriangle, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown,
  CheckCircle2
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.group_id) {
    redirect("/group-setup");
  }

  const supabase = await createClient();
  const groupId = user.group_id;

  // Fetch counts from DB
  const [
    totalTasksRes,
    todoTasksRes,
    inProgressTasksRes,
    doneTasksRes,
    activeProjectsRes,
    pendingRequestsRes,
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("group_id", groupId),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("group_id", groupId).eq("status", "todo"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("group_id", groupId).eq("status", "in_progress"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("group_id", groupId).eq("status", "done"),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("group_id", groupId).neq("status", "done"),
    supabase.from("incoming_requests").select("*", { count: "exact", head: true }).eq("group_id", groupId).eq("status", "pending")
  ]);

  const totalTasks = totalTasksRes.count ?? 0;
  const todoCount = todoTasksRes.count ?? 0;
  const inProgressCount = inProgressTasksRes.count ?? 0;
  const doneCount = doneTasksRes.count ?? 0;
  const activeProjectsCount = activeProjectsRes.count ?? 0;
  const pendingRequests = pendingRequestsRes.count ?? 0;

  // Donors calculation
  const donors = getDonors().filter(d => d.group_id === groupId);
  const totalDonations = donors.reduce((sum, d) => sum + d.total_donated, 0);

  // Calculate task change (completed in last 7 days vs previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const { data: recentDoneTasks } = await supabase
    .from("tasks")
    .select("updated_at")
    .eq("group_id", groupId)
    .eq("status", "done");

  const last7DaysCount = recentDoneTasks?.filter(t => new Date(t.updated_at) >= sevenDaysAgo).length ?? 0;
  const prev7DaysCount = recentDoneTasks?.filter(t => {
    const d = new Date(t.updated_at);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length ?? 0;
  
  let taskChange = "0%";
  let isTaskChangePositive = true;
  if (prev7DaysCount > 0) {
    const pct = ((last7DaysCount - prev7DaysCount) / prev7DaysCount) * 100;
    taskChange = `${pct >= 0 ? "+" : ""}${Math.round(pct)}%`;
    isTaskChangePositive = pct >= 0;
  } else if (last7DaysCount > 0) {
    taskChange = `+${last7DaysCount}`;
    isTaskChangePositive = true;
  }

  // Stats definition
  const stats = [
    {
      title: "Tamamlanan Görevler",
      value: doneCount.toLocaleString("tr-TR"),
      change: taskChange,
      isPositive: isTaskChangePositive,
      icon: CheckCircle2,
    },
    {
      title: "Aktif Projeler",
      value: activeProjectsCount.toLocaleString("tr-TR"),
      change: "+0%",
      isPositive: true,
      icon: Briefcase,
    },
    {
      title: "Toplam Bağış",
      value: `₺${totalDonations.toLocaleString("tr-TR")}`,
      change: "+0%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: "Bekleyen Talepler",
      value: pendingRequests.toLocaleString("tr-TR"),
      change: "Aktif",
      isPositive: true,
      icon: AlertTriangle,
    },
  ];

  // Fetch task history for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const { data: tasksHistory } = await supabase
    .from("tasks")
    .select("status, created_at, updated_at")
    .eq("group_id", groupId)
    .gte("created_at", sixMonthsAgo.toISOString());

  const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const trendData = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const monthName = monthNames[monthIndex];
    
    const createdCount = tasksHistory?.filter(t => {
      const cDate = new Date(t.created_at);
      return cDate.getFullYear() === year && cDate.getMonth() === monthIndex;
    }).length ?? 0;

    const completedCount = tasksHistory?.filter(t => {
      if (t.status !== "done" || !t.updated_at) return false;
      const uDate = new Date(t.updated_at);
      return uDate.getFullYear() === year && uDate.getMonth() === monthIndex;
    }).length ?? 0;

    trendData.push({
      month: monthName,
      completed: completedCount,
      created: createdCount
    });
  }

  const maxVal = Math.max(...trendData.map(d => Math.max(d.completed, d.created, 5)));

  // Task Status Donut Calculations
  const todoPercent = totalTasks > 0 ? Math.round((todoCount / totalTasks) * 100) : 0;
  const inProgressPercent = totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0;
  const donePercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const statusDistribution = [
    { name: "Tamamlanan", percentage: donePercent, color: "bg-emerald-600", stroke: "#059669" },
    { name: "Devam Eden", percentage: inProgressPercent, color: "bg-emerald-400", stroke: "#34d399" },
    { name: "Yapılacak", percentage: todoPercent, color: "bg-emerald-200", stroke: "#a7f3d0" }
  ];

  // Fetch projects list with completion percentage
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, title, status, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(5);

  const projectsList = [];
  if (projectsData) {
    for (const project of projectsData) {
      const [allTasksCountRes, projectDoneTasksCountRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("status", "done")
      ]);
      
      const total = allTasksCountRes.count ?? 0;
      const done = projectDoneTasksCountRes.count ?? 0;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      
      projectsList.push({
        id: project.id,
        title: project.title,
        status: project.status === "done" ? "Tamamlandı" : project.status === "in_progress" ? "Devam Ediyor" : "Yapılacak",
        progress: `${progress}%`
      });
    }
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Header
          title="Grup Performans Raporu"
          description="Grubunuzun görev, proje ve bağış operasyonlarının analitiği."
        />
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <Download className="h-4 w-4" />
            PDF Raporunu İndir
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            Son 30 Gün
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{stat.title}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  stat.isPositive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "bg-orange-50 text-orange-700"
                }`}>
                  {stat.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-bold tracking-tight text-gray-900">{stat.value}</span>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Aid Distribution Trend */}
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Görev Aktivite Trendi</h3>
              <p className="text-xs text-gray-500">Oluşturulan yeni görevler vs tamamlanan görevler</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-3 w-3 rounded bg-emerald-600" />
                Tamamlanan
              </span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-3 w-3 rounded bg-emerald-200" />
                Yeni Görev
              </span>
            </div>
          </div>
          
          {/* Custom SVG Bar Chart */}
          <div className="mt-6 flex h-64 items-end justify-between gap-4 px-2">
            {trendData.map((data, idx) => {
              const completedHeight = (data.completed / maxVal) * 100;
              const createdHeight = (data.created / maxVal) * 100;

              return (
                <div key={idx} className="group flex flex-1 flex-col items-center gap-2 h-full justify-end">
                  <div className="relative w-full flex items-end justify-center gap-1.5 h-full pb-2 border-b border-gray-100">
                    {/* Created Bar */}
                    <div 
                      className="w-3 rounded-t bg-emerald-200 transition-all duration-500 group-hover:bg-emerald-300"
                      style={{ height: `${createdHeight}%` }}
                      title={`Yeni Görev: ${data.created}`}
                    />
                    {/* Completed Bar */}
                    <div 
                      className="w-3 rounded-t bg-emerald-600 transition-all duration-500 group-hover:bg-emerald-700"
                      style={{ height: `${completedHeight}%` }}
                      title={`Tamamlanan: ${data.completed}`}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Status Distribution */}
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-50 pb-4">
            <h3 className="text-base font-bold text-gray-900">Görev Durumu</h3>
            <p className="text-xs text-gray-500">Grubun genel görev aşamaları oranı</p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center h-44 w-44">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background track */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                
                {/* Done Segment */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#059669" strokeWidth="3" 
                  strokeDasharray={`${donePercent} 100`} strokeDashoffset="0" />
                
                {/* In Progress Segment */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#34d399" strokeWidth="3" 
                  strokeDasharray={`${inProgressPercent} 100`} strokeDashoffset={`-${donePercent}`} />

                {/* Todo Segment */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#a7f3d0" strokeWidth="3" 
                  strokeDasharray={`${todoPercent} 100`} strokeDashoffset={`-${donePercent + inProgressPercent}`} />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-gray-900">{donePercent}%</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tamamlandı</span>
              </div>
            </div>

            {/* Legends */}
            <div className="mt-6 w-full space-y-2">
              {statusDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-gray-900">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Efficiency Section */}
      <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Operasyonel Proje Durumu</h3>
            <p className="text-xs text-gray-500">Devam eden veya tamamlanan projelerin tamamlanma oranları</p>
          </div>
        </div>

        {projectsList.length === 0 ? (
          <p className="text-center py-6 text-xs text-gray-400 italic">Kayıtlı proje bulunmamaktadır.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 rounded-l-lg">Proje Adı</th>
                  <th className="px-6 py-3">Durum</th>
                  <th className="px-6 py-3 rounded-r-lg">Tamamlanma Oranı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectsList.map((op, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{op.title}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        op.status === "Tamamlandı" 
                          ? "bg-emerald-50 text-emerald-700" 
                          : op.status === "Devam Ediyor"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-50 text-gray-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          op.status === "Tamamlandı" ? "bg-emerald-600" : op.status === "Devam Ediyor" ? "bg-amber-500" : "bg-gray-400"
                        }`} />
                        {op.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <span className="w-8">{op.progress}</span>
                        <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                          <div 
                            className="h-full rounded-full bg-emerald-600" 
                            style={{ width: op.progress }} 
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
