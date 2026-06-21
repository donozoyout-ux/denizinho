"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus, User } from "@/types/database";
import { TASK_STATUS_LABELS } from "@/types/database";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const columnStyles: Record<TaskStatus, { border: string; bg: string; header: string }> = {
  todo: {
    border: "border-t-slate-400",
    bg: "bg-white/70 backdrop-blur-md",
    header: "text-slate-700",
  },
  in_progress: {
    border: "border-t-tider-orange",
    bg: "bg-white/75 backdrop-blur-md",
    header: "text-tider-orange",
  },
  done: {
    border: "border-t-tider-green",
    bg: "bg-white/70 backdrop-blur-md",
    header: "text-tider-green-dark",
  },
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  user: User;
  currentUserId: string;
  teamMembers?: User[];
  onEditTask?: (task: Task) => void;
  onViewTask?: (task: Task) => void;
  subtaskCounts?: Record<string, number>;
  onReassign?: (taskId: string, newAssigneeId: string) => void;
}

export function KanbanColumn({
  status,
  tasks,
  user,
  currentUserId,
  teamMembers = [],
  onEditTask,
  onViewTask,
  subtaskCounts = {},
  onReassign,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = columnStyles[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[420px] flex-col rounded-2xl border border-white/60 shadow-lg",
        "border-t-[5px]",
        style.border,
        style.bg,
        isOver && "ring-2 ring-tider-green/40 scale-[1.01]"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", 
            status === "todo" && "bg-slate-450",
            status === "in_progress" && "bg-amber-500",
            status === "done" && "bg-emerald-600"
          )} />
          <h3 className={cn("text-sm font-bold tracking-wide", style.header)}>
            {TASK_STATUS_LABELS[status]}
          </h3>
        </div>
        <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-600">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 space-y-3 px-3 pb-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            user={user}
            currentUserId={currentUserId}
            teamMembers={teamMembers}
            onView={onViewTask}
            subtaskCount={subtaskCounts[task.id] ?? 0}
            onReassign={onReassign}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200/80 py-10 text-center">
            <Plus className="mb-2 h-5 w-5 text-gray-300" />
            <p className="text-xs text-gray-400">Kart ekle veya sürükle</p>
          </div>
        )}
      </div>
    </div>
  );
}
