/*
 * Rule-based (no external API) feedback drafting. Looks at the free-text
 * parts of a student's worksheet answers and checks length + whether the
 * activity's admin-defined key concepts show up, then drafts a short comment
 * a teacher can edit before sending. Not real literacy analysis - just a
 * time-saving starting point.
 */
import type { BlockResponse } from "@/types";

function extractResponseText(responses: BlockResponse[]): string {
  const parts: string[] = [];
  for (const r of responses) {
    switch (r.type) {
      case "q_and_a":
        parts.push(r.answer);
        break;
      case "writing":
        parts.push(r.text);
        break;
      case "research":
        parts.push(...Object.values(r.fieldValues));
        break;
      case "stem_challenge":
        parts.push(r.text);
        break;
      case "field_journal":
        parts.push(r.observations, r.noticed, r.wondering);
        break;
      case "storyboard":
        for (const f of r.frames) parts.push(f.onScreen, f.narration);
        break;
      case "table":
        for (const row of r.cells) parts.push(...row);
        break;
      case "fill_blanks":
      case "word_bank":
        parts.push(...r.answers);
        break;
      default:
        break;
    }
  }
  return parts.filter(Boolean).join(" ");
}

export function draftFeedback(keywords: string[], responses: BlockResponse[]): string {
  const text = extractResponseText(responses);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount === 0) {
    return "This worksheet doesn't have any written answers to review yet.";
  }

  const lower = text.toLowerCase();
  const present = keywords.filter((k) => lower.includes(k.toLowerCase()));
  const missing = keywords.filter((k) => !lower.includes(k.toLowerCase()));

  const lines: string[] = [];
  if (present.length > 0) {
    lines.push(`Nice work covering: ${present.join(", ")}.`);
  }
  if (missing.length > 0) {
    lines.push(`Try also mentioning: ${missing.join(", ")}.`);
  }
  if (wordCount < 30) {
    lines.push("Your answers are quite short — try adding another sentence or two to explain your thinking.");
  } else if (wordCount > 150) {
    lines.push("Great detail in your answers!");
  }
  if (lines.length === 0) {
    lines.push("Solid effort on this worksheet — keep it up!");
  }
  return lines.join(" ");
}
