"use client";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { AliasChip } from "@/components/ui/AliasChip";
import { getBlockTags } from "@/lib/activityRouting";
import {
  getActivity,
  getClass,
  getStudentsByClass,
  getResponsesForActivity,
} from "@/lib/supabaseService";
import type {
  Activity,
  ClassGroup,
  User,
  StudentActivityResponse,
  TaggedActivityBlock,
  BlockResponse,
  QABlock,
  WritingBlock,
  ResearchBlock,
  MultipleChoiceBlock,
  FillBlanksBlock,
  LabelDiagramBlock,
  MatchingBlock,
  TableBlock,
  WordBankBlock,
  SortingBlock,
  StemChallengeBlock,
  FieldJournalBlock,
  StoryboardBlock,
  ConceptMapBlock,
  GraphBlock,
} from "@/types";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  q_and_a: "Q&A",
  writing: "Writing",
  research: "Research",
  drawing_canvas: "Drawing",
  graph: "Graph",
  image: "Image",
  instruction: "Instruction",
  multiple_choice: "Multiple Choice",
  fill_blanks: "Fill in the Blanks",
  label_diagram: "Label Diagram",
  matching: "Matching",
  table: "Table",
  word_bank: "Word Bank",
  sorting: "Sorting",
  stem_challenge: "STEM Challenge",
  field_journal: "Field Journal",
  storyboard: "Storyboard",
  concept_map: "Concept Map",
};

