"use client";

import { useState, useEffect } from "react";
import type { Task, User } from "@/types/database";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/types/database";
import { formatDateTime, getTaskTimeProgress, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  User as UserIcon,
  Clock,
  FileText,
  Plus,
  CheckCircle2,
  Circle,
  Pencil,
} from "lucide-react";
import Link from "next/link";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  user?: User;
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!task?.id || !open) return;
    fetch(`/api/tasks?parent_id=${task.id}`)
      .then((r) => r.json())
      .then((data) => setSubtasks(Array.isArray(data) ? data : []))
      .catch(() => setSubtasks([]));
  }, [task?.id, open]);

  if (!task) return null;

  const progress = getTaskTimeProgress(
    task.created_at,
    task.due_date,
    task.status
  );

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubtask.trim(),
          status: "todo",
          parent_id: task.id,
          project_id: task.project_id,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSubtasks((prev) => [created, ...prev]);
        setNewSubtask("");
      }
    } finally {
      setAdding(false);
    }
  };

  const toggleSubtask = async (sub: Task) => {
    const newStatus = sub.status === "done" ? "todo" : "done";
    const res = await fetch(`/api/tasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={task.title}>
      <div className="space-y-5 animate-in fade-in duration-300">
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
              <span className={cn(progress.isOverdue ? "text-red-600" : "text-gray-700")}>
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

        {/* Alt görevler */}
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-violet-900">Alt Görevler</h4>
          <form onSubmit={handleAddSubtask} className="mb-3 flex gap-2">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Yeni alt görev..."
              className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
            <Button type="submit" size="sm" loading={adding}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {subtasks.length === 0 ? (
              <p className="text-xs text-violet-400">Henüz alt görev yok</p>
            ) : (
              subtasks.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => toggleSubtask(sub)}
                  className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-violet-50"
                >
                  {sub.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-tider-green shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300 shrink-0" />
                  )}
                  <span className={cn(sub.status === "done" && "line-through text-gray-400")}>
                    {sub.title}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-between gap-3 border-t border-gray-100 pt-4">
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Düzenle
            </Button>
          )}
          <Link
            href="/board"
            className="ml-auto text-sm font-medium text-tider-green hover:underline"
            onClick={onClose}
          >
            Panoda Aç →
          </Link>
        </div>
      </div>
    </Modal>
  );
}
