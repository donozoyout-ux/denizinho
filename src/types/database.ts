// "patron" DB değeri korunuyor (Supabase CHECK constraint uyumluluğu).
// Uygulama içinde "patron" = grup yöneticisi anlamında kullanılır.
// Herhangi bir kullanıcı grup oluşturabilir; oluşturan otomatik yönetici olur.
export type UserRole = "patron" | "team_member";

export type TaskStatus = "todo" | "in_progress" | "done";

export type ProjectStatus = "todo" | "in_progress" | "done";

export type IncomingRequestStatus = "pending" | "converted" | "dismissed";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  telegram_chat_id?: string | null;
  created_at: string;
  group_id?: string | null;
}

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export type InvitationStatus = "pending" | "accepted" | "rejected";

export interface Invitation {
  id: string;
  group_id: string;
  email: string;
  inviter_id: string;
  status: InvitationStatus;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  group_id?: string | null;
  parent_id?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project_id?: string | null;
  parent_id?: string | null;
  assignee?: User | null;
  group_id?: string | null;
  creator?: User | null;
}

export interface IncomingRequest {
  id: string;
  subject: string | null;
  body: string | null;
  sender_email: string | null;
  status: IncomingRequestStatus;
  created_at: string;
  group_id?: string | null;
}

export interface N8nExtractedTask {
  gorev_adi: string;
  aciklama?: string;
  ilgili_eposta?: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Yapılacaklar",
  in_progress: "Devam Edenler",
  done: "Tamamlananlar",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-orange-100 text-orange-700",
  done: "bg-green-100 text-green-700",
};
