import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { sendTaskAssignmentEmail } from "@/lib/email/send-notification";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parent_id");

  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role, telegram_chat_id)")
    .order("created_at", { ascending: false });

  if (parentId) {
    query = query.eq("parent_id", parentId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Herkes görev oluşturabilir (grup içinde birbirine atayabilir)
  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: body.title,
      description: body.description || null,
      assigned_to: body.assigned_to || null,
      status: body.status || "todo",
      due_date: body.due_date || null,
      created_by: user.id,
      group_id: user.group_id || null,
      parent_id: body.parent_id || null,
      project_id: body.project_id || null,
    })
    .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, role, telegram_chat_id)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.assigned_to && data.assignee?.email) {
    await sendTaskAssignmentEmail({
      to: data.assignee.email,
      taskTitle: data.title,
      taskDescription: data.description,
      dueDate: data.due_date,
      assignedBy: user.full_name || user.email,
      telegramChatId: data.assignee.telegram_chat_id,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
