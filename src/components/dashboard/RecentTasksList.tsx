"use client";

import type { Task } from "@/types/database";
import { formatDate } from "@/lib/utils";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/types/database";
import { cn } from "@/lib/utils";
import { Calendar, User as UserIcon, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface RecentTasksListProps {
  tasks: Task[];
}

export function RecentTasksList({ tasks }: RecentTasksListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">Bu grupta henüz hiç görev oluşturulmadı.</p>
        <Link
          href="/board"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-tider-green hover:underline"
        >
          Görev Panosuna Git →
        </Link>
      </div>
    );
  }

  // Get top 5 recent tasks
  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="divide-y divide-gray-50">
        {recentTasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              {task.status === "done" ? (
                <CheckCircle2 className="h-5 w-5 text-tider-green shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
              {/* Due Date */}
              {task.due_date && (
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-gray-600 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {formatDate(task.due_date)}
                </span>
              )}

              {/* Assignee */}
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-gray-600 font-medium">
                <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                {task.assignee?.full_name || task.assignee?.email || "Atanmadı"}
              </span>

              {/* Status Badge */}
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
                  TASK_STATUS_COLORS[task.status]
                )}
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
      {tasks.length > 5 && (
        <div className="border-t border-gray-50 bg-slate-50/30 p-3 text-center">
          <Link
            href="/board"
            className="text-xs font-semibold text-tider-green hover:underline"
          >
            Tüm Görevleri Gör ({tasks.length})
          </Link>
        </div>
      )}
    </div>
  );
}
