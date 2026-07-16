"use client";
import { useState } from "react";
import { X, Monitor, Tablet, Smartphone, Eye, Lightbulb, Camera, Leaf, MapPin, Cloud, Pencil, Plus, ChevronRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type {
  ActivityBlock,
  ConceptMapBlock,
  DrawingBlock,
  FieldJournalBlock,
  FillBlanksBlock,
  GraphBlock,
  ImageBlock,
  InstructionBlock,
  LabelDiagramBlock,
  MatchingBlock,
  MultipleChoiceBlock,
  QABlock,
  ResearchBlock,
  SortingBlock,
  StemChallengeBlock,
  StoryboardBlock,
  TableBlock,
  WordBankBlock,
  WritingBlock,
  Difficulty,
} from "@/types";

// ─── Blank parser ─────────────────────────────────────────────────────────────

type TextPart = { kind: "text"; content: string } | { kind: "blank"; index: number };
function parseBlanks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let bi = 0;
  text.split(/\[blank\]/gi).forEach((chunk, i, arr) => {
    if (chunk) parts.push({ kind: "text", content: chunk });
    if (i < arr.length - 1) parts.push({ kind: "blank", index: bi++ });
  });
  return parts;
}

// ─── Shared primitives (design-system tokens only) ───────────────────────────

// Matches the app's inputClass exactly
const inp = "w-full rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal-soft/60 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30";
const ta = inp + " resize-none leading-relaxed";
const lbl = "block text-sm font-semibold text-forest-900 mb-1.5";

// Card — exactly as StatCard in primitives
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

// Question number badge
function QNum({ n }: { n: number }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-700 text-xs font-bold text-cream">
      {n}
    </span>
  );
}

// Question text
function QText({ children }: { children: React.ReactNode }) {
  return <p className="display text-base font-semibold leading-snug text-forest-900">{children}</p>;
}

// Hint reveal
function HintReveal({ hint }: { hint?: string }) {
  const [show, setShow] = useState(false);
  if (!hint) return null;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-gold-300/20 px-3 py-1 text-xs font-semibold text-clay-600 transition hover:bg-gold-300/40"
      >
        <Lightbulb className="h-3.5 w-3.5 text-gold-500" />
        {show ? "Hide hint" : "Need a hint?"}
      </button>
      {show && (
        <div className="rounded-2xl border border-sand bg-cream px-4 py-3 text-sm text-charcoal leading-relaxed">
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Block renderers ─────────────────────────────────────────────────────────

function InstructionPreview({ block }: { block: InstructionBlock }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-forest-100 bg-forest-50 px-5 py-4">
      <span className="mt-0.5 text-lg leading-none">📋</span>
      <p className="text-sm leading-relaxed text-forest-900 whitespace-pre-wrap">
        {block.content || <em className="text-charcoal-soft">Instruction text will appear here…</em>}
      </p>
    </div>
  );
}

function ImagePreview({ block }: { block: ImageBlock }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-soft">
      {block.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.url} alt={block.caption ?? ""} className="w-full object-contain max-h-80 bg-cream" />
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-2 bg-cream-dark text-charcoal-soft">
          <span className="text-3xl">🖼️</span>
          <p className="text-sm">Image will appear here</p>
        </div>
      )}
      {block.caption && (
        <p className="border-t border-sand bg-cream px-4 py-2.5 text-xs italic text-charcoal-soft">{block.caption}</p>
      )}
    </div>
  );
}

function QAPreview({ block, n }: { block: QABlock; n: number }) {
  const [answer, setAnswer] = useState("");
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.question || "Question will appear here…"}</QText>
      </div>
      <HintReveal hint={block.hint} />
      <div className="space-y-1.5">
        <textarea className={ta} rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your answer here…" />
        <p className="text-right text-xs text-charcoal-soft">{wordCount} {wordCount === 1 ? "word" : "words"}</p>
      </div>
    </Card>
  );
}

