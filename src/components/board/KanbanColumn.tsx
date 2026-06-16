"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus, UserRole } from "@/types/database";
import { TASK_STATUS_LABELS } from "@/types/database";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

const columnColors: Record<TaskStatus, string> = {
  todo: "border-t-gray-300",
  in_progress: "border-t-tider-orange",
  done: "border-t-tider-green",
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  userRole: UserRole;
  currentUserId: string;
  onEditTask?: (task: Task) => void;
}

export function KanbanColumn({
  status,
  tasks,
  userRole,
  currentUserId,
  onEditTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border border-gray-100 bg-gray-50/50",
        "border-t-4",
        columnColors[status],
        isOver && "ring-2 ring-tider-green/30 bg-tider-green-light/30"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {TASK_STATUS_LABELS[status]}
        </h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-500 shadow-sm">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 space-y-3 px-3 pb-4 min-h-[200px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            userRole={userRole}
            currentUserId={currentUserId}
            onEdit={onEditTask}
          />
        ))}
        {tasks.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-400">
            Görev yok
          </p>
        )}
      </div>
    </div>
  );
}
