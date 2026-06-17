import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { sendTaskAssignmentEmail } from "@/lib/email/send-notification";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !user.group_id) {
    return NextResponse.json({ error: "Forbidden - Bir gruba üye olmalısınız" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: request_data, error: fetchError } = await supabase
    .from("incoming_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !request_data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  let assignedTo: string | null = null;
  let assigneeEmail: string | null = null;

  if (request_data.sender_email) {
    const { data: matchedUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", request_data.sender_email)
      .single();
    assignedTo = matchedUser?.id ?? null;
    assigneeEmail = matchedUser?.email ?? null;
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: request_data.subject || "Gelen Talep",
      description: request_data.body,
      assigned_to: assignedTo,
      status: "todo",
      created_by: user.id,
      group_id: user.group_id,
    })
    .select()
    .single();

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  await supabase
    .from("incoming_requests")
    .update({ status: "converted" })
    .eq("id", id);

  if (assigneeEmail) {
    await sendTaskAssignmentEmail({
      to: assigneeEmail,
      taskTitle: task.title,
      taskDescription: task.description,
      assignedBy: user.full_name || user.email,
    });
  }

  return NextResponse.json(task, { status: 201 });
}
