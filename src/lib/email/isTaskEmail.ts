// src/lib/email/isTaskEmail.ts
// Detects whether an email (subject + body) is a task request based on keyword heuristics.

export function isTaskEmail(subject: string | null, body: string): boolean {
  const keywords = [
    "görev",
    "task",
    "assign",
    "yap",
    "tamamla",
    "todo",
    // add more language‑specific terms if needed
  ];
  const text = `${subject ?? ""} ${body}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw));
}
