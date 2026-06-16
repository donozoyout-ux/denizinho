import type { N8nExtractedTask } from "@/types/database";
import {
  parseTasksFromFile,
  parseTasksFromText,
  unwrapN8nResponse,
} from "@/lib/import/local-parser";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export interface ImportPayload {
  file?: File;
  text?: string;
}

export async function extractTasksViaN8nServer(
  file: Blob,
  fileName: string,
  text?: string
): Promise<N8nExtractedTask[]> {
  if (!N8N_WEBHOOK_URL) {
    if (text?.trim()) return parseTasksFromText(text);
    return parseTasksFromFile(file, fileName);
  }

  const formData = new FormData();
  formData.append("file", file, fileName);
  if (text) formData.append("text", text);

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`n8n webhook failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const tasks = unwrapN8nResponse(data);

  if (tasks.length === 0) {
    if (text?.trim()) return parseTasksFromText(text);
    return parseTasksFromFile(file, fileName);
  }

  return tasks;
}

export async function extractTasksFromInput(
  file: Blob | null,
  fileName: string,
  text?: string | null
): Promise<{ tasks: N8nExtractedTask[]; source: "n8n" | "local" }> {
  if (N8N_WEBHOOK_URL && (file || text)) {
    try {
      const blob = file ?? new Blob([text ?? ""], { type: "text/plain" });
      const name = fileName || "input.txt";
      const tasks = await extractTasksViaN8nServer(blob, name, text ?? undefined);
      if (tasks.length > 0) return { tasks, source: "n8n" };
    } catch (err) {
      console.warn("[import] n8n failed, using local parser:", err);
    }
  }

  if (text?.trim()) {
    return { tasks: parseTasksFromText(text), source: "local" };
  }

  if (file) {
    return { tasks: await parseTasksFromFile(file, fileName), source: "local" };
  }

  return { tasks: [], source: "local" };
}
