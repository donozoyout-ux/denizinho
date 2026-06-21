import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTaskAssignmentEmail } from "@/lib/email/send-notification";
import { analyzeEmailWithAI } from "@/lib/ai/task-filter";
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
  type: "task" | "request" | "skipped";
  count?: number;
  id?: string;
  aiReason?: string;
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
    .select("id, email, full_name, role, telegram_chat_id, group_id");

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
      const uids = await client.search({ seen: false });
      const messages: ImapMessage[] = [];
      if (uids && uids.length > 0) {
        for await (const msg of client.fetch(uids, { source: true })) {
          if (msg.source) {
            messages.push({
              uid: msg.uid,
              source: msg.source,
            });
          }
        }
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
          const fromStr = parsed.from as string;
          const match = fromStr.match(/<([^>]+)>/);
          senderEmail = match ? match[1] : fromStr;
        }
        senderEmail = senderEmail.trim().toLowerCase();

        if (!senderEmail) {
          console.warn(`[Email Sync] Could not parse sender for msg UID: ${msg.uid}`);
          continue;
        }

        // System email loop protection
        const isSystemEmail = senderEmail.toLowerCase() === user.toLowerCase();
        const isSystemSubject =
          subject.toLowerCase().includes("yeni görev atandı") ||
          subject.toLowerCase().includes("görev atandı") ||
          subject.toLowerCase().includes("ekipplan") ||
          subject.toLowerCase().includes("sistem bildirimi") ||
          subject.toLowerCase().includes("aidflow");

        if (isSystemEmail || isSystemSubject) {
          console.log(`[Email Sync] Skipping system/notification email: "${subject}" from "${senderEmail}"`);
          await client.messageFlagsAdd([msg.uid], ["\\Seen"], { uid: true });
          continue;
        }

        // AI ile e-postayı analiz et
        const aiResult = await analyzeEmailWithAI(subject, emailBody);

        if (!aiResult.isTask) {
          // AI görev değil dedi → atla
          console.log(`[Email Sync] AI: Görev değil → ${senderEmail}: ${subject}`);
          results.push({
            sender: senderEmail,
            type: "skipped",
            aiReason: "AI tarafından görev olarak değerlendirilmedi",
          });
          // Mark as read anyway
          await client.messageFlagsAdd([msg.uid], ["\\Seen"], { uid: true });
          continue;
        }

        const senderUser = emailToUser.get(senderEmail);
        const taskTitle = aiResult.title || subject;
        const taskDescription = aiResult.description || emailBody.slice(0, 500);

        if (senderUser) {
          // A. REGISTERED SENDER → Görev oluştur
          const assigneeId = aiResult.assigneeEmail
            ? emailToUser.get(aiResult.assigneeEmail.toLowerCase())?.id ?? senderUser.id
            : senderUser.id;

          const recordToInsert = {
            title: taskTitle,
            description: taskDescription,
            assigned_to: assigneeId,
            status: "todo" as const,
            created_by: senderUser.id,
            group_id: senderUser.group_id || null,
          };

          const { data: inserted, error: insertError } = await supabase
            .from("tasks")
            .insert([recordToInsert])
            .select("*, assignee:users!tasks_assigned_to_fkey(id, email, full_name, telegram_chat_id)");

          if (insertError) {
            console.error(`[Email Sync] Task insertion error: ${insertError.message}`);
            results.push({ sender: senderEmail, type: "task", error: insertError.message });
          } else {
            processedCount += inserted?.length ?? 0;
            results.push({ sender: senderEmail, type: "task", count: inserted?.length ?? 0 });

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
          // B. UNREGISTERED SENDER → incoming_request olarak kaydet
          let defaultGroupId: string | null = null;
          const smtpUser = process.env.SMTP_USER;
          if (smtpUser) {
            const systemUser = emailToUser.get(smtpUser.toLowerCase());
            if (systemUser && systemUser.group_id) {
              defaultGroupId = systemUser.group_id;
            }
          }
          if (!defaultGroupId) {
            const userWithGroup = typedUsers.find((u) => u.group_id);
            if (userWithGroup && userWithGroup.group_id) {
              defaultGroupId = userWithGroup.group_id;
            }
          }

          const { data: insertedReq, error: reqError } = await supabase
            .from("incoming_requests")
            .insert({
              subject: taskTitle,
              body: taskDescription,
              sender_email: senderEmail,
              status: "pending",
              group_id: defaultGroupId,
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
