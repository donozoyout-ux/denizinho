"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  User as UserIcon,
  GripVertical,
  ChevronDown,
  Check,
} from "lucide-react";
import type { Task, User } from "@/types/database";
import { isGroupAdmin } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  user: User;
  currentUserId: string;
  teamMembers?: User[];
  onEdit?: (task: Task) => void;
  onReassign?: (taskId: string, newAssigneeId: string) => void;
}

export function TaskCard({
  task,
  user,
  currentUserId,
  teamMembers = [],
  onEdit,
  onReassign,
}: TaskCardProps) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  const canDrag =
    isGroupAdmin(user) ||
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

  const handleReassign = async (newAssigneeId: string) => {
    setShowAssignDropdown(false);
    if (newAssigneeId !== task.assigned_to && onReassign) {
      onReassign(task.id, newAssigneeId);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all",
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
          onClick={() => isGroupAdmin(user) && onEdit?.(task)}
        >
          <h4 className="text-sm font-semibold text-gray-900 truncate cursor-pointer">
            {task.title}
          </h4>
          {task.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}
          {/* Kişi Bilgileri ve Tarih */}
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
            {/* Görev Veren (Atayan) */}
            <div className="flex items-center gap-2 text-gray-500">
              <span className="font-medium text-gray-400 min-w-[70px]">G. Veren:</span>
              <span className="font-semibold text-gray-700 truncate">
                {task.creator?.full_name || task.creator?.email || "Otomatik/Sistem"}
              </span>
            </div>

            {/* Görev Alıcı (Atanan) */}
            <div className="flex items-center gap-2 text-gray-500 relative">
              <span className="font-medium text-gray-400 min-w-[70px]">G. Alan:</span>
              {isGroupAdmin(user) && teamMembers.length > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAssignDropdown(!showAssignDropdown);
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors font-semibold",
                    "hover:bg-tider-green-light hover:text-tider-green-dark",
                    task.assignee ? "bg-gray-100 text-gray-700" : "bg-orange-50 text-orange-600"
                  )}
                >
                  <span className="truncate max-w-[150px]">
                    {task.assignee?.full_name || task.assignee?.email || "Atanmadı"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              ) : (
                <span className={cn(
                  "font-semibold rounded px-1.5 py-0.5",
                  task.assignee ? "bg-gray-100 text-gray-700" : "bg-orange-50 text-orange-600"
                )}>
                  {task.assignee?.full_name || task.assignee?.email || "Atanmadı"}
                </span>
              )}

              {/* Dropdown */}
              {showAssignDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAssignDropdown(false);
                    }}
                  />
                  <div className="absolute left-0 bottom-full z-50 mb-1 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-150">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Atanacak Kişi
                    </p>
                    {teamMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReassign(member.id);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                          "hover:bg-tider-green-light/50",
                          task.assigned_to === member.id
                            ? "text-tider-green font-medium"
                            : "text-gray-700"
                        )}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold uppercase text-gray-600">
                          {(member.full_name || member.email).charAt(0)}
                        </span>
                        <span className="truncate">
                          {member.full_name || member.email}
                        </span>
                        {task.assigned_to === member.id && (
                          <Check className="ml-auto h-3.5 w-3.5 text-tider-green" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bitiş Tarihi */}
            <div className="flex items-center gap-2 text-gray-500">
              <span className="font-medium text-gray-400 min-w-[70px]">Hedef Gün:</span>
              {task.due_date ? (
                <span className="flex items-center gap-1 font-semibold text-tider-green-dark bg-tider-green-light/40 px-1.5 py-0.5 rounded">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.due_date)}
                </span>
              ) : (
                <span className="text-gray-400 italic">Belirtilmedi</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
