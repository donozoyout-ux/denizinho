import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isGroupAdmin } from "@/lib/auth";
import { sendTaskAssignmentEmail } from "@/lib/email/send-notification";
import type { TaskStatus } from "@/types/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const admin = isGroupAdmin(user);

  // Yönetici veya görev oluşturucu her şeyi yapabilir
  // Normal üye sadece kendine atanan görevin durumunu değiştirebilir
  if (!admin && existing.created_by !== user.id) {
    if (existing.assigned_to !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Üye sadece kendi görevinin durumunu güncelleyebilir
    const allowedFields = ["status"];
    const bodyKeys = Object.keys(body);
    if (bodyKeys.some((k) => !allowedFields.includes(k))) {
      return NextResponse.json(
        { error: "Sadece görev durumunu güncelleyebilirsiniz" },
        { status: 403 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
  if (body.status !== undefined) updateData.status = body.status as TaskStatus;
  if (body.due_date !== undefined) updateData.due_date = body.due_date;

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role, telegram_chat_id)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Görev yeni birine atandıysa bildirim gönder
  if (
    body.assigned_to &&
    body.assigned_to !== existing.assigned_to &&
    data.assignee?.email
  ) {
    await sendTaskAssignmentEmail({
      to: data.assignee.email,
      taskTitle: data.title,
      taskDescription: data.description,
      dueDate: data.due_date,
      assignedBy: user.full_name || user.email,
      telegramChatId: data.assignee.telegram_chat_id,
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Görevi silen kişi ya yönetici ya da görevin oluşturucusu olmalı
  const { data: existing } = await supabase
    .from("tasks")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!isGroupAdmin(user) && existing.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
