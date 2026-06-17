"use client";

import type { Task } from "@/types/database";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/types/database";
import { formatDateTime, getTaskTimeProgress, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Calendar, User as UserIcon, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, open, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  const progress = getTaskTimeProgress(
    task.created_at,
    task.due_date,
    task.status
  );

  return (
    <Modal open={open} onClose={onClose} title={task.title}>
      <div className="space-y-5">
        {task.description && (
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <FileText className="h-3.5 w-3.5" />
              Açıklama
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-400">Durum</p>
            <span
              className={cn(
                "mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                TASK_STATUS_COLORS[task.status]
              )}
            >
              {TASK_STATUS_LABELS[task.status]}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Atanan</p>
            <p className="mt-1 flex items-center gap-1 font-medium text-gray-800">
              <UserIcon className="h-3.5 w-3.5 text-gray-400" />
              {task.assignee?.full_name || task.assignee?.email || "Atanmadı"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Oluşturulma</p>
            <p className="mt-1 flex items-center gap-1 text-gray-700">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {formatDateTime(task.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Son Tarih</p>
            <p className="mt-1 flex items-center gap-1 text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {formatDateTime(task.due_date)}
            </p>
          </div>
        </div>

        {task.due_date && task.status !== "done" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-gray-500">Zaman İlerlemesi</span>
              <span
                className={cn(
                  progress.isOverdue ? "text-red-600" : "text-gray-700"
                )}
              >
                {progress.label} (%{progress.percent})
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress.isOverdue ? "bg-red-500" : "bg-tider-green"
                )}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Link
            href="/board"
            className="text-sm font-medium text-tider-green hover:underline"
            onClick={onClose}
          >
            Panoda Aç →
          </Link>
        </div>
      </div>
    </Modal>
  );
}
