import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { extractTasksFromInput } from "@/lib/n8n/import-tasks";
import { sendTaskAssignmentEmail } from "@/lib/email/send-notification";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.group_id) {
    return NextResponse.json({ error: "Forbidden - Bir gruba üye olmalısınız" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const text = formData.get("text") as string | null;

  if (!file && !text) {
    return NextResponse.json(
      { error: "Dosya veya metin gerekli" },
      { status: 400 }
    );
  }

  try {
    const { tasks: extracted, source } = await extractTasksFromInput(
      file,
      file?.name ?? "input.txt",
      text
    );

    if (extracted.length === 0) {
      return NextResponse.json(
        {
          error:
            "Görev bulunamadı. Her satıra bir görev yazın veya CSV formatı kullanın: Görev Adı, Açıklama, E-posta",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, email")
      .eq("group_id", user.group_id);
    const emailToId = new Map(
      (allUsers ?? []).map((u) => [u.email.toLowerCase(), u.id])
    );

    const tasksToInsert = extracted
      .filter((item) => item.gorev_adi?.trim())
      .map((item) => ({
        title: item.gorev_adi.trim(),
        description: item.aciklama || null,
        assigned_to: item.ilgili_eposta
          ? emailToId.get(item.ilgili_eposta.toLowerCase()) ?? null
          : null,
        status: "todo" as const,
        created_by: user.id,
        group_id: user.group_id,
      }));

    const { data: inserted, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, telegram_chat_id)");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unmappedEmails = extracted
      .filter((t) => t.ilgili_eposta && !emailToId.has(t.ilgili_eposta.toLowerCase()))
      .map((t) => t.ilgili_eposta!);

    for (const task of inserted ?? []) {
      if (task.assigned_to && task.assignee?.email) {
        await sendTaskAssignmentEmail({
          to: task.assignee.email,
          taskTitle: task.title,
          taskDescription: task.description,
          dueDate: task.due_date,
          assignedBy: user.full_name || user.email,
          telegramChatId: task.assignee.telegram_chat_id,
        });
      }
    }

    return NextResponse.json({
      count: inserted?.length ?? 0,
      source,
      tasks: inserted,
      unmappedEmails: [...new Set(unmappedEmails)],
      warning:
        unmappedEmails.length > 0
          ? `${unmappedEmails.length} e-posta ekipte bulunamadı — önce ekip üyesi ekleyin`
          : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import başarısız" },
      { status: 500 }
    );
  }
}