function MultipleChoicePreview({ block, n }: { block: MultipleChoiceBlock; n: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const letters = "ABCDE";
  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.question || "Question will appear here…"}</QText>
      </div>
      <HintReveal hint={block.hint} />
      <div className="space-y-2">
        {block.options.map((opt, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
                active
                  ? "border-forest-700 bg-forest-700 text-cream"
                  : "border-sand-dark bg-white text-charcoal hover:border-forest-400 hover:bg-forest-50"
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                active ? "bg-white/20 text-cream" : "bg-forest-50 text-forest-700"
              }`}>
                {active ? "✓" : letters[i]}
              </span>
              <span className={!opt ? "opacity-40" : ""}>{opt || `Option ${i + 1}`}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function WritingPreview({ block, n }: { block: WritingBlock; n: number }) {
  const [text, setText] = useState("");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const pct = block.wordGuide ? Math.min(100, Math.round((wordCount / block.wordGuide) * 100)) : null;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Writing prompt will appear here…"}</QText>
      </div>
      <textarea className={ta} rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your response here…" />
      {pct !== null ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-charcoal-soft">
            <span>{wordCount} / {block.wordGuide} words</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal/8">
            <div className="h-full rounded-full bg-forest-600 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-right text-xs text-charcoal-soft">{wordCount} {wordCount === 1 ? "word" : "words"}</p>
      )}
    </Card>
  );
}

function FillBlanksPreview({ block, n }: { block: FillBlanksBlock; n: number }) {
  const parts = parseBlanks(block.text);
  const blankCount = parts.filter((p) => p.kind === "blank").length;
  const [answers, setAnswers] = useState<string[]>(() => Array(blankCount).fill(""));
  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <div className="min-w-0 w-full">
          {block.instructions && <QText>{block.instructions}</QText>}
          <p className="mt-3 text-sm leading-[2.6] text-charcoal">
            {parts.map((part, i) =>
              part.kind === "text" ? (
                <span key={i}>{part.content}</span>
              ) : (
                <input
                  key={i}
                  type="text"
                  value={answers[part.index] ?? ""}
                  onChange={(e) => setAnswers((prev) => prev.map((a, idx) => idx === part.index ? e.target.value : a))}
                  className="mx-1.5 inline-block w-28 rounded-xl border-0 border-b-2 border-sand-dark bg-cream px-2 py-0.5 text-center text-sm font-semibold text-forest-900 outline-none transition-all focus:border-forest-600 focus:bg-white"
                />
              )
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

function WordBankPreview({ block, n }: { block: WordBankBlock; n: number }) {
  const parts = parseBlanks(block.text);
  const blankCount = parts.filter((p) => p.kind === "blank").length;
  const [answers, setAnswers] = useState<string[]>(() => Array(blankCount).fill(""));
  const [used, setUsed] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);

  const pickWord = (word: string) => {
    if (active === null) return;
    const prev = answers[active];
    setAnswers((a) => a.map((v, i) => i === active ? word : v));
    setUsed((u) => { const next = u.filter((w) => w !== word); if (prev) next.push(prev); return [...next, word]; });
    setActive(null);
  };

  const available = block.words.filter((w) => !used.includes(w));

  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <div className="min-w-0 w-full space-y-4">
          {block.instructions && <QText>{block.instructions}</QText>}
          <div className="rounded-2xl border border-sand bg-cream px-4 py-3 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal-soft">Word bank</p>
            <div className="flex flex-wrap gap-2">
              {available.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => pickWord(word)}
                  disabled={active === null}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active !== null
                      ? "bg-forest-700 text-cream shadow-soft cursor-pointer hover:bg-forest-800"
                      : "bg-white text-charcoal-soft ring-1 ring-sand-dark cursor-default"
                  }`}
                >
                  {word}
                </button>
              ))}
              {available.length === 0 && <span className="text-xs text-charcoal-soft">All words placed ✓</span>}
            </div>
          </div>
          <p className="text-sm leading-[2.8] text-charcoal">
            {parts.map((part, i) =>
              part.kind === "text" ? (
                <span key={i}>{part.content}</span>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(active === part.index ? null : part.index)}
                  className={`mx-1.5 inline-block min-w-[5rem] rounded-xl border-b-2 px-2 py-0.5 text-center text-sm font-semibold transition-all ${
                    answers[part.index]
                      ? "border-forest-600 bg-forest-50 text-forest-900"
                      : active === part.index
                      ? "border-gold-500 bg-gold-300/20 text-clay-600"
                      : "border-sand-dark bg-cream text-charcoal-soft"
                  }`}
                >
                  {answers[part.index] || (active === part.index ? "tap word ↑" : "_____")}
                </button>
              )
            )}
          </p>
          {active !== null && <p className="text-xs text-charcoal-soft">Tap a word above to place it in the selected blank</p>}
        </div>
      </div>
    </Card>
  );
}

