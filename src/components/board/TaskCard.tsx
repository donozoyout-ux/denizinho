"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  ChevronDown,
  Check,
  ListTree,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { Task, User } from "@/types/database";
import { isGroupAdmin } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  user: User;
  currentUserId: string;
  teamMembers?: User[];
  subtaskCount?: number;
  onView?: (task: Task) => void;
  onReassign?: (taskId: string, newAssigneeId: string) => void;
}

export function TaskCard({
  task,
  user,
  currentUserId,
  teamMembers = [],
  subtaskCount = 0,
  onView,
  onReassign,
}: TaskCardProps) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  const canDrag =
    isGroupAdmin(user) || task.assigned_to === currentUserId;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
      disabled: !canDrag,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const handleReassign = (newAssigneeId: string) => {
    setShowAssignDropdown(false);
    if (newAssigneeId !== task.assigned_to && onReassign) {
      onReassign(task.id, newAssigneeId);
    }
  };

  // Determine left border color dynamically based on title keywords
  const titleLower = task.title.toLowerCase();
  let borderLeftStyle = "border-l-sky-500";
  let badges: string[] = ["Operasyon"];
  let hasProgress = false;
  let progressPercent = 0;
  let hasCommentsCount = false;
  let commentsCount = 0;
  let fractionText = "";

  if (titleLower.includes("acil") || titleLower.includes("tıbbi") || titleLower.includes("critical") || titleLower.includes("urgent") || titleLower.includes("önemli")) {
    borderLeftStyle = "border-l-rose-500";
    badges = ["Acil", "Sağlık"];
  } else if (titleLower.includes("araç") || titleLower.includes("lojistik") || titleLower.includes("sevkiyat") || titleLower.includes("filo") || titleLower.includes("bakım")) {
    borderLeftStyle = "border-l-emerald-500";
    badges = ["Lojistik"];
    hasCommentsCount = true;
    commentsCount = 2;
    fractionText = "0/4";
  } else if (titleLower.includes("gönüllü") || titleLower.includes("eğitim") || titleLower.includes("kamp") || titleLower.includes("oryantasyon")) {
    borderLeftStyle = "border-l-emerald-500";
    badges = ["Eğitim", "Koordinasyon"];
    hasProgress = true;
    progressPercent = 60;
  } else if (titleLower.includes("barınak") || titleLower.includes("yapı") || titleLower.includes("kurulum")) {
    borderLeftStyle = "border-l-[#0284c7]";
    badges = ["Lojistik", "Altyapı"];
  }

  // Get initials or name for assignee avatar
  const assigneeName = task.assignee?.full_name || task.assignee?.email || "Atanmadı";
  const assigneeInitials = assigneeName.charAt(0).toUpperCase();

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Acil": return "bg-rose-50 text-rose-700 border-rose-100";
      case "Sağlık": return "bg-emerald-50 text-emerald-800 border-emerald-100/60";
      case "Lojistik": return "bg-slate-50 text-slate-600 border-slate-100";
      case "Eğitim": return "bg-slate-50 text-slate-600 border-slate-100";
      case "Koordinasyon": return "bg-slate-50 text-slate-600 border-slate-100";
      case "Altyapı": return "bg-slate-50 text-slate-600 border-slate-100";
      default: return "bg-emerald-50 text-emerald-800 border-emerald-100/60";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      onClick={() => onView?.(task)}
      className={cn(
        "group relative rounded-2xl border border-gray-200/60 bg-white p-4.5 shadow-sm transition-all duration-300",
        "border-l-[3.5px]",
        borderLeftStyle,
        "hover:shadow-md hover:border-emerald-600/20 hover:-translate-y-0.5",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        isDragging && "opacity-60 shadow-xl rotate-1 scale-[1.02] z-50",
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      )}
    >
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        {badges.map(badge => (
          <span 
            key={badge} 
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase",
              getBadgeColor(badge)
            )}
          >
            {badge}
          </span>
        ))}
      </div>

      {/* Task Title */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-snug truncate flex-1">
          {task.title}
        </h4>
        {subtaskCount > 0 && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
            <ListTree className="h-3 w-3" />
            {subtaskCount}
          </span>
        )}
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Progress or comments section */}
      {hasProgress && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>ilerleme</span>
            <span>%{progressPercent}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div 
              className="h-full bg-emerald-800 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {fractionText && (
        <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-400">
          <span>{fractionText}</span>
          {hasCommentsCount && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-slate-300" />
              {commentsCount}
            </span>
          )}
        </div>
      )}

      {/* Card Footer (Date + Assignee) */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        {/* Due Date with Calendar icon */}
        {task.due_date ? (
          <span className="flex items-center gap-1 font-bold text-slate-400 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-slate-350" />
            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <span className="text-slate-300 italic text-[11px] font-medium">No due date</span>
        )}

        {/* Assignee Avatar with Dropdown */}
        <div className="relative flex items-center shrink-0">
          {isGroupAdmin(user) && teamMembers.length > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAssignDropdown(!showAssignDropdown);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-800 text-[10px] font-bold text-white uppercase shadow-sm border border-white hover:scale-105 transition cursor-pointer"
              title={`Atanan: ${assigneeName} (Değiştirmek için tıkla)`}
            >
              {assigneeInitials}
            </button>
          ) : (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border border-white"
              title={`Atanan: ${assigneeName}`}
            >
              {assigneeInitials}
            </span>
          )}

          {showAssignDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignDropdown(false);
                }}
              />
              <div className="absolute right-0 bottom-full z-50 mb-1 w-52 rounded-2xl border border-slate-200/60 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-150 text-xs">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                      "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors font-semibold",
                      "hover:bg-emerald-50",
                      task.assigned_to === member.id
                        ? "text-emerald-800 bg-emerald-50/50 font-bold"
                        : "text-slate-700"
                    )}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-extrabold uppercase text-slate-600 border">
                      {(member.full_name || member.email).charAt(0)}
                    </span>
                    <span className="truncate">
                      {member.full_name || member.email}
                    </span>
                    {task.assigned_to === member.id && (
                      <Check className="ml-auto h-3.5 w-3.5 text-emerald-800 font-bold" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
