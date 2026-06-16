import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTasksFromText } from "@/lib/import/local-parser";
import { sendTaskAssignmentEmail } from "@/lib/email/send-notification";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { User } from "@/types/database";

export const dynamic = "force-dynamic";

function verifyWebhookKey(request: Request): boolean {
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("key");
  const headerKey = request.headers.get("x-api-key");
  
  const expectedKey = process.env.INCOMING_WEBHOOK_API_KEY;
  if (!expectedKey) return true;
  return queryKey === expectedKey || headerKey === expectedKey;
}

interface SyncResult {
  sender: string;
  type: "task" | "request";
  count?: number;
  id?: string;
  error?: string;
}

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

async function handleSync(request: Request) {
  if (!verifyWebhookKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const imapHost = smtpHost.replace("smtp", "imap");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return NextResponse.json(
      { error: "SMTP/IMAP credentials not configured (SMTP_USER/SMTP_PASS)" },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role key is not configured" },
      { status: 500 }
    );
  }

  // 1. Fetch registered users to match email addresses
  const { data: allUsers, error: usersError } = await supabase
    .from("users")
    .select("id, email, full_name, role, telegram_chat_id");

  if (usersError) {
    return NextResponse.json(
      { error: `Failed to fetch users: ${usersError.message}` },
      { status: 500 }
    );
  }

  const typedUsers = (allUsers ?? []) as User[];
  const emailToUser = new Map<string, User>(
    typedUsers.map((u) => [u.email.toLowerCase(), u])
  );

  const patron = typedUsers.find((u) => u.role === "patron") ?? typedUsers[0] ?? null;
  const createdBy = patron?.id ?? null;

  const client = new ImapFlow({
    host: imapHost,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  interface ImapMessage {
    uid: number;
    source: Buffer;
  }

  const results: SyncResult[] = [];
  let processedCount = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    
    try {
      // Fetch unseen messages
      const messages: ImapMessage[] = [];
      for await (const msg of client.fetch({ unseen: true }, { source: true })) {
        messages.push({
          uid: msg.uid,
          source: msg.source,
        });
      }

      for (const msg of messages) {
        const parsed = await simpleParser(msg.source);
        const subject = parsed.subject || "E-posta Talebi";
        const emailBody = parsed.text || parsed.html || "";
        
        // Extract sender email safely
        let senderEmail = "";
        if (parsed.from && parsed.from.value && parsed.from.value[0]) {
          senderEmail = parsed.from.value[0].address || "";
        } else if (parsed.from && typeof parsed.from === "string") {
          const match = parsed.from.match(/<([^>]+)>/);
          senderEmail = match ? match[1] : parsed.from;
        }
        senderEmail = senderEmail.trim().toLowerCase();

        if (!senderEmail) {
          console.warn(`[Email Sync] Could not parse sender for msg UID: ${msg.uid}`);
          continue;
        }

        const senderUser = emailToUser.get(senderEmail);

        if (senderUser) {
          // A. REGISTERED SENDER: Parse and create tasks directly
          const parsedTasks = parseTasksFromText(emailBody);
          const tasksToInsert =
            parsedTasks.length > 0
              ? parsedTasks
              : [{ gorev_adi: subject, aciklama: emailBody }];

          const recordsToInsert = tasksToInsert.map((item) => ({
            title: item.gorev_adi,
            description: item.aciklama || emailBody.slice(0, 500) || null,
            assigned_to: item.ilgili_eposta
              ? emailToUser.get(item.ilgili_eposta.toLowerCase())?.id ?? senderUser.id
              : senderUser.id,
            status: "todo" as const,
            created_by: createdBy,
          }));

          const { data: inserted, error: insertError } = await supabase
            .from("tasks")
            .insert(recordsToInsert)
            .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, telegram_chat_id)");

          if (insertError) {
            console.error(`[Email Sync] Task insertion error: ${insertError.message}`);
            results.push({ sender: senderEmail, type: "task", error: insertError.message });
          } else {
            const count = inserted?.length ?? 0;
            processedCount += count;
            results.push({ sender: senderEmail, type: "task", count });

            // Send notification for each inserted task
            for (const task of inserted ?? []) {
              if (task.assignee?.email) {
                await sendTaskAssignmentEmail({
                  to: task.assignee.email,
                  taskTitle: task.title,
                  taskDescription: task.description,
                  assignedBy: `E-posta (${senderUser.full_name || senderEmail})`,
                  telegramChatId: task.assignee.telegram_chat_id,
                });
              }
            }
          }
        } else {
          // B. UNREGISTERED SENDER: Save as pending draft/incoming_request
          const { data: insertedReq, error: reqError } = await supabase
            .from("incoming_requests")
            .insert({
              subject,
              body: emailBody,
              sender_email: senderEmail,
              status: "pending",
            })
            .select()
            .single();

          if (reqError) {
            console.error(`[Email Sync] Request insertion error: ${reqError.message}`);
            results.push({ sender: senderEmail, type: "request", error: reqError.message });
          } else {
            processedCount++;
            results.push({ sender: senderEmail, type: "request", id: insertedReq?.id });
          }
        }

        // Mark message as read
        await client.messageFlagsAdd([msg.uid], ["\\Seen"], { uid: true });
      }
    } finally {
      lock.release();
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Email Sync] IMAP process error:", err);
    return NextResponse.json(
      { error: `IMAP error: ${errMsg}` },
      { status: 500 }
    );
  } finally {
    await client.logout();
  }

  return NextResponse.json({
    success: true,
    processedCount,
    details: results,
  });
}
