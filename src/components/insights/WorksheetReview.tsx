/*
 * Teacher-facing, read-only view of what a student did on their adaptive
 * worksheet. Renders each activity's blocks with the student's saved answer.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge, Button } from "@/components/ui/primitives";
import { Sparkles, CheckCircle2, Clock } from "lucide-react";
import { draftFeedback } from "@/lib/feedbackHeuristics";
import { giveActivityFeedback } from "@/lib/supabaseService";
import type { Activity, StudentActivityResponse, BlockResponse, TaggedActivityBlock } from "@/types";

function findResponse(responses: BlockResponse[], blockId: string): BlockResponse | undefined {
  return responses.find((r) => r.blockId === blockId);
}

/** The main prompt/question shown for a block. */
function blockPrompt(block: TaggedActivityBlock): string {
  switch (block.type) {
    case "q_and_a":
    case "multiple_choice":
      return block.question;
    case "writing":
    case "research":
    case "drawing_canvas":
    case "graph":
    case "label_diagram":
    case "matching":
    case "table":
    case "sorting":
    case "concept_map":
    case "storyboard":
      return block.prompt;
    case "fill_blanks":
    case "word_bank":
      return block.instructions;
    case "stem_challenge":
      return block.challenge;
    case "field_journal":
      return block.context ?? "Field journal";
    case "instruction":
      return block.content;
    default:
      return "";
  }
}

/** A readable rendering of the student's answer for a block. */
function AnswerView({ block, response }: { block: TaggedActivityBlock; response?: BlockResponse }) {
  const empty = <span className="text-sm italic text-charcoal-soft/60">No answer</span>;
  if (!response) return empty;

  switch (response.type) {
    case "q_and_a":
      return response.answer ? <p className="text-sm text-charcoal">{response.answer}</p> : empty;
    case "writing":
      return response.text ? <p className="whitespace-pre-wrap text-sm text-charcoal">{response.text}</p> : empty;
    case "multiple_choice": {
      if (block.type !== "multiple_choice") return empty;
      const sel = Array.isArray(response.selectedIndex) ? response.selectedIndex : [response.selectedIndex];
      if (!sel.length) return empty;
      return (
        <div className="flex flex-wrap gap-1.5">
          {sel.map((i) => {
            const correct = i === block.correctIndex;
            return (
              <Badge key={i} tone={correct ? "forest" : "clay"}>
                {block.options[i] ?? `Option ${i + 1}`} {correct ? "✓" : "✗"}
              </Badge>
            );
          })}
        </div>
      );
    }
    case "fill_blanks":
    case "word_bank":
      return response.answers?.some(Boolean) ? (
        <div className="flex flex-wrap gap-1.5">
          {response.answers.map((a, i) => (
            <Badge key={i} tone="sand">{a || "—"}</Badge>
          ))}
        </div>
      ) : empty;
    case "research":
      return Object.keys(response.fieldValues ?? {}).length ? (
        <div className="space-y-1">
          {Object.entries(response.fieldValues).map(([field, val]) => (
            <p key={field} className="text-sm">
              <span className="font-semibold text-forest-800">{field}:</span>{" "}
              <span className="text-charcoal">{val || "—"}</span>
            </p>
          ))}
        </div>
      ) : empty;
    case "field_journal":
      return (
        <div className="space-y-1 text-sm text-charcoal">
          {response.observations && <p><span className="font-semibold text-forest-800">Observed:</span> {response.observations}</p>}
          {response.noticed && <p><span className="font-semibold text-forest-800">Noticed:</span> {response.noticed}</p>}
          {response.wondering && <p><span className="font-semibold text-forest-800">Wondering:</span> {response.wondering}</p>}
          {!response.observations && !response.noticed && !response.wondering && empty}
        </div>
      );
    case "sorting":
      return Object.keys(response.sorted ?? {}).length ? (
        <div className="space-y-1 text-sm">
          {Object.entries(response.sorted).map(([cat, items]) => (
            <p key={cat}><span className="font-semibold text-forest-800">{cat}:</span> {items.join(", ") || "—"}</p>
          ))}
        </div>
      ) : empty;
    case "table":
      return response.cells?.length ? (
        <div className="overflow-x-auto">
          <table className="text-sm">
            <tbody>
              {response.cells.map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} className="border border-sand px-2 py-1 text-charcoal">{c || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : empty;
    case "stem_challenge":
      return (
        <div className="space-y-2">
          {response.text && <p className="text-sm text-charcoal">{response.text}</p>}
          {response.photoUrl && (
            <div className="relative h-32 w-48 overflow-hidden rounded-xl ring-1 ring-sand">
              <Image src={response.photoUrl} alt="Student photo" fill className="object-cover" sizes="200px" />
            </div>
          )}
          {!response.text && !response.photoUrl && empty}
        </div>
      );
    case "drawing_canvas":
      return response.dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={response.dataUrl} alt="Student sketch" className="max-h-40 rounded-xl ring-1 ring-sand" />
      ) : empty;
    case "graph":
      return response.dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={response.dataUrl} alt="Student graph" className="max-h-40 rounded-xl ring-1 ring-sand" />
      ) : empty;
    case "storyboard":
      return response.frames?.length ? (
        <div className="space-y-1 text-sm text-charcoal">
          {response.frames.map((f, i) => (
            <p key={i}><span className="font-semibold text-forest-800">Frame {i + 1}:</span> {f.narration || f.onScreen || f.scene || "—"}</p>
          ))}
        </div>
      ) : empty;
    case "concept_map":
      return response.nodes?.length ? (
        <p className="text-sm text-charcoal">{response.nodes.length} concept{response.nodes.length !== 1 ? "s" : ""} mapped, {response.edges?.length ?? 0} connection{(response.edges?.length ?? 0) !== 1 ? "s" : ""}</p>
      ) : empty;
    case "label_diagram":
    case "matching":
      return <span className="text-sm text-charcoal">Completed</span>;
    default:
      return empty;
  }
}

