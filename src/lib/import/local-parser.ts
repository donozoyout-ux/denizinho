import type { N8nExtractedTask } from "@/types/database";

function normalizeTask(item: Record<string, unknown>): N8nExtractedTask | null {
  const title =
    (item.gorev_adi as string) ||
    (item.title as string) ||
    (item.name as string) ||
    (item.gorev as string);

  if (!title?.trim()) return null;

  return {
    gorev_adi: title.trim(),
    aciklama:
      (item.aciklama as string) ||
      (item.description as string) ||
      (item.desc as string) ||
      undefined,
    ilgili_eposta:
      (item.ilgili_eposta as string) ||
      (item.email as string) ||
      (item.assigned_email as string) ||
      undefined,
  };
}

export function unwrapN8nResponse(data: unknown): N8nExtractedTask[] {
  if (Array.isArray(data)) {
    return data
      .map((item) => normalizeTask(item as Record<string, unknown>))
      .filter((t): t is N8nExtractedTask => t !== null);
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const nested = obj.tasks || obj.gorevler || obj.data || obj.results;
    if (Array.isArray(nested)) {
      return unwrapN8nResponse(nested);
    }
  }

  return [];
}

export function parseTasksFromText(text: string): N8nExtractedTask[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return unwrapN8nResponse(JSON.parse(trimmed));
    } catch {
      // fall through to line parsing
    }
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
  const tasks: N8nExtractedTask[] = [];

  for (const line of lines) {
    const cleaned = line.replace(/^[-*•\d.)\s]+/, "").trim();
    if (!cleaned) continue;

    if (cleaned.includes(",") || cleaned.includes(";") || cleaned.includes("\t")) {
      const sep = cleaned.includes("\t") ? "\t" : cleaned.includes(";") ? ";" : ",";
      const parts = cleaned.split(sep).map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts[0]) {
        tasks.push({
          gorev_adi: parts[0],
          aciklama: parts[1] || undefined,
          ilgili_eposta: parts[2]?.includes("@") ? parts[2] : undefined,
        });
      }
      continue;
    }

    if (cleaned.includes("|")) {
      const parts = cleaned.split("|").map((p) => p.trim());
      tasks.push({
        gorev_adi: parts[0],
        aciklama: parts[1] || undefined,
        ilgili_eposta: parts[2]?.includes("@") ? parts[2] : undefined,
      });
      continue;
    }

    tasks.push({ gorev_adi: cleaned });
  }

  return tasks;
}

export async function parseTasksFromFile(
  file: Blob,
  fileName: string
): Promise<N8nExtractedTask[]> {
  const text = await file.text();
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".csv") || lower.endsWith(".txt") || lower.endsWith(".tsv")) {
    return parseTasksFromText(text);
  }

  return parseTasksFromText(text);
}
