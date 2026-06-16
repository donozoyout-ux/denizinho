import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendTaskAssignmentEmail } from "@/lib/email/send-notification";

/**
 * Placeholder email notification endpoint.
 * POST /api/email/notify
 * Body: { to, taskTitle, taskDescription?, dueDate?, assignedBy? }
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "patron") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.to || !body.taskTitle) {
    return NextResponse.json(
      { error: "to and taskTitle are required" },
      { status: 400 }
    );
  }

  const result = await sendTaskAssignmentEmail({
    to: body.to,
    taskTitle: body.taskTitle,
    taskDescription: body.taskDescription,
    dueDate: body.dueDate,
    assignedBy: body.assignedBy || user.full_name || user.email,
    telegramChatId: body.telegramChatId,
  });

  return NextResponse.json(result);
}
