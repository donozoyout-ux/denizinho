import nodemailer from "nodemailer";
import { APP_NAME } from "@/lib/config";

export interface TaskNotificationPayload {
  to: string;
  taskTitle: string;
  taskDescription?: string | null;
  dueDate?: string | null;
  assignedBy?: string;
  telegramChatId?: string | null;
}

export async function sendTelegramNotification(payload: {
  telegramChatId: string;
  taskTitle: string;
  taskDescription?: string | null;
  dueDate?: string | null;
  assignedBy?: string;
}): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[Telegram] Bot token not configured.");
    return false;
  }

  const text = `🔔 <b>Yeni Görev Atandı!</b>\n\n` +
               `📋 <b>Görev:</b> ${payload.taskTitle}\n` +
               (payload.taskDescription ? `📝 <b>Açıklama:</b> ${payload.taskDescription}\n` : "") +
               (payload.dueDate ? `📅 <b>Son Tarih:</b> ${payload.dueDate}\n` : "") +
               `✍️ <b>Atayan:</b> ${payload.assignedBy || "Sistem"}\n\n` +
               `<a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/board">Görev Panosuna Git</a>`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: payload.telegramChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("[Telegram] API error:", errData);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Telegram] network error:", err);
    return false;
  }
}

// Ortak E-posta Gönderme Fonksiyonu (Resend, n8n veya Custom API)
export async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; message: string }> {
  // 0. SMTP / Gmail Gönderimi (Eğer SMTP bilgileri girilmişse)
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587"),
        secure: smtpPort === "465", // 465 SSL, 587 TLS
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `${APP_NAME} <${smtpUser}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      return { success: true, message: "E-posta SMTP üzerinden başarıyla gönderildi" };
    } catch (err) {
      console.error("[Email] SMTP gönderim hatası:", err);
    }
  }

  // 1. Resend API Entegrasyonu (Önerilen)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (res.ok) {
        return { success: true, message: "E-posta Resend üzerinden başarıyla gönderildi" };
      } else {
        const err = await res.json();
        console.error("[Email] Resend API hatası:", err);
      }
    } catch (err) {
      console.error("[Email] Resend bağlantı hatası:", err);
    }
  }

  // 2. n8n E-posta Webhook
  const n8nEmailUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
  if (n8nEmailUrl) {
    try {
      const res = await fetch(n8nEmailUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return { success: true, message: "E-posta n8n üzerinden gönderildi" };
      }
    } catch (err) {
      console.error("[Email] n8n webhook hatası:", err);
    }
  }

  // 3. Özel E-posta API (EMAIL_API_URL)
  const emailApiUrl = process.env.EMAIL_API_URL;
  const emailApiKey = process.env.EMAIL_API_KEY;
  if (emailApiUrl) {
    try {
      const response = await fetch(emailApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(emailApiKey ? { Authorization: `Bearer ${emailApiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, message: "E-posta özel API üzerinden gönderildi" };
      }
    } catch (error) {
      console.error("[Email] Özel API hatası:", error);
    }
  }

  // 4. Log / Test Modu (Eğer hiçbir servis kurulu değilse)
  console.log(
    `\n📧 [E-posta Gönderilemedi - Test Modu]\n` +
    `Alıcı: ${payload.to}\n` +
    `Konu: ${payload.subject}\n` +
    `Lütfen .env.local veya Netlify ortam değişkenlerine RESEND_API_KEY ekleyin.\n`
  );

  return {
    success: true,
    message: "Test Modu: E-posta konsola yazdırıldı (.env yapılandırılmamış)",
  };
}

export async function sendTaskAssignmentEmail(
  payload: TaskNotificationPayload
): Promise<{ success: boolean; message: string }> {
  // Telegram bildirimini asenkron gönder
  const telegramChatId = payload.telegramChatId || process.env.TELEGRAM_CHAT_ID;
  if (telegramChatId) {
    sendTelegramNotification({
      telegramChatId,
      taskTitle: payload.taskTitle,
      taskDescription: payload.taskDescription,
      dueDate: payload.dueDate,
      assignedBy: payload.assignedBy,
    }).catch((err) => console.error("[Telegram] async notify error:", err));
  }

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #2e7d32; margin-top: 0;">Yeni Bir Görev Atandı</h2>
      <p>Merhaba,</p>
      <p>Sistemde size yeni bir görev atandı. Detaylar aşağıdadır:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2e7d32; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Görev:</strong> ${payload.taskTitle}</p>
        ${payload.taskDescription ? `<p style="margin: 5px 0;"><strong>Açıklama:</strong> ${payload.taskDescription}</p>` : ""}
        ${payload.dueDate ? `<p style="margin: 5px 0;"><strong>Son Tarih:</strong> ${payload.dueDate}</p>` : ""}
        ${payload.assignedBy ? `<p style="margin: 5px 0;"><strong>Atayan:</strong> ${payload.assignedBy}</p>` : ""}
      </div>
      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" 
           style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
           Görev Panosunu Aç
        </a>
      </p>
    </div>
  `;

  return sendEmail({
    to: payload.to,
    subject: `Yeni Görev Atandı: ${payload.taskTitle}`,
    html,
  });
}

export async function sendInviteEmail(payload: {
  to: string;
  fullName: string;
  invitedBy: string;
  signupUrl: string;
}): Promise<{ success: boolean; message: string }> {
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #f57c00; margin-top: 0;">${APP_NAME} platformuna davet edildiniz</h2>
      <p>Merhaba ${payload.fullName},</p>
      <p><strong>${payload.invitedBy}</strong> sizi ${APP_NAME} sistemine davet etti.</p>
      <p>Hesabınızı oluşturup size atanan görevleri görmek için aşağıdaki butona tıklayabilirsiniz:</p>
      <p style="margin-top: 25px;">
        <a href="${payload.signupUrl}" 
           style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
           Kayıt Ol ve Görevleri Gör
        </a>
      </p>
    </div>
  `;

  return sendEmail({
    to: payload.to,
    subject: `${APP_NAME} — Ekip Daveti`,
    html,
  });
}
