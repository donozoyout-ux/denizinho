import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/database";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/types/database";

interface BadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TASK_STATUS_COLORS[status],
        className
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

interface RoleBadgeProps {
  isAdmin: boolean;
}

export function RoleBadge({ isAdmin }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "bg-tider-green-light text-tider-green"
      )}
    >
      Kullanıcı
    </span>
  );
}
