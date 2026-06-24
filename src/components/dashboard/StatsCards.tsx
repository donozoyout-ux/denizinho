import { CheckCircle2, Clock, ListTodo, Mail, Users, Briefcase, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  pendingRequests: number;
  activeProjectsCount: number;
}

export function StatsCards({
  totalTasks,
  todoCount,
  inProgressCount,
  doneCount,
  pendingRequests,
  activeProjectsCount,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Toplam Hareketler",
      value: totalTasks,
      indicator: todoCount > 0 ? `${todoCount} bekleyen görev` : "Tüm görevler tamamlandı",
      icon: Users,
      borderStyle: "border-l-emerald-600",
      iconBg: "bg-[#e8f5ec] text-emerald-800",
    },
    {
      label: "Aktif Projeler",
      value: activeProjectsCount,
      indicator: inProgressCount > 0 ? `${inProgressCount} devam eden görev` : "Aktif görev yok",
      icon: Briefcase,
      borderStyle: "border-l-amber-500",
      iconBg: "bg-[#fff3e0] text-amber-700",
    },
    {
      label: "Tamamlanan Görevler",
      value: doneCount,
      indicator: totalTasks > 0
        ? `Tüm görevlerin %${Math.round((doneCount / totalTasks) * 100)}'i`
        : "Henüz görev yok",
      icon: CheckCircle2,
      borderStyle: "border-l-[#0284c7]",
      iconBg: "bg-[#e0f2fe] text-[#0369a1]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`rounded-2xl border border-slate-200/60 border-l-4 ${stat.borderStyle} bg-white p-6 shadow-sm hover:shadow-md transition duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stat.value.toLocaleString("tr-TR")}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stat.iconBg}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
            
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              {stat.value > 0 && (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <span className={stat.value > 0 ? "text-emerald-700 font-bold" : ""}>
                {stat.indicator}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
