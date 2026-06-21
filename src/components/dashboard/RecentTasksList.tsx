"use client";

import { useState } from "react";
import type { Task } from "@/types/database";
import { formatDateTime, cn } from "@/lib/utils";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Truck, 
  HelpCircle,
  FileText,
  Play
} from "lucide-react";
import Link from "next/link";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

interface RecentTasksListProps {
  tasks: Task[];
  totalCount?: number;
}

export function RecentTasksList({ tasks, totalCount }: RecentTasksListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">Bu grupta henüz hiç görev oluşturulmadı.</p>
        <Link
          href="/board"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:underline"
        >
          Görev Panosuna Git →
        </Link>
      </div>
    );
  }

  const showMoreLink = (totalCount ?? tasks.length) > 5;

  // Helper for task type icon on dashboard
  const getTaskIcon = (task: Task) => {
    if (task.status === "done") {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f5ec] text-emerald-800">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </div>
      );
    }
    
    // Check keywords for specific icons matching screenshot
    const titleLower = task.title.toLowerCase();
    if (titleLower.includes("sevkiyat") || titleLower.includes("dağıtım") || titleLower.includes("supplies") || titleLower.includes("transport")) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e0f2fe] text-[#0369a1]">
          <Truck className="h-4.5 w-4.5" />
        </div>
      );
    }
    
    if (task.status === "in_progress") {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff3e0] text-[#b45309]">
          <Play className="h-4 w-4" />
        </div>
      );
    }

    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <Clock className="h-4.5 w-4.5" />
      </div>
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "done":
        return "bg-[#e8f5ec] text-emerald-800 border-emerald-100/60";
      case "in_progress":
        return "bg-amber-50 text-amber-700 border-amber-100/60";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done": return "Completed";
      case "in_progress": return "In Progress";
      default: return "Todo";
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const assigneeName = task.assignee?.full_name || task.assignee?.email || "Atanmadı";
            const formattedDate = task.due_date ? formatDateTime(task.due_date) : "Tarih Belirtilmedi";

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition duration-150"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {getTaskIcon(task)}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate hover:text-emerald-800 transition">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Due {formattedDate} • Assignee: {assigneeName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                      getStatusBadgeStyle(task.status)
                    )}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                  
                  <button 
                    type="button" 
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                    }}
                  >
                    <MoreVertical className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {showMoreLink && (
          <div className="border-t border-slate-150 bg-slate-50/30 p-3.5 text-center">
            <Link
              href="/board"
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              View All Tasks ({totalCount ?? tasks.length})
            </Link>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