/** Feedback box for one activity's response - only rendered when editable. */
function FeedbackBox({
  resp,
  activity,
  studentId,
  classId,
  onFeedbackSaved,
}: {
  resp: StudentActivityResponse;
  activity: Activity;
  studentId: string;
  classId: string;
  onFeedbackSaved?: (activityId: string, feedback: string, givenAt: string | null) => void;
}) {
  const [draft, setDraft] = useState(resp.teacherFeedback ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(resp.feedbackGivenAt ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(resp.teacherFeedback ?? "");
    setSavedAt(resp.feedbackGivenAt ?? null);
  }, [resp.teacherFeedback, resp.feedbackGivenAt]);

  const handleSuggest = () => {
    setDraft(draftFeedback(activity.feedbackKeywords ?? [], resp.responses));
  };

  const handleSend = async () => {
    setSaving(true);
    try {
      const text = draft.trim();
      await giveActivityFeedback(activity.id, studentId, classId, text);
      const now = text ? new Date().toISOString() : null;
      setSavedAt(now);
      onFeedbackSaved?.(activity.id, text, now);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="mt-4 space-y-2 border-t border-sand pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">Feedback for this worksheet</p>
        {savedAt && (
          <span className="text-xs text-charcoal-soft">Sent {new Date(savedAt).toLocaleString()}</span>
        )}
      </div>
      <textarea
        className="w-full rounded-2xl border border-sand-dark bg-cream px-4 py-3 text-sm text-charcoal focus:border-forest-500 focus:outline-none"
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write feedback, or generate a starting point below."
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleSuggest}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <Sparkles className="h-4 w-4" aria-hidden /> Suggest feedback
        </button>
        <Button size="sm" onClick={handleSend} disabled={saving}>
          {saving ? "Sending..." : "Send feedback"}
        </Button>
      </div>
    </div>
  );
}

export function WorksheetReview({
  responses,
  activityById,
  studentId,
  classId,
  editable = false,
  onFeedbackSaved,
}: {
  responses: StudentActivityResponse[];
  activityById: Map<string, Activity>;
  studentId?: string;
  classId?: string;
  editable?: boolean;
  onFeedbackSaved?: (activityId: string, feedback: string, givenAt: string | null) => void;
}) {
  if (responses.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-black/5">
        <p className="text-sm text-charcoal-soft">
          This student hasn&apos;t started their adaptive worksheet yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((resp) => {
        const activity = activityById.get(resp.activityId);
        if (!activity) return null;
        // The worksheet is personalised: each student is only shown a filtered
        // subset of an activity's blocks. Show just the blocks this student
        // actually engaged with (those with a saved response), not the whole
        // potential pool.
        const answeredIds = new Set(resp.responses.map((r) => r.blockId));
        const answerableBlocks = activity.blocks.filter(
          (b) => b.type !== "instruction" && b.type !== "image" && answeredIds.has(b.id)
        );
        if (answerableBlocks.length === 0) return null;
        return (
          <div key={resp.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="display flex items-center gap-2 font-bold text-forest-900">
                <Sparkles className="h-4 w-4 text-gold-500" aria-hidden />
                {activity.title}
              </h3>
              {resp.submittedAt ? (
                <Badge tone="forest"><CheckCircle2 className="h-3 w-3" aria-hidden /> Submitted</Badge>
              ) : (
                <Badge tone="gold"><Clock className="h-3 w-3" aria-hidden /> In progress</Badge>
              )}
            </div>
            <div className="mt-3 space-y-3">
              {answerableBlocks.map((block, i) => (
                <div key={block.id} className="rounded-2xl bg-cream/50 p-3">
                  <p className="text-sm font-semibold text-forest-900">
                    <span className="mr-1.5 text-forest-500">{i + 1}.</span>
                    {blockPrompt(block)}
                  </p>
                  <div className="mt-1.5">
                    <AnswerView block={block} response={findResponse(resp.responses, block.id)} />
                  </div>
                </div>
              ))}
            </div>
            {editable && studentId && classId ? (
              <FeedbackBox
                resp={resp}
                activity={activity}
                studentId={studentId}
                classId={classId}
                onFeedbackSaved={onFeedbackSaved}
              />
            ) : (
              resp.teacherFeedback && (
                <div className="mt-4 rounded-2xl bg-forest-50 p-4 ring-1 ring-forest-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-forest-700">Feedback from your teacher</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-charcoal">{resp.teacherFeedback}</p>
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
