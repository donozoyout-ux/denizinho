import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { unwrapN8nResponse } from "@/lib/import/local-parser";
import { parseTasksFromText } from "@/lib/import/local-parser";
import { sendTaskAssignmentEmail } from "@/lib/email/send-notification";

function verifyWebhookKey(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.INCOMING_WEBHOOK_API_KEY;
  if (!expectedKey) return true;
  return apiKey === expectedKey;
}

export async function POST(request: Request) {
  if (!verifyWebhookKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());

  const subject = body.subject || body.konu || null;
  const emailBody = body.body || body.text || body.content || body.message || null;
  const senderEmail = body.sender_email || body.from || body.sender || null;

  // System email loop protection
  const systemUserEmail = process.env.SMTP_USER || "";
  const isSystemEmail = senderEmail && senderEmail.toLowerCase() === systemUserEmail.toLowerCase();
  const isSystemSubject = subject && (
    subject.toLowerCase().includes("yeni görev atandı") ||
    subject.toLowerCase().includes("görev atandı") ||
    subject.toLowerCase().includes("ekipplan") ||
    subject.toLowerCase().includes("sistem bildirimi") ||
    subject.toLowerCase().includes("aidflow")
  );

  if (isSystemEmail || isSystemSubject) {
    return NextResponse.json({
      success: true,
      mode: "skipped",
      reason: "System notifications or system sender ignored to prevent loops"
    });
  }

  let tasks = body.tasks ? unwrapN8nResponse(body.tasks) : [];
  if (tasks.length === 0 && emailBody) {
    tasks = parseTasksFromText(emailBody);
  }
  if (tasks.length === 0 && body.gorevler) {
    tasks = unwrapN8nResponse(body.gorevler);
  }

  const { data: allUsers } = await supabase.from("users").select("id, email, group_id");
  const emailToId = new Map(
    (allUsers ?? []).map((u) => [u.email.toLowerCase(), u.id])
  );

  const senderUser = senderEmail
    ? (allUsers ?? []).find((u) => u.email?.toLowerCase() === senderEmail.toLowerCase())
    : null;
  const targetGroupId =
    senderUser?.group_id ||
    (allUsers ?? []).find((u) => u.group_id)?.group_id ||
    null;

  const autoCreate = body.auto_create_tasks !== false && tasks.length > 0;

  if (autoCreate) {
    const tasksToInsert = tasks.map((item) => ({
      title: item.gorev_adi,
      description: item.aciklama || emailBody?.slice(0, 500) || null,
      assigned_to: item.ilgili_eposta
        ? emailToId.get(item.ilgili_eposta.toLowerCase()) ?? null
        : senderEmail
          ? emailToId.get(senderEmail.toLowerCase()) ?? null
          : null,
      status: "todo" as const,
      created_by: senderUser?.id || (allUsers ?? []).find((u) => u.id)?.id || null,
      group_id: targetGroupId,
    }));

    const { data: inserted, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, telegram_chat_id)");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const task of inserted ?? []) {
      if (task.assignee?.email) {
        await sendTaskAssignmentEmail({
          to: task.assignee.email,
          taskTitle: task.title,
          taskDescription: task.description,
          assignedBy: "E-posta taraması",
          telegramChatId: task.assignee.telegram_chat_id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      mode: "auto_tasks",
      count: inserted?.length ?? 0,
      tasks: inserted,
    });
  }

  const { data, error } = await supabase
    .from("incoming_requests")
    .insert({
      subject,
      body: emailBody,
      sender_email: senderEmail,
      status: "pending",
      group_id: targetGroupId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode: "draft", request: data });
}
