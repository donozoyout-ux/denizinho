import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Zaman bazlı ilerleme: created_at → due_date arasında ne kadar süre geçti */
export function getTaskTimeProgress(
  createdAt: string,
  dueDate: string | null,
  status: string
): { percent: number; label: string; isOverdue: boolean } {
  if (status === "done") {
    return { percent: 100, label: "Tamamlandı", isOverdue: false };
  }
  if (!dueDate) {
    return { percent: 0, label: "Tarih yok", isOverdue: false };
  }

  const start = new Date(createdAt).getTime();
  const end = new Date(dueDate).getTime();
  const now = Date.now();

  if (end <= start) {
    return { percent: now >= end ? 100 : 0, label: "Süre doldu", isOverdue: now > end };
  }

  const total = end - start;
  const elapsed = Math.max(0, now - start);
  const percent = Math.min(100, Math.round((elapsed / total) * 100));
  const isOverdue = now > end;

  if (isOverdue) {
    return { percent: 100, label: "Süre aşıldı", isOverdue: true };
  }

  const remaining = end - now;
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let label = "";
  if (days > 0) label = `${days} gün kaldı`;
  else if (hours > 0) label = `${hours} saat kaldı`;
  else label = "Son saatler";

  return { percent, label, isOverdue: false };
}

export function toDatetimeLocalValue(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

