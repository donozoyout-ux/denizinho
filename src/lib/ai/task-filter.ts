import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AiTaskResult {
  isTask: boolean;
  title: string | null;
  description: string | null;
  assigneeEmail: string | null;
}

const SYSTEM_PROMPT = `Sen bir görev yönetim sistemi asistanısın. Sana bir e-posta gönderilecek.
Görevin şu:
1. E-postanın bir görev/iş talebi içerip içermediğini belirle.
2. Eğer görev varsa, başlık ve açıklama çıkar.
3. Eğer görev yoksa (reklam, bilgilendirme, spam, otomatik sistem bildirimi vs.), "görev yok" de.

Yanıtını YALNIZCA şu JSON formatında ver (başka bir şey yazma):
{
  "isTask": true/false,
  "title": "Görev başlığı veya null",
  "description": "Görev açıklaması veya null",
  "assigneeEmail": "varsa atanacak kişinin e-postası veya null"
}`;

export async function analyzeEmailWithAI(
  subject: string,
  body: string
): Promise<AiTaskResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // AI yoksa eski keyword-based fallback kullan
    console.warn("[AI] GEMINI_API_KEY yok, fallback keyword filtresine geçiliyor");
    return fallbackKeywordFilter(subject, body);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `${SYSTEM_PROMPT}

E-posta Konusu: ${subject}
E-posta İçeriği:
${body.slice(0, 3000)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON çıkar
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[AI] JSON çıkarılamadı, fallback kullanılıyor:", text);
      return fallbackKeywordFilter(subject, body);
    }

    const parsed = JSON.parse(jsonMatch[0]) as AiTaskResult;
    return {
      isTask: !!parsed.isTask,
      title: parsed.title || null,
      description: parsed.description || null,
      assigneeEmail: parsed.assigneeEmail || null,
    };
  } catch (err) {
    console.error("[AI] Gemini API hatası:", err);
    return fallbackKeywordFilter(subject, body);
  }
}

/** Gemini API yoksa veya hata verirse eski keyword filtresi */
function fallbackKeywordFilter(subject: string, body: string): AiTaskResult {
  const keywords = ["görev", "task", "assign", "yap", "tamamla", "todo", "acil", "talep", "istek"];
  const text = `${subject} ${body}`.toLowerCase();
  const isTask = keywords.some((kw) => text.includes(kw));
  return {
    isTask,
    title: isTask ? subject : null,
    description: isTask ? body.slice(0, 500) : null,
    assigneeEmail: null,
  };
}
