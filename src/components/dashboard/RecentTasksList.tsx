"use client";

import { useState } from "react";
import type { Task } from "@/types/database";
import { formatDateTime, getTaskTimeProgress, cn } from "@/lib/utils";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/types/database";
import { Calendar, User as UserIcon, CheckCircle2, Circle } from "lucide-react";
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

  const showMoreLink = (totalCount ?? tasks.length) > 5;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="divide-y divide-gray-50">
          {tasks.map((task) => {
            const progress = getTaskTimeProgress(
              task.created_at,
              task.due_date,
              task.status
            );

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedTask(task)}
                className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-slate-50/80"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {task.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-tider-green shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
                    {task.due_date && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-gray-600 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDateTime(task.due_date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-gray-600 font-medium">
                      <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                      {task.assignee?.full_name || task.assignee?.email || "Atanmadı"}
                    </span>
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

                {task.due_date && task.status !== "done" && (
                  <div className="space-y-1 pl-8">
                    <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                      <span>{progress.label}</span>
                      <span>%{progress.percent}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          progress.isOverdue ? "bg-red-500" : "bg-tider-green"
                        )}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {showMoreLink && (
          <div className="border-t border-gray-50 bg-slate-50/30 p-3 text-center">
            <Link
              href="/board"
              className="text-xs font-semibold text-tider-green hover:underline"
            >
              Tüm Görevleri Gör ({totalCount ?? tasks.length})
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