function LabelDiagramPreview({ block, n }: { block: LabelDiagramBlock; n: number }) {
  const [labels, setLabels] = useState<string[]>(() => Array(block.labels.length).fill(""));
  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Label each part of the diagram below."}</QText>
      </div>
      {block.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.imageUrl} alt="Diagram" className="w-full rounded-2xl object-contain max-h-72 bg-cream" />
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-cream-dark text-charcoal-soft">
          <span className="text-3xl">🔬</span>
          <p className="text-sm">Diagram will appear here</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {block.labels.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-700 text-xs font-bold text-cream">{i + 1}</span>
            <input className={inp} value={labels[i] ?? ""} onChange={(e) => setLabels((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))} placeholder={`Label ${i + 1}`} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function MatchingPreview({ block, n }: { block: MatchingBlock; n: number }) {
  const [matches, setMatches] = useState<Record<number, number | null>>({});
  const shuffled = block.pairs.map((p, i) => ({ text: p.right, oi: i }));

  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Match each item on the left to its pair on the right."}</QText>
      </div>
      <div className="space-y-2.5">
        {block.pairs.map((pair, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="flex-1 rounded-2xl border border-sand bg-cream px-3.5 py-2.5 text-sm text-charcoal">
              {pair.left || <span className="text-charcoal-soft/40">Item {i + 1}</span>}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-charcoal-soft" />
            <select
              className="flex-1 rounded-2xl border border-sand-dark bg-white px-3.5 py-2.5 text-sm text-charcoal outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30"
              value={matches[i] ?? ""}
              onChange={(e) => setMatches((m) => ({ ...m, [i]: e.target.value === "" ? null : +e.target.value }))}
            >
              <option value="">Select…</option>
              {shuffled.map((item) => (
                <option key={item.oi} value={item.oi}>{item.text || `Pair ${item.oi + 1}`}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TablePreview({ block, n }: { block: TableBlock; n: number }) {
  const [cells, setCells] = useState<string[][]>(() =>
    Array.from({ length: block.rows }, () => Array(block.headers.length).fill(""))
  );
  const setCell = (r: number, c: number, val: string) =>
    setCells((prev) => prev.map((row, ri) => ri === r ? row.map((v, ci) => ci === c ? val : v) : row));

  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Complete the table below."}</QText>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-sand shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand bg-forest-800">
              {block.headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-bold tracking-wide text-cream">{h || `Column ${i + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map((row, r) => (
              <tr key={r} className={`border-b border-sand last:border-0 ${r % 2 ? "bg-cream" : "bg-white"}`}>
                {row.map((cell, c) => (
                  <td key={c} className="px-2 py-1.5">
                    <input
                      className="w-full rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm text-charcoal outline-none transition focus:border-forest-400 focus:bg-white"
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      placeholder="…"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function GraphPreview({ block, n }: { block: GraphBlock; n: number }) {
  const [points, setPoints] = useState([{ x: "", y: "" }, { x: "", y: "" }, { x: "", y: "" }]);
  const addPoint = () => setPoints((p) => [...p, { x: "", y: "" }]);
  const setPoint = (i: number, axis: "x" | "y", val: string) =>
    setPoints((prev) => prev.map((p, idx) => idx === i ? { ...p, [axis]: val } : p));
  const filled = points.filter((p) => p.y && !isNaN(+p.y));
  const max = filled.length ? Math.max(...filled.map((p) => +p.y)) : 0;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Plot your data below."}</QText>
      </div>
      <div className="rounded-2xl border border-sand bg-cream px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal-soft">Data entry</p>
          <button type="button" onClick={addPoint} className="flex items-center gap-1 text-xs font-semibold text-forest-700 hover:underline">
            <Plus className="h-3 w-3" /> Add row
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-charcoal-soft">
          <span>{block.xLabel || "X axis"}</span>
          <span>{block.yLabel || "Y axis"}</span>
        </div>
        {points.map((pt, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input className={inp} value={pt.x} onChange={(e) => setPoint(i, "x", e.target.value)} placeholder={block.xLabel || "Label"} />
            <input className={inp} type="number" value={pt.y} onChange={(e) => setPoint(i, "y", e.target.value)} placeholder="0" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-sand bg-white p-4">
        {filled.length > 0 ? (
          <>
            <div className="flex h-36 items-end gap-2 border-b border-l border-sand pb-1 pl-2">
              {filled.map((p, i) => {
                const pct = max > 0 ? (+p.y / max) * 100 : 0;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-forest-700">{p.y}</span>
                    <div className="w-full rounded-t bg-forest-500 transition-all duration-500" style={{ height: `${pct}%`, minHeight: 4 }} />
                    <span className="text-[10px] text-charcoal-soft truncate max-w-full">{p.x || i + 1}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-center text-[10px] text-charcoal-soft">{block.xLabel}</p>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-charcoal-soft">Chart appears as you enter data above</p>
        )}
      </div>
    </Card>
  );
}

function ResearchPreview({ block, n }: { block: ResearchBlock; n: number }) {
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Research prompt…"}</QText>
      </div>
      <div className="space-y-4">
        {block.fields.map((field, i) => (
          <div key={i}>
            <label className={lbl}>{field}</label>
            <textarea className={ta} rows={3} value={values[field] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))} placeholder={`Enter your ${field.toLowerCase()}…`} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function DrawingPreview({ block, n }: { block: DrawingBlock; n: number }) {
  const COLOURS = ["#2c5844", "#a47148", "#5c8aa8", "#d4a373", "#e63946", "#000000"];
  const [pen, setPen] = useState(COLOURS[0]);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Drawing prompt…"}</QText>
      </div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-sand-dark bg-white" style={{ minHeight: 240 }}>
        {block.backgroundImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.backgroundImageUrl} alt="Background" className="absolute inset-0 h-full w-full object-contain opacity-50" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-charcoal-soft/40">
          <Pencil className="h-10 w-10" />
          <p className="text-sm font-medium">Drawing canvas</p>
          <p className="text-xs">Students sketch here</p>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-2xl border border-sand bg-white/90 p-2 shadow-soft backdrop-blur-sm">
          {COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setPen(c)}
              className="rounded-full transition-transform hover:scale-110"
              style={{ width: 20, height: 20, background: c, border: pen === c ? "3px solid #4f9776" : "2px solid rgba(0,0,0,0.15)", outline: pen === c ? "2px solid white" : "none", outlineOffset: -4 }}
            />
          ))}
        </div>
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {["Eraser", "Clear"].map((label) => (
            <button key={label} type="button" className="rounded-xl border border-sand bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-charcoal-soft shadow-soft backdrop-blur-sm">{label}</button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function SortingPreview({ block, n }: { block: SortingBlock; n: number }) {
  const [unsorted, setUnsorted] = useState<string[]>(() => block.items.filter(Boolean));
  const [sorted, setSorted] = useState<Record<string, string[]>>(() => Object.fromEntries(block.categories.map((c) => [c, []])));
  const [picked, setPicked] = useState<string | null>(null);

  const dropTo = (cat: string) => {
    if (!picked) return;
    setUnsorted((u) => u.filter((i) => i !== picked));
    setSorted((s) => { const next = { ...s }; Object.keys(next).forEach((k) => { next[k] = next[k].filter((i) => i !== picked); }); next[cat] = [...next[cat], picked]; return next; });
    setPicked(null);
  };
  const returnItem = (item: string) => {
    setSorted((s) => { const next = { ...s }; Object.keys(next).forEach((k) => { next[k] = next[k].filter((i) => i !== item); }); return next; });
    setUnsorted((u) => [...u, item]);
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Sort the items into the correct categories."}</QText>
      </div>
      {unsorted.length > 0 && (
        <div className="rounded-2xl border border-sand bg-cream px-4 py-3 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal-soft">
            {picked ? "Now tap a category below →" : "Tap an item to pick it up"}
          </p>
          <div className="flex flex-wrap gap-2">
            {unsorted.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPicked(picked === item ? null : item)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  picked === item
                    ? "bg-forest-700 text-cream shadow-soft"
                    : "bg-white text-charcoal ring-1 ring-sand-dark hover:ring-forest-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(block.categories.length, 3)}, 1fr)` }}>
        {block.categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => dropTo(cat)}
            className={`rounded-2xl border-2 p-3 text-left transition-all ${
              picked ? "border-forest-400 bg-forest-50" : "border-dashed border-sand-dark bg-cream"
            }`}
          >
            <p className="mb-2 text-xs font-bold text-forest-800">{cat}</p>
            <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
              {(sorted[cat] ?? []).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); returnItem(item); }}
                  className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-800 hover:bg-clay-400/20 hover:text-clay-600 transition"
                >
                  {item} ×
                </button>
              ))}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function StemChallengePreview({ block, n }: { block: StemChallengeBlock; n: number }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gold-300 bg-gold-300/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold-400/40 text-xl">🔬</div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-clay-500 mb-0.5">STEM Challenge</p>
            <h3 className="display text-lg font-bold text-charcoal">{block.title || "STEM Challenge"}</h3>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-charcoal">{block.challenge || "Challenge description will appear here."}</p>
        {(block.materials ?? []).filter(Boolean).length > 0 && (
          <div className="rounded-2xl bg-white/60 px-4 py-3 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-clay-600">You will need:</p>
            {(block.materials ?? []).filter(Boolean).map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-charcoal">
                <span className="h-1.5 w-1.5 rounded-full bg-clay-400" />
                {m}
              </div>
            ))}
          </div>
        )}
      </div>
      <Card>
        <div className="flex items-start gap-3">
          <QNum n={n} />
          <div className="min-w-0 w-full space-y-5">
            <div className="space-y-2">
              <label className={lbl}>{block.photoPrompt || "Photo of your work"}</label>
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sand-dark bg-cream py-10 text-center cursor-pointer transition hover:border-forest-400 hover:bg-forest-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-600">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">Tap to add a photo</p>
                  <p className="text-xs text-charcoal-soft">Take a photo or upload from your device</p>
                </div>
              </div>
            </div>
            <div>
              <label className={lbl}>{block.textPrompt || "Describe what you did"}</label>
              <textarea className={ta} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your response here…" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FieldJournalPreview({ block, n }: { block: FieldJournalBlock; n: number }) {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState("");
  const [obs, setObs] = useState("");
  const [noticed, setNoticed] = useState("");
  const [wondering, setWondering] = useState("");
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-forest-800 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-forest-400" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-forest-400">Field Journal</p>
        </div>
        <p className="text-base font-semibold text-cream leading-snug">
          {block.context || "Head outside and observe the natural world around you."}
        </p>
      </div>
      <Card>
        <div className="flex items-start gap-3">
          <QNum n={n} />
          <div className="min-w-0 w-full space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>📅 Date & time</label>
                <input className={inp} type="datetime-local" />
              </div>
              <div>
                <label className={lbl}><MapPin className="inline h-3.5 w-3.5 mr-1" />Location</label>
                <input className={inp} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where are you?" />
              </div>
            </div>
            {block.includeWeather && (
              <div>
                <label className={lbl}><Cloud className="inline h-3.5 w-3.5 mr-1" />Weather</label>
                <input className={inp} value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Sunny, 22°C, light breeze…" />
              </div>
            )}
            {[
              { label: "🔍 " + block.prompts.observations, val: obs, set: setObs, rows: 4, ph: "Describe what you see, hear, smell…" },
              { label: "✨ " + block.prompts.noticed, val: noticed, set: setNoticed, rows: 3, ph: "Something unexpected or interesting…" },
              { label: "❓ " + block.prompts.wondering, val: wondering, set: setWondering, rows: 3, ph: "A question this raises for you…" },
            ].map(({ label, val, set, rows, ph }) => (
              <div key={label}>
                <label className={lbl}>{label}</label>
                <textarea className={ta} rows={rows} value={val} onChange={(e) => set(e.target.value)} placeholder={ph} />
              </div>
            ))}
            {block.includeSketch && (
              <div>
                <label className={lbl}>✏️ Sketch</label>
                <div className="relative h-44 overflow-hidden rounded-2xl border-2 border-dashed border-sand-dark bg-white">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-charcoal-soft/40">
                    <Pencil className="h-8 w-8" />
                    <p className="text-sm">Drawing canvas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function StoryboardPreview({ block, n }: { block: StoryboardBlock; n: number }) {
  const [frames, setFrames] = useState(() =>
    Array.from({ length: block.frameCount }, () => ({ onScreen: "", narration: "" }))
  );
  const setFrame = (i: number, field: keyof typeof frames[0], val: string) =>
    setFrames((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));

  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Create your storyboard below."}</QText>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(block.frameCount, 2)}, 1fr)` }}>
        {frames.map((frame, i) => (
          <div key={i} className="rounded-2xl border border-mist-100 bg-mist-100/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mist-500 text-[10px] font-bold text-white">{i + 1}</span>
              <p className="text-xs font-bold text-mist-600">{block.frameLabels[i] ?? `Frame ${i + 1}`}</p>
            </div>
            <div className="aspect-video rounded-xl border-2 border-dashed border-mist-400/50 bg-white flex items-center justify-center text-xs text-charcoal-soft/40">
              Sketch scene
            </div>
            {[
              { label: "On screen", key: "onScreen" as const, ph: "What the viewer sees…" },
              { label: "Narration", key: "narration" as const, ph: "What is said or heard…" },
            ].map(({ label, key, ph }) => (
              <div key={key}>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-mist-600">{label}</p>
                <textarea
                  className="w-full resize-none rounded-xl border border-mist-100 bg-white px-3 py-2 text-sm text-charcoal outline-none transition focus:border-mist-500 focus:ring-2 focus:ring-mist-500/20"
                  rows={2}
                  value={frame[key]}
                  onChange={(e) => setFrame(i, key, e.target.value)}
                  placeholder={ph}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ConceptMapPreview({ block, n }: { block: ConceptMapBlock; n: number }) {
  const positions = [
    { top: "22%", left: "18%" }, { top: "15%", left: "62%" },
    { top: "55%", left: "36%" }, { top: "60%", left: "70%" },
    { top: "34%", left: "82%" }, { top: "76%", left: "14%" },
    { top: "12%", left: "40%" }, { top: "72%", left: "52%" },
  ];
  const nodes = block.starterNodes.filter(Boolean);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <QNum n={n} />
        <QText>{block.prompt || "Build your concept map below."}</QText>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-sand bg-cream" style={{ minHeight: 260 }}>
        {nodes.map((node, i) => {
          const pos = positions[i % positions.length];
          return (
            <div
              key={i}
              className="absolute rounded-2xl border-2 border-forest-400 bg-white px-3.5 py-2 text-sm font-semibold text-forest-900 shadow-soft"
              style={{ top: pos.top, left: pos.left, transform: "translate(-50%,-50%)", whiteSpace: "nowrap" }}
            >
              {node}
            </div>
          );
        })}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-charcoal-soft/40">
            <span className="text-4xl">🕸️</span>
            <p className="text-sm font-medium">Students build their concept map here</p>
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {["+ Add node", "→ Connect"].map((label) => (
            <div key={label} className="rounded-xl border border-sand bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-soft shadow-soft">{label}</div>
          ))}
        </div>
      </div>
      <p className="text-xs text-charcoal-soft">Students add nodes, type labels, and draw connections between ideas</p>
    </Card>
  );
}

// ─── Block router ─────────────────────────────────────────────────────────────

let _qn = 0;
function BlockPreview({ block }: { block: ActivityBlock }) {
  const n = ++_qn;
  switch (block.type) {
    case "instruction":     return <InstructionPreview block={block} />;
    case "image":           return <ImagePreview block={block} />;
    case "q_and_a":         return <QAPreview block={block} n={n} />;
    case "multiple_choice": return <MultipleChoicePreview block={block} n={n} />;
    case "writing":         return <WritingPreview block={block} n={n} />;
    case "fill_blanks":     return <FillBlanksPreview block={block} n={n} />;
    case "word_bank":       return <WordBankPreview block={block} n={n} />;
    case "label_diagram":   return <LabelDiagramPreview block={block} n={n} />;
    case "matching":        return <MatchingPreview block={block} n={n} />;
    case "table":           return <TablePreview block={block} n={n} />;
    case "graph":           return <GraphPreview block={block} n={n} />;
    case "research":        return <ResearchPreview block={block} n={n} />;
    case "drawing_canvas":  return <DrawingPreview block={block} n={n} />;
    case "sorting":         return <SortingPreview block={block} n={n} />;
    case "stem_challenge":  return <StemChallengePreview block={block} n={n} />;
    case "field_journal":   return <FieldJournalPreview block={block} n={n} />;
    case "storyboard":      return <StoryboardPreview block={block} n={n} />;
    case "concept_map":     return <ConceptMapPreview block={block} n={n} />;
    default:                return null;
  }
}

// ─── Difficulty config ────────────────────────────────────────────────────────

type Device = "mobile" | "tablet" | "desktop";

const DIFF_HEADER: Record<Difficulty, { badge: string; bg: string }> = {
  foundation: { bg: "bg-forest-800", badge: "bg-forest-100/20 text-cream" },
  core:       { bg: "bg-forest-800", badge: "bg-forest-100/20 text-cream" },
  advanced:   { bg: "bg-forest-800", badge: "bg-forest-100/20 text-cream" },
};

// ─── Activity page ────────────────────────────────────────────────────────────

function ActivityView({ title, difficulty, blocks }: { title: string; difficulty: Difficulty; blocks: ActivityBlock[] }) {
  _qn = 0;
  const d = DIFF_HEADER[difficulty];
  const taskCount = blocks.filter((b) => !["instruction", "image"].includes(b.type)).length;

  return (
    <div className="min-h-full bg-cream">
      {/* Header */}
      <div className={`${d.bg} px-5 pb-8 pt-6`}>
        <div className="mb-4 flex items-center justify-between">
          <Logo size={36} variant="white" withWordmark />
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${d.badge}`}>
            {difficulty}
          </span>
        </div>
        <h1 className="display text-[22px] font-bold leading-tight text-cream">
          {title || "Activity title"}
        </h1>
        <p className="mt-1.5 text-sm text-cream/70">
          {taskCount} task{taskCount !== 1 ? "s" : ""} to complete
        </p>
      </div>

      {/* Blocks */}
      <div className="px-4 py-5 space-y-4">
        {blocks.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-sand-dark bg-white p-14 text-center">
            <p className="text-charcoal-soft">No blocks yet — add some in the builder</p>
          </div>
        ) : (
          blocks.map((block) => <BlockPreview key={block.id} block={block} />)
        )}

        {blocks.length > 0 && (
          <button
            type="button"
            className="mt-2 w-full rounded-full bg-forest-700 py-3.5 text-sm font-semibold text-cream shadow-soft transition hover:bg-forest-800"
          >
            Submit activity
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Device frames ────────────────────────────────────────────────────────────

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{ width: 390, borderRadius: 48, background: "#1c1c1e", padding: "14px 8px 24px", boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1.5px #3a3a3c" }}
    >
      <div className="relative mb-2 flex h-8 items-center justify-center">
        <div className="h-6 w-32 rounded-full bg-[#1c1c1e]" style={{ zIndex: 10 }} />
        <div className="absolute h-4 w-24 rounded-full bg-black" style={{ zIndex: 11 }} />
      </div>
      <div className="overflow-hidden rounded-[32px]">
        <div className="overflow-y-auto" style={{ maxHeight: "70vh", background: "var(--color-cream)" }}>
          {children}
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <div className="h-1 w-28 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function TabletFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{ width: "min(720px, 92vw)", borderRadius: 30, background: "#2c2c2e", padding: "18px 14px 20px", boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1.5px #3a3a3c" }}
    >
      <div className="mb-2.5 flex justify-center">
        <div className="h-2 w-2 rounded-full bg-[#48484a]" />
      </div>
      <div className="overflow-hidden rounded-[18px]">
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)", background: "var(--color-cream)" }}>
          {children}
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#48484a]" />
      </div>
    </div>
  );
}

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-t-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#2c2c2e", borderBottom: "1px solid #3a3a3c" }}>
        <div className="flex gap-1.5">
          {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
            <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="flex-1 rounded-lg px-4 py-1.5 text-xs text-[#8e8e93]" style={{ background: "#3a3a3c" }}>
          biologybloke.edu / activity
        </div>
      </div>
      <div className="overflow-hidden rounded-b-2xl" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)", background: "var(--color-cream)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────

export function PreviewModal({
  open,
  onClose,
  title,
  difficulty,
  blocks,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  difficulty: Difficulty;
  blocks: ActivityBlock[];
}) {
  const [device, setDevice] = useState<Device>("mobile");
  if (!open) return null;

  const content = <ActivityView title={title} difficulty={difficulty} blocks={blocks} />;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-forest-950">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 bg-forest-950 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Eye className="h-4 w-4 text-forest-400" />
          <span className="text-sm font-semibold text-cream">Student preview</span>
          {title && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-charcoal-soft">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5">
          {([
            { d: "mobile" as Device,  Icon: Smartphone, label: "Mobile" },
            { d: "tablet" as Device,  Icon: Tablet,     label: "Tablet" },
            { d: "desktop" as Device, Icon: Monitor,    label: "Desktop" },
          ] as const).map(({ d, Icon, label }) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                device === d ? "bg-forest-700 text-cream shadow-soft" : "text-charcoal-soft hover:text-cream"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <button type="button" onClick={onClose} className="rounded-xl p-2 text-charcoal-soft transition hover:bg-white/8 hover:text-cream">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 overflow-y-auto items-start justify-center py-10 px-4 bg-forest-900/50">
        {device === "mobile"  && <PhoneFrame>{content}</PhoneFrame>}
        {device === "tablet"  && <TabletFrame>{content}</TabletFrame>}
        {device === "desktop" && <DesktopFrame>{content}</DesktopFrame>}
      </div>
    </div>
  );
}
