"use client";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, Loader } from "lucide-react";
import { getActivity, getClass } from "@/lib/supabaseService";
import { EmptyState } from "@/components/ui/primitives";
import type {
  Activity,
  ClassGroup,
  TaggedActivityBlock,
  QABlock,
  WritingBlock,
  ResearchBlock,
  DrawingBlock,
  GraphBlock,
  ImageBlock,
  InstructionBlock,
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
} from "@/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function RuledLines({ count }: { count: number }) {
  return (
    <div className="mt-2 space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-8 border-b border-gray-300" />
      ))}
    </div>
  );
}

function renderBlankText(text: string) {
  const parts = text.split("[blank]");
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="inline-block w-32 border-b-2 border-gray-500 mx-1" />
          )}
        </span>
      ))}
    </span>
  );
}

function PrintBlock({ block, num }: { block: TaggedActivityBlock; num: number }) {
  switch (block.type) {
    case "instruction": {
      const b = block as InstructionBlock;
      return (
        <div className="border-l-4 border-gray-300 bg-gray-50 pl-3 py-2 italic text-gray-700">
          {b.content}
        </div>
      );
    }
    case "image": {
      const b = block as ImageBlock;
      return (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.url} alt={b.caption ?? ""} className="max-h-48 object-contain" />
          {b.caption && <p className="mt-1 text-xs text-gray-500 italic">{b.caption}</p>}
        </div>
      );
    }
    case "q_and_a": {
      const b = block as QABlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.question}</p>
          {b.hint && <p className="mt-1 text-xs italic text-gray-500">Hint: {b.hint}</p>}
          <RuledLines count={5} />
        </div>
      );
    }
    case "writing": {
      const b = block as WritingBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          {b.wordGuide && <p className="mt-1 text-xs text-gray-500">Aim for about {b.wordGuide} words.</p>}
          <RuledLines count={8} />
        </div>
      );
    }
    case "research": {
      const b = block as ResearchBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          <div className="mt-2 space-y-3">
            {b.fields.map((field) => (
              <div key={field}>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{field}</p>
                <RuledLines count={3} />
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "drawing_canvas": {
      const b = block as DrawingBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          <div className="relative mt-2 h-52 rounded border-2 border-gray-400">
            <span className="absolute left-2 top-1.5 text-xs text-gray-400">Sketch here</span>
            {b.backgroundImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-contain opacity-30" />
            )}
          </div>
        </div>
      );
    }
    case "graph": {
      const b = block as GraphBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          <div className="mt-2 flex gap-2">
            <div className="flex items-center">
              <span
                className="text-[10px] text-gray-500 font-medium"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {b.yLabel}
              </span>
            </div>
            <div className="flex-1">
              <div
                className="h-52 border border-gray-400"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <p className="mt-1 text-center text-[10px] text-gray-500 font-medium">{b.xLabel}</p>
            </div>
          </div>
        </div>
      );
    }
    case "multiple_choice": {
      const b = block as MultipleChoiceBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.question}</p>
          <div className="mt-2 space-y-1.5">
            {b.options.map((opt, i) => (
              <p key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-lg leading-none text-gray-400">◯</span>
                <span><span className="font-medium text-gray-600">{LETTERS[i]}.</span> {opt}</span>
              </p>
            ))}
          </div>
          <p className="mt-2 text-xs italic text-gray-500">{b.allowMultiple ? "(Circle all that apply)" : "(Circle your answer)"}</p>
        </div>
      );
    }
    case "fill_blanks": {
      const b = block as FillBlanksBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.instructions}</p>
          <p className="mt-2 text-sm leading-loose">{renderBlankText(b.text)}</p>
        </div>
      );
    }
    case "word_bank": {
      const b = block as WordBankBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.instructions}</p>
          <div className="mt-2 rounded border border-dashed border-gray-400 px-3 py-2 text-sm text-gray-700">
            <span className="font-semibold text-gray-600">Word bank: </span>
            {b.words.join(" · ")}
          </div>
          <p className="mt-3 text-sm leading-loose">{renderBlankText(b.text)}</p>
        </div>
      );
    }
    case "label_diagram": {
      const b = block as LabelDiagramBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.imageUrl} alt="Diagram to label" className="mt-2 max-h-56 object-contain" />
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
            {b.labels.map((_, i) => (
              <p key={i} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-600">{i + 1}.</span>
                <span className="flex-1 border-b border-gray-400" />
              </p>
            ))}
          </div>
        </div>
      );
    }
    case "matching": {
      const b = block as MatchingBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {b.pairs.map((pair, i) => (
                <p key={i} className="text-sm"><span className="font-semibold text-gray-600">{i + 1}.</span> {pair.left}</p>
              ))}
            </div>
            <div className="space-y-2">
              {b.pairs.map((pair, i) => (
                <p key={i} className="text-sm"><span className="font-semibold text-gray-600">{LETTERS[i]}.</span> {pair.right}</p>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs italic text-gray-500">Write the correct letter next to each number:</p>
          <div className="mt-1 flex flex-wrap gap-4">
            {b.pairs.map((_, i) => (
              <span key={i} className="text-sm"><span className="font-semibold text-gray-700">{i + 1}.</span> ____</span>
            ))}
          </div>
        </div>
      );
    }
    case "table": {
      const b = block as TableBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          <table className="mt-2 w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr>
                {b.headers.map((h) => (
                  <th key={h} className="border border-gray-400 bg-gray-100 px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: b.rows }).map((_, r) => (
                <tr key={r}>
                  {b.headers.map((_, c) => (
                    <td key={c} className="h-10 border border-gray-400 px-2">
                      {b.prefilled?.[r]?.[c] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "sorting": {
      const b = block as SortingBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          <div className="mt-2 rounded border border-dashed border-gray-400 px-3 py-2 text-sm text-gray-700">
            <span className="font-semibold text-gray-600">Items to sort: </span>
            {b.items.join(" · ")}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {b.categories.map((cat) => (
              <div key={cat} className="rounded border border-gray-400 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-600">{cat}</p>
                <RuledLines count={4} />
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "stem_challenge": {
      const b = block as StemChallengeBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.title}</p>
          <p className="mt-1 text-sm text-gray-700">{b.challenge}</p>
          {b.materials && b.materials.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {b.materials.map((m) => (
                <li key={m} className="flex items-start gap-1.5 text-sm text-gray-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                  {m}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-600">Evidence / Photo</p>
          <div className="mt-1 h-40 rounded border-2 border-gray-400" />
          <p className="mt-3 font-semibold text-sm text-gray-900">{b.textPrompt}</p>
          <RuledLines count={5} />
        </div>
      );
    }
    case "field_journal": {
      const b = block as FieldJournalBlock;
      return (
        <div>
          {b.context && <p className="mb-2 italic text-sm text-gray-600">{b.context}</p>}
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>Field Journal</p>
          <div className="mt-2 flex gap-4 text-sm">
            <span>Location: <span className="inline-block w-28 border-b border-gray-400" /></span>
            {b.includeWeather && <span>Weather: <span className="inline-block w-24 border-b border-gray-400" /></span>}
            <span>Date: <span className="inline-block w-20 border-b border-gray-400" /></span>
          </div>
          <div className="mt-3 space-y-3">
            {[
              { label: "Observations", prompt: b.prompts.observations },
              { label: "I noticed…", prompt: b.prompts.noticed },
              { label: "I'm wondering…", prompt: b.prompts.wondering },
            ].map(({ label, prompt }) => (
              <div key={label}>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</p>
                <p className="text-xs italic text-gray-500 mb-1">{prompt}</p>
                <RuledLines count={3} />
              </div>
            ))}
          </div>
          {b.includeSketch && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Sketch</p>
              <div className="h-36 rounded border-2 border-gray-400 relative">
                <span className="absolute left-2 top-1.5 text-xs text-gray-400">Sketch here</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    case "storyboard": {
      const b = block as StoryboardBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {Array.from({ length: b.frameCount }).map((_, i) => (
              <div key={i}>
                <div className="h-36 rounded border-2 border-gray-400" />
                <p className="mt-1 text-xs font-semibold text-center text-gray-600">
                  {b.frameLabels[i] ?? `Frame ${i + 1}`}
                </p>
                <RuledLines count={2} />
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "concept_map": {
      const b = block as ConceptMapBlock;
      return (
        <div>
          <p className="font-semibold text-gray-900"><span className="mr-2.5 inline-grid h-6 w-6 place-items-center rounded-full bg-forest-100 align-[-3px] text-xs font-bold text-forest-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{num}</span>{b.prompt}</p>
          {b.starterNodes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {b.starterNodes.map((node) => (
                <span key={node} className="inline-block rounded-full border border-gray-400 px-3 py-1 text-sm">
                  {node}
                </span>
              ))}
            </div>
          )}
          <div className="relative mt-2 h-64 rounded border-2 border-dashed border-gray-300">
            <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-4">
              Draw connections between the concepts and add your own ideas.
            </span>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

export default function PrintWorksheetPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [activity, setActivity] = useState<Activity | null>(null);
  const [cls, setCls] = useState<ClassGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [act, classData] = await Promise.all([
        getActivity(activityId),
        classId ? getClass(classId) : Promise.resolve(null),
      ]);
      setActivity(act);
      setCls(classData);
      if (act) document.title = `Worksheet: ${act.title}`;
      setLoading(false);
    })();
  }, [activityId, classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!activity) {
    return <EmptyState title="Activity not found" message="This activity may have been deleted." />;
  }

  let qNum = 0;
  const needsNum = (type: string) =>
    !["instruction", "image"].includes(type);

  return (
    <>
      <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .print\\:hidden { display: none !important; } }`}</style>

      {/* Screen-only top bar */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-sand bg-white px-6 py-3 shadow-soft">
        <div className="flex items-center gap-3">
          <Link href="/teacher/resources" className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Resources
          </Link>
          <span className="text-charcoal-soft/40">·</span>
          <span className="text-sm font-semibold text-forest-900">Worksheet: {activity.title}</span>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-forest-700 px-5 py-2 text-sm font-bold text-cream shadow-soft transition hover:bg-forest-800"
        >
          <Printer className="h-4 w-4" aria-hidden /> Print
        </button>
      </div>

      {/* Worksheet — a white sheet, shown on screen and in print */}
      <div className="mx-auto my-8 max-w-3xl overflow-hidden rounded-2xl bg-white shadow-lift print:my-0 print:max-w-none print:rounded-none print:shadow-none">
        {/* Branded header band */}
        <div
          className="flex items-center gap-4 px-6 py-5"
          style={{
            background: "linear-gradient(120deg, #204535 0%, #3d7a5e 95%)",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/edventra-white.png" alt="Edventra" className="h-7 w-auto" />
          <div className="ml-auto text-right">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-forest-100/70">
              Worksheet
            </p>
            <p className="display text-lg font-bold leading-tight text-cream">{activity.title}</p>
          </div>
        </div>

        {/* Meta strip: subject / stage / difficulty + name-class-date */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <MetaChip>{activity.difficulty}</MetaChip>
            {activity.topicTags?.slice(0, 3).map((t) => (
              <MetaChip key={t} muted>{t}</MetaChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700">
            <span className="flex items-baseline">
              Name: <span className="ml-1 inline-block w-44 border-b border-gray-400" />
            </span>
            <span className="flex items-baseline">
              Class: <span className="ml-1 inline-block w-28 border-b border-gray-400 font-medium text-gray-900">{cls?.name ?? ""}</span>
            </span>
            <span className="flex items-baseline">
              Date: <span className="ml-1 inline-block w-24 border-b border-gray-400" />
            </span>
          </div>
        </div>

        {/* Blocks */}
        <div className="space-y-8 px-6 py-8">
          {activity.blocks.map((block) => {
            if (needsNum(block.type)) qNum++;
            const n = needsNum(block.type) ? qNum : 0;
            return (
              <div key={block.id} className="break-inside-avoid">
                <PrintBlock block={block} num={n} />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 text-xs text-gray-400">
          <span className="font-bold tracking-tight text-forest-600">Edventra</span>
          <span>{cls ? `${cls.name} · ` : ""}by The Biology Bloke</span>
        </div>
      </div>
    </>
  );
}

function MetaChip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        muted ? "bg-gray-100 text-gray-600" : "bg-forest-100 text-forest-700"
      }`}
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      {children}
    </span>
  );
}