function ResponseContent({
  block,
  response,
}: {
  block: TaggedActivityBlock;
  response: BlockResponse | undefined;
}) {
  const empty = <p className="text-sm italic text-charcoal-soft">No response recorded</p>;

  if (!response) return empty;

  switch (block.type) {
    case "instruction":
    case "image":
      return <p className="text-sm text-charcoal-soft">No student response for this block type</p>;

    case "q_and_a": {
      const r = response as Extract<BlockResponse, { type: "q_and_a" }>;
      return (
        <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-charcoal">
          {r.answer || "—"}
        </div>
      );
    }

    case "writing": {
      const r = response as Extract<BlockResponse, { type: "writing" }>;
      return (
        <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-charcoal whitespace-pre-wrap">
          {r.text || "—"}
        </div>
      );
    }

    case "research": {
      const b = block as unknown as ResearchBlock;
      const r = response as Extract<BlockResponse, { type: "research" }>;
      return (
        <div className="space-y-2">
          {b.fields.map((field) => (
            <div key={field}>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">{field}</p>
              <div className="mt-1 rounded-2xl bg-cream px-4 py-3 text-sm text-charcoal">
                {r.fieldValues[field] || "—"}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "drawing_canvas": {
      const r = response as Extract<BlockResponse, { type: "drawing_canvas" }>;
      return r.dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.dataUrl} alt="Student drawing" className="max-h-48 rounded-2xl border border-sand" />
      ) : empty;
    }

    case "graph": {
      const r = response as Extract<BlockResponse, { type: "graph" }>;
      const b = block as unknown as GraphBlock;
      return (
        <div className="space-y-3">
          {r.dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.dataUrl} alt="Student graph" className="w-full rounded-2xl border border-sand" />
          ) : null}
          {r.dataPoints?.length > 0 && (
            <div className="rounded-2xl border border-sand bg-cream overflow-hidden">
              <div className="grid grid-cols-2 gap-0 text-xs font-bold text-charcoal-soft border-b border-sand px-4 py-2">
                <span>{b.xLabel || "X"}</span>
                <span>{b.yLabel || "Y"}</span>
              </div>
              {r.dataPoints.map((pt, i) => (
                <div key={i} className="grid grid-cols-2 gap-0 px-4 py-1.5 text-sm border-b border-sand last:border-0">
                  <span>{pt.x}</span>
                  <span>{pt.y}</span>
                </div>
              ))}
            </div>
          )}
          {!r.dataUrl && !r.dataPoints?.length && empty}
        </div>
      );
    }

    case "multiple_choice": {
      const b = block as unknown as MultipleChoiceBlock;
      const r = response as Extract<BlockResponse, { type: "multiple_choice" }>;
      const selected = Array.isArray(r.selectedIndex) ? r.selectedIndex : [r.selectedIndex];
      return (
        <div className="space-y-2">
          {b.options.map((opt, i) => {
            const isSelected = selected.includes(i);
            const isCorrect = i === b.correctIndex;
            const isWrong = isSelected && !isCorrect;
            return (
              <div
                key={i}
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  isSelected && isCorrect
                    ? "bg-forest-50 font-semibold text-forest-900 ring-2 ring-forest-500"
                    : isWrong
                    ? "bg-clay-50 text-clay-700 ring-2 ring-clay-400"
                    : isCorrect && selected.length > 0
                    ? "bg-forest-50/50 text-forest-700 ring-1 ring-forest-300"
                    : "bg-cream text-charcoal"
                }`}
              >
                {opt}
                {isWrong && <span className="ml-2 text-xs text-clay-500">(selected — incorrect)</span>}
                {isCorrect && !selected.includes(i) && selected.length > 0 && (
                  <span className="ml-2 text-xs text-forest-600">(correct answer)</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case "fill_blanks": {
      const b = block as unknown as FillBlanksBlock;
      const r = response as Extract<BlockResponse, { type: "fill_blanks" }>;
      let idx = 0;
      const parts = b.text.split("[blank]").map((part, i, arr) => {
        if (i === arr.length - 1) return <span key={i}>{part}</span>;
        const answer = r.answers[idx++] ?? "___";
        return (
          <span key={i}>
            {part}
            <span className="mx-1 inline-block rounded-lg bg-forest-100 px-2 py-0.5 font-semibold text-forest-800">
              {answer || "___"}
            </span>
          </span>
        );
      });
      return <p className="text-sm leading-relaxed text-charcoal">{parts}</p>;
    }

    case "word_bank": {
      const b = block as unknown as WordBankBlock;
      const r = response as Extract<BlockResponse, { type: "word_bank" }>;
      let idx = 0;
      const parts = b.text.split("[blank]").map((part, i, arr) => {
        if (i === arr.length - 1) return <span key={i}>{part}</span>;
        const answer = r.answers[idx++] ?? "___";
        return (
          <span key={i}>
            {part}
            <span className="mx-1 inline-block rounded-lg bg-forest-100 px-2 py-0.5 font-semibold text-forest-800">
              {answer || "___"}
            </span>
          </span>
        );
      });
      return <p className="text-sm leading-relaxed text-charcoal">{parts}</p>;
    }

    case "label_diagram": {
      const b = block as unknown as LabelDiagramBlock;
      const r = response as Extract<BlockResponse, { type: "label_diagram" }>;
      return (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.imageUrl} alt="Diagram" className="max-h-48 w-full rounded-2xl object-contain border border-sand" />
          <div className="space-y-1.5">
            {b.labels.map((correct, i) => {
              const student = r.labels[i] ?? "";
              const isRight = student.trim().toLowerCase() === correct.trim().toLowerCase();
              return (
                <div key={i} className="grid grid-cols-2 gap-2 text-sm">
                  <div className={`rounded-xl px-3 py-1.5 ${isRight ? "bg-forest-50 text-forest-800" : "bg-clay-50 text-clay-700"}`}>
                    {student || "—"}
                  </div>
                  <div className="rounded-xl bg-cream px-3 py-1.5 text-charcoal-soft">
                    ✓ {correct}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case "matching": {
      const b = block as unknown as MatchingBlock;
      const r = response as Extract<BlockResponse, { type: "matching" }>;
      return (
        <div className="space-y-1.5">
          {b.pairs.map((pair, i) => {
            const matchedIdx = r.matches[i];
            const matched = matchedIdx !== undefined ? b.pairs[matchedIdx]?.right : undefined;
            const isCorrect = matchedIdx === i;
            return (
              <div key={i} className="grid grid-cols-2 gap-2 text-sm items-center">
                <div className="rounded-xl bg-cream px-3 py-1.5 font-semibold text-forest-900">
                  {pair.left}
                </div>
                <div className={`rounded-xl px-3 py-1.5 ${isCorrect ? "bg-forest-50 text-forest-800" : "bg-clay-50 text-clay-700"}`}>
                  {matched ?? "—"}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case "table": {
      const b = block as unknown as TableBlock;
      const r = response as Extract<BlockResponse, { type: "table" }>;
      return (
        <div className="overflow-auto rounded-2xl border border-sand">
          <table className="w-full text-sm">
            {b.headers.length > 0 && (
              <thead>
                <tr className="bg-forest-700 text-cream">
                  {b.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold">{h || `Col ${i + 1}`}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(r.cells ?? []).map((row, ri) => (
                <tr key={ri} className={ri % 2 ? "bg-cream" : "bg-white"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-charcoal">{cell || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "sorting": {
      const b = block as unknown as SortingBlock;
      const r = response as Extract<BlockResponse, { type: "sorting" }>;
      return (
        <div className="grid grid-cols-2 gap-3">
          {b.categories.map((cat) => (
            <div key={cat} className="rounded-2xl border border-sand bg-cream p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">{cat}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(r.sorted[cat] ?? []).length === 0 ? (
                  <span className="text-xs text-charcoal-soft italic">Empty</span>
                ) : (
                  (r.sorted[cat] ?? []).map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-charcoal ring-1 ring-sand-dark">
                      {item}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "stem_challenge": {
      const b = block as unknown as StemChallengeBlock;
      const r = response as Extract<BlockResponse, { type: "stem_challenge" }>;
      return (
        <div className="space-y-3">
          {r.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.photoUrl} alt="STEM challenge photo" className="max-h-48 rounded-2xl border border-sand object-cover" />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">{b.textPrompt}</p>
            <div className="mt-1 rounded-2xl bg-cream px-4 py-3 text-sm text-charcoal whitespace-pre-wrap">
              {r.text || "—"}
            </div>
          </div>
        </div>
      );
    }

    case "field_journal": {
      const r = response as Extract<BlockResponse, { type: "field_journal" }>;
      const fields = [
        { label: "Location", value: r.location },
        { label: "Weather", value: r.weather },
        { label: "Observations", value: r.observations },
        { label: "I noticed…", value: r.noticed },
        { label: "I'm wondering…", value: r.wondering },
      ];
      return (
        <div className="space-y-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">{label}</p>
              <div className="mt-1 rounded-2xl bg-cream px-4 py-2.5 text-sm text-charcoal">
                {value || "—"}
              </div>
            </div>
          ))}
          {r.sketchDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.sketchDataUrl} alt="Field journal sketch" className="max-h-48 rounded-2xl border border-sand" />
          )}
        </div>
      );
    }

    case "storyboard": {
      const b = block as unknown as StoryboardBlock;
      const r = response as Extract<BlockResponse, { type: "storyboard" }>;
      return (
        <div className="space-y-3">
          {r.frames.map((frame, i) => (
            <div key={i} className="rounded-2xl border border-sand bg-cream p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">
                Frame {i + 1}{b.frameLabels[i] ? ` — ${b.frameLabels[i]}` : ""}
              </p>
              {frame.scene && (
                <p className="mt-1 text-sm text-charcoal"><span className="font-semibold">Scene:</span> {frame.scene}</p>
              )}
              {frame.narration && (
                <p className="mt-1 text-sm text-charcoal"><span className="font-semibold">Narration:</span> {frame.narration}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    case "concept_map": {
      const r = response as Extract<BlockResponse, { type: "concept_map" }>;
      const text = r.nodes?.[0]?.label ?? "";
      return (
        <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-charcoal whitespace-pre-wrap">
          {text || "—"}
        </div>
      );
    }

    default:
      return empty;
  }
}

function BlockResponseCard({
  block,
  response,
}: {
  block: TaggedActivityBlock;
  response: BlockResponse | undefined;
}) {
  const prompt =
    "question" in block
      ? (block as QABlock | MultipleChoiceBlock).question
      : "prompt" in block
      ? (block as WritingBlock).prompt
      : "content" in block
      ? (block as unknown as { content: string }).content
      : "instructions" in block
      ? (block as FillBlanksBlock | WordBankBlock).instructions
      : "challenge" in block
      ? (block as StemChallengeBlock).challenge
      : undefined;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="sand">{BLOCK_TYPE_LABELS[block.type] ?? block.type}</Badge>
        {getBlockTags(block).map((tag) => (
          <span key={tag} className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-700">
            {tag}
          </span>
        ))}
        {block.blockDifficulty && (
          <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-700 capitalize">
            {block.blockDifficulty}
          </span>
        )}
      </div>
      {prompt && (
        <p className="font-semibold text-forest-900">{prompt}</p>
      )}
      <ResponseContent block={block} response={response} />
    </div>
  );
}

export default function ActivityResponsesPage({
  params,
}: {
  params: Promise<{ classId: string; activityId: string }>;
}) {
  const { classId, activityId } = use(params);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [cls, setCls] = useState<ClassGroup | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [responses, setResponses] = useState<StudentActivityResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getActivity(activityId),
      getClass(classId),
      getStudentsByClass(classId),
      getResponsesForActivity(activityId),
    ]).then(([act, clsData, studs, resps]) => {
      setActivity(act);
      setCls(clsData);
      setStudents(studs);
      setResponses(resps);
      if (studs.length > 0) setSelectedStudentId(studs[0].id);
      setLoading(false);
    });
  }, [activityId, classId]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!activity) {
    return <EmptyState title="Activity not found" message="This activity may have been removed." />;
  }

  const responseByStudent = new Map<string, StudentActivityResponse>(
    responses.map((r) => [r.studentId, r])
  );

  const submittedCount = responses.filter((r) => r.submittedAt).length;

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;
  const selectedResponse = selectedStudentId ? responseByStudent.get(selectedStudentId) : undefined;

  const responseMap = new Map<string, BlockResponse>(
    (selectedResponse?.responses ?? []).map((r) => [r.blockId, r])
  );

  function getStatus(studentId: string) {
    const r = responseByStudent.get(studentId);
    if (!r) return "not_started";
    return r.submittedAt ? "submitted" : "in_progress";
  }

  return (
    <div className="space-y-6">
      <Link href={`/teacher/classes/${classId}`} className="text-sm font-semibold text-forest-700 hover:underline">
        ← Back to class
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="display text-xl font-bold text-forest-900">
          {activity.title} — Responses
        </h1>
        <Badge tone="forest">{submittedCount} / {students.length} submitted</Badge>
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-64 shrink-0 rounded-3xl bg-white shadow-soft ring-1 ring-black/5 overflow-hidden">
          {students.length === 0 ? (
            <p className="p-5 text-sm text-charcoal-soft">No students in this class yet.</p>
          ) : (
            students.map((s) => {
              const status = getStatus(s.id);
              const isSelected = s.id === selectedStudentId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left border-b border-sand last:border-0 transition-colors ${
                    isSelected ? "bg-forest-50 border-l-4 border-l-forest-700 pl-3" : "hover:bg-cream"
                  }`}
                >
                  <AliasChip user={s} size={28} />
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      status === "submitted"
                        ? "bg-forest-700 text-cream"
                        : status === "in_progress"
                        ? "bg-gold-400/20 text-gold-700"
                        : "bg-sand text-charcoal-soft"
                    }`}
                  >
                    {status === "submitted" ? "Submitted" : status === "in_progress" ? "In progress" : "Not started"}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {!selectedStudent ? (
            <EmptyState title="Select a student" message="Click a student on the left to view their responses." />
          ) : !selectedResponse ? (
            <div className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-black/5 text-center">
              <p className="text-2xl">📭</p>
              <p className="mt-2 font-semibold text-forest-900">No response yet</p>
              <p className="mt-1 text-sm text-charcoal-soft">
                {selectedStudent.name} hasn&apos;t started this activity yet.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-white px-5 py-4 shadow-soft ring-1 ring-black/5">
                <AliasChip user={selectedStudent} />
                {selectedResponse.submittedAt && (
                  <span className="text-xs text-charcoal-soft">
                    Submitted {new Date(selectedResponse.submittedAt).toLocaleString()}
                  </span>
                )}
                {!selectedResponse.submittedAt && (
                  <Badge tone="gold">In progress</Badge>
                )}
              </div>
              {activity.blocks.map((block) => (
                <BlockResponseCard
                  key={block.id}
                  block={block}
                  response={responseMap.get(block.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
