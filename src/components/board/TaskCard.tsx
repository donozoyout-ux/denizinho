"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User as UserIcon, GripVertical } from "lucide-react";
import type { Task, UserRole } from "@/types/database";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  userRole: UserRole;
  currentUserId: string;
  onEdit?: (task: Task) => void;
}

export function TaskCard({
  task,
  userRole,
  currentUserId,
  onEdit,
}: TaskCardProps) {
  const canDrag =
    userRole === "patron" ||
    (task.assigned_to === currentUserId && task.status !== "done");

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
      disabled: !canDrag,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all",
        "hover:shadow-md hover:border-gray-200",
        isDragging && "opacity-50 shadow-lg rotate-1",
        !canDrag && "cursor-default"
      )}
    >
      <div className="flex items-start gap-2">
        {canDrag && (
          <button
            className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div
          className="flex-1 min-w-0"
          onClick={() => userRole === "patron" && onEdit?.(task)}
        >
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {task.title}
          </h4>
          {task.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {task.assignee && (
              <span className="flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                {task.assignee.full_name || task.assignee.email}
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
