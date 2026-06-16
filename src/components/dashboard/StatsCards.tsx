import { CheckCircle2, Clock, ListTodo, Mail } from "lucide-react";

interface StatsCardsProps {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  pendingRequests: number;
}

export function StatsCards({
  totalTasks,
  todoCount,
  inProgressCount,
  doneCount,
  pendingRequests,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Toplam Görev",
      value: totalTasks,
      icon: ListTodo,
      color: "bg-gray-100 text-gray-600",
    },
    {
      label: "Yapılacaklar",
      value: todoCount,
      icon: Clock,
      color: "bg-gray-100 text-gray-600",
    },
    {
      label: "Devam Edenler",
      value: inProgressCount,
      icon: Clock,
      color: "bg-tider-orange-light text-tider-orange",
    },
    {
      label: "Tamamlananlar",
      value: doneCount,
      icon: CheckCircle2,
      color: "bg-tider-green-light text-tider-green",
    },
    {
      label: "Bekleyen Talepler",
      value: pendingRequests,
      icon: Mail,
      color: "bg-tider-orange-light text-tider-orange",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
