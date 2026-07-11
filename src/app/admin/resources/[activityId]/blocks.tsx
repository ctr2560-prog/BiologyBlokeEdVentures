"use client";
import { useRef, useState } from "react";
import { FormField, inputClass, Badge } from "@/components/ui/primitives";
import {
  AlignLeft,
  BarChart2,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  Columns,
  Film,
  Grip,
  Image as ImageIcon,
  ListOrdered,
  MapPin,
  Network,
  PenLine,
  Pencil,
  Search,
  Shuffle,
  SplitSquareHorizontal,
  ToggleLeft,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import type {
  ActivityBlock,
  ActivityBlockType,
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
} from "@/types";

// ─── Block catalogue ─────────────────────────────────────────────────────────

export type BlockMeta = {
  type: ActivityBlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

export const BLOCK_CATALOGUE: BlockMeta[] = [
  { type: "instruction",     label: "Instruction",       description: "Read-only text — set context or give directions", icon: <AlignLeft className="h-5 w-5" />,           color: "bg-sand/60 text-charcoal" },
  { type: "image",           label: "Image",             description: "Upload a photo or diagram",                       icon: <ImageIcon className="h-5 w-5" />,           color: "bg-sky-50 text-sky-700" },
  { type: "q_and_a",        label: "Q & A",             description: "Short written answer with optional hint",         icon: <PenLine className="h-5 w-5" />,             color: "bg-forest-50 text-forest-700" },
  { type: "multiple_choice", label: "Multiple choice",   description: "2–6 options, mark the correct answer",           icon: <ToggleLeft className="h-5 w-5" />,          color: "bg-indigo-50 text-indigo-700" },
  { type: "writing",         label: "Extended writing",  description: "Open-ended prompt with word guide",              icon: <BookOpen className="h-5 w-5" />,            color: "bg-mist-50 text-mist-700" },
  { type: "fill_blanks",    label: "Fill in the blanks", description: "Passage with [blank] gaps students complete",    icon: <SplitSquareHorizontal className="h-5 w-5" />, color: "bg-amber-50 text-amber-700" },
  { type: "word_bank",      label: "Word bank",          description: "Fill blanks by choosing from a word list",       icon: <ListOrdered className="h-5 w-5" />,         color: "bg-teal-50 text-teal-700" },
  { type: "label_diagram",  label: "Label the diagram",  description: "Image with numbered labels students fill in",    icon: <Grip className="h-5 w-5" />,               color: "bg-rose-50 text-rose-700" },
  { type: "matching",        label: "Matching",           description: "Match terms in two columns",                     icon: <Columns className="h-5 w-5" />,             color: "bg-purple-50 text-purple-700" },
  { type: "table",           label: "Table",              description: "Students fill in a structured grid",             icon: <BarChart2 className="h-5 w-5" />,           color: "bg-emerald-50 text-emerald-700" },
  { type: "graph",           label: "Graph / chart",      description: "Students plot data — bar, line, or scatter",     icon: <BarChart2 className="h-5 w-5" />,           color: "bg-gold-50 text-yellow-700" },
  { type: "research",        label: "Research task",      description: "Structured fields — source, evidence, summary",  icon: <Search className="h-5 w-5" />,             color: "bg-sand text-charcoal-soft" },
  { type: "drawing_canvas",  label: "Drawing canvas",     description: "Freehand sketch or annotate an image",              icon: <Pencil className="h-5 w-5" />,    color: "bg-clay-50 text-clay-700" },
  { type: "sorting",         label: "Sorting",            description: "Sort items into categories or correct order",        icon: <Shuffle className="h-5 w-5" />,   color: "bg-lime-50 text-lime-700" },
  { type: "stem_challenge",  label: "STEM Challenge",     description: "Hands-on challenge — students photo their work",     icon: <Zap className="h-5 w-5" />,       color: "bg-orange-50 text-orange-700" },
  { type: "field_journal",   label: "Field Journal",      description: "Outdoor observation log with sketch canvas",         icon: <MapPin className="h-5 w-5" />,    color: "bg-green-50 text-green-700" },
  { type: "storyboard",      label: "Storyboard",         description: "Plan a wildlife documentary frame by frame",         icon: <Film className="h-5 w-5" />,      color: "bg-violet-50 text-violet-700" },
  { type: "concept_map",     label: "Concept Map",        description: "Connect ideas with nodes and labelled arrows",       icon: <Network className="h-5 w-5" />,   color: "bg-cyan-50 text-cyan-700" },
];

// ─── Block factory ────────────────────────────────────────────────────────────

export function newBlock(type: ActivityBlockType): ActivityBlock {
  const id = `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case "instruction":     return { id, type, content: "" };
    case "image":           return { id, type, url: "", caption: "" };
    case "q_and_a":        return { id, type, question: "", hint: "" };
    case "multiple_choice": return { id, type, question: "", options: ["", "", "", ""], correctIndex: 0, hint: "" };
    case "writing":         return { id, type, prompt: "", wordGuide: undefined };
    case "fill_blanks":    return { id, type, instructions: "", text: "" };
    case "word_bank":      return { id, type, instructions: "", text: "", words: [] };
    case "label_diagram":  return { id, type, prompt: "", imageUrl: "", labels: ["", "", ""] };
    case "matching":        return { id, type, prompt: "", pairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }] };
    case "table":           return { id, type, prompt: "", headers: ["Column 1", "Column 2", "Column 3"], rows: 4 };
    case "graph":           return { id, type, prompt: "", chartType: "bar", xLabel: "", yLabel: "" };
    case "research":        return { id, type, prompt: "", fields: ["Source", "Evidence", "Summary"] };
    case "drawing_canvas":  return { id, type, prompt: "", backgroundImageUrl: "" };
    case "sorting":         return { id, type, prompt: "", categories: ["Category A", "Category B"], items: ["", "", "", ""] };
    case "stem_challenge":  return { id, type, title: "", challenge: "", materials: [], photoPrompt: "Take a photo of your completed work", textPrompt: "Describe what you did and what you found." };
    case "field_journal":   return { id, type, context: "", prompts: { observations: "What did you observe?", noticed: "What did you notice or find interesting?", wondering: "What are you wondering now?" }, includeSketch: true, includeWeather: true };
    case "storyboard":      return { id, type, prompt: "", frameCount: 4, frameLabels: ["Introduction", "Rising action", "Key moment", "Conclusion"] };
    case "concept_map":     return { id, type, prompt: "", starterNodes: [] };
  }
}

// ─── Image upload component ───────────────────────────────────────────────────

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onChange(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <FormField label={label} hint={hint}>
      <div>
        {value ? (
          <div className="relative overflow-hidden rounded-xl border border-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Uploaded" className="max-h-64 w-full object-contain bg-sand/30" />
            <div className="flex items-center gap-2 border-t border-sand bg-white px-3 py-2">
              <span className="flex-1 truncate text-xs text-charcoal-soft">{value.split("/").pop()}</span>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-xs font-medium text-clay-600 hover:underline"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-forest-700 hover:underline"
              >
                Replace
              </button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sand-dark bg-cream/60 px-6 py-8 text-center transition hover:border-forest-400 hover:bg-forest-50"
          >
            {uploading ? (
              <>
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-300 border-t-forest-700" />
                <p className="text-sm text-charcoal-soft">Uploading…</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-forest-400" />
                <div>
                  <p className="text-sm font-semibold text-forest-900">Drop an image here or click to browse</p>
                  <p className="mt-0.5 text-xs text-charcoal-soft">JPEG, PNG, GIF, WebP, SVG — max 10 MB</p>
                </div>
              </>
            )}
          </div>
        )}
        {uploadError && (
          <p className="mt-1.5 text-xs font-medium text-clay-600">{uploadError}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </FormField>
  );
}

// ─── Individual block editors ─────────────────────────────────────────────────

function InstructionEditor({ block, onChange }: { block: InstructionBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <FormField label="Content" hint="Students read this — no response required. Supports plain text." required>
      <textarea
        className={inputClass}
        rows={4}
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="e.g. Before you begin, watch the video about Australian mammals. Pay close attention to how each animal finds food."
      />
    </FormField>
  );
}

function ImageEditor({ block, onChange }: { block: ImageBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <ImageUpload
        label="Photo or diagram"
        value={block.url}
        onChange={(url) => onChange({ ...block, url })}
      />
      <FormField label="Caption (optional)">
        <input
          className={inputClass}
          value={block.caption ?? ""}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="e.g. Figure 1: The bilby's large ears help regulate body temperature in hot desert conditions."
        />
      </FormField>
    </>
  );
}

function QAEditor({ block, onChange }: { block: QABlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <FormField label="Question" required>
        <input
          className={inputClass}
          value={block.question}
          onChange={(e) => onChange({ ...block, question: e.target.value })}
          placeholder="e.g. How does the wombat's thick skin help it survive predators?"
        />
      </FormField>
      <FormField label="Hint (optional)" hint="Shown to students who get stuck">
        <input
          className={inputClass}
          value={block.hint ?? ""}
          onChange={(e) => onChange({ ...block, hint: e.target.value })}
          placeholder="e.g. Think about what a predator might do..."
        />
      </FormField>
    </>
  );
}

function MultipleChoiceEditor({ block, onChange }: { block: MultipleChoiceBlock; onChange: (b: ActivityBlock) => void }) {
  const setOption = (i: number, val: string) => {
    const options = [...block.options];
    options[i] = val;
    onChange({ ...block, options });
  };
  const addOption = () => onChange({ ...block, options: [...block.options, ""] });
  const removeOption = (i: number) => {
    if (block.options.length <= 2) return;
    const options = block.options.filter((_, idx) => idx !== i);
    onChange({ ...block, options, correctIndex: Math.min(block.correctIndex, options.length - 1) });
  };

  return (
    <>
      <FormField label="Question" required>
        <input
          className={inputClass}
          value={block.question}
          onChange={(e) => onChange({ ...block, question: e.target.value })}
          placeholder="e.g. Which of these adaptations helps a thorny devil collect water?"
        />
      </FormField>
      <div>
        <label className="mb-2 block text-sm font-semibold text-forest-900">
          Options <span className="ml-1 text-xs font-normal text-charcoal-soft">— click a radio button to mark the correct answer</span>
        </label>
        <div className="space-y-2">
          {block.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${block.id}`}
                checked={block.correctIndex === i}
                onChange={() => onChange({ ...block, correctIndex: i })}
                className="h-4 w-4 accent-forest-600"
                aria-label={`Mark option ${i + 1} as correct`}
              />
              <input
                className={inputClass + " flex-1"}
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={block.options.length <= 2}
                className="p-1 text-clay-400 hover:text-clay-600 disabled:opacity-25"
                aria-label="Remove option"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {block.options.length < 6 && (
          <button type="button" onClick={addOption} className="mt-2 text-xs font-medium text-forest-700 hover:underline">
            + Add option
          </button>
        )}
      </div>
      <FormField label="Hint (optional)">
        <input
          className={inputClass}
          value={block.hint ?? ""}
          onChange={(e) => onChange({ ...block, hint: e.target.value })}
          placeholder="e.g. Think about the scales on its skin..."
        />
      </FormField>
    </>
  );
}

function WritingEditor({ block, onChange }: { block: WritingBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <FormField label="Writing prompt" required>
        <textarea
          className={inputClass}
          rows={3}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. In your own words, describe what an adaptation is and give two examples from the videos."
        />
      </FormField>
      <FormField label="Word guide (optional)" hint="Target word count shown to students">
        <input
          type="number"
          className={inputClass}
          value={block.wordGuide ?? ""}
          onChange={(e) => onChange({ ...block, wordGuide: e.target.value ? +e.target.value : undefined })}
          placeholder="e.g. 100"
          min={10}
          max={2000}
        />
      </FormField>
    </>
  );
}

function FillBlanksEditor({ block, onChange }: { block: FillBlanksBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <FormField label="Instructions" hint="Shown above the passage">
        <input
          className={inputClass}
          value={block.instructions}
          onChange={(e) => onChange({ ...block, instructions: e.target.value })}
          placeholder="e.g. Fill in the blanks using the correct scientific terms."
        />
      </FormField>
      <FormField
        label="Passage text"
        hint="Type [blank] wherever you want a gap — e.g. 'The platypus is a [blank] mammal.'"
        required
      >
        <textarea
          className={`${inputClass} font-mono text-sm`}
          rows={6}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder={"The [blank] is a marsupial found in Australia. It uses its powerful [blank] to dig burrows and carries its young in a [blank]."}
        />
      </FormField>
      {block.text && (
        <p className="rounded-xl bg-forest-50 px-3 py-2 text-xs text-forest-700">
          {(block.text.match(/\[blank\]/gi) ?? []).length} blank(s) detected
        </p>
      )}
    </>
  );
}

function WordBankEditor({ block, onChange }: { block: WordBankBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <FormField label="Instructions">
        <input
          className={inputClass}
          value={block.instructions}
          onChange={(e) => onChange({ ...block, instructions: e.target.value })}
          placeholder="e.g. Use the word bank below to complete the passage."
        />
      </FormField>
      <FormField
        label="Passage text"
        hint="Use [blank] for each gap"
        required
      >
        <textarea
          className={`${inputClass} font-mono text-sm`}
          rows={5}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder={"Kangaroos are [blank] that live in [blank]. They use their powerful [blank] to hop."}
        />
      </FormField>
      <FormField
        label="Word bank"
        hint="One word per line — include correct answers and some distractors"
        required
      >
        <textarea
          className={inputClass}
          rows={4}
          value={block.words.join("\n")}
          onChange={(e) => onChange({ ...block, words: e.target.value.split("\n").map(w => w.trim()).filter(Boolean) })}
          placeholder={"marsupials\nAustralia\nhind legs\nbirds\nAfrica\nwings"}
        />
      </FormField>
    </>
  );
}

function LabelDiagramEditor({ block, onChange }: { block: LabelDiagramBlock; onChange: (b: ActivityBlock) => void }) {
  const setLabel = (i: number, val: string) => {
    const labels = [...block.labels];
    labels[i] = val;
    onChange({ ...block, labels });
  };

  return (
    <>
      <FormField label="Prompt / instruction" required>
        <input
          className={inputClass}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Label the parts of the kangaroo shown in the diagram below."
        />
      </FormField>
      <ImageUpload
        label="Diagram image"
        hint="Upload the diagram — you can annotate it with numbered arrows in image editing software first"
        value={block.imageUrl}
        onChange={(url) => onChange({ ...block, imageUrl: url })}
      />
      <div>
        <label className="mb-2 block text-sm font-semibold text-forest-900">
          Correct labels <span className="text-xs font-normal text-charcoal-soft">— numbered 1, 2, 3… matching arrows on the diagram</span>
        </label>
        <div className="space-y-2">
          {block.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-700">
                {i + 1}
              </span>
              <input
                className={inputClass + " flex-1"}
                value={label}
                onChange={(e) => setLabel(i, e.target.value)}
                placeholder={`Label ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => onChange({ ...block, labels: block.labels.filter((_, idx) => idx !== i) })}
                disabled={block.labels.length <= 1}
                className="p-1 text-clay-400 hover:text-clay-600 disabled:opacity-25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {block.labels.length < 12 && (
          <button
            type="button"
            onClick={() => onChange({ ...block, labels: [...block.labels, ""] })}
            className="mt-2 text-xs font-medium text-forest-700 hover:underline"
          >
            + Add label
          </button>
        )}
      </div>
    </>
  );
}

function MatchingEditor({ block, onChange }: { block: MatchingBlock; onChange: (b: ActivityBlock) => void }) {
  const setPair = (i: number, side: "left" | "right", val: string) => {
    const pairs = block.pairs.map((p, idx) => idx === i ? { ...p, [side]: val } : p);
    onChange({ ...block, pairs });
  };
  const addPair = () => onChange({ ...block, pairs: [...block.pairs, { left: "", right: "" }] });
  const removePair = (i: number) => {
    if (block.pairs.length <= 2) return;
    onChange({ ...block, pairs: block.pairs.filter((_, idx) => idx !== i) });
  };

  return (
    <>
      <FormField label="Prompt">
        <input
          className={inputClass}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Match each animal to its correct adaptation."
        />
      </FormField>
      <div>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Left column</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Right column</p>
        </div>
        <div className="space-y-2">
          {block.pairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={inputClass + " flex-1"}
                value={pair.left}
                onChange={(e) => setPair(i, "left", e.target.value)}
                placeholder="Term / organism"
              />
              <span className="shrink-0 text-charcoal-soft">↔</span>
              <input
                className={inputClass + " flex-1"}
                value={pair.right}
                onChange={(e) => setPair(i, "right", e.target.value)}
                placeholder="Definition / feature"
              />
              <button
                type="button"
                onClick={() => removePair(i)}
                disabled={block.pairs.length <= 2}
                className="p-1 text-clay-400 hover:text-clay-600 disabled:opacity-25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {block.pairs.length < 10 && (
          <button type="button" onClick={addPair} className="mt-2 text-xs font-medium text-forest-700 hover:underline">
            + Add pair
          </button>
        )}
      </div>
    </>
  );
}

function TableEditor({ block, onChange }: { block: TableBlock; onChange: (b: ActivityBlock) => void }) {
  const setHeader = (i: number, val: string) => {
    const headers = [...block.headers];
    headers[i] = val;
    onChange({ ...block, headers });
  };
  const addColumn = () => onChange({ ...block, headers: [...block.headers, `Column ${block.headers.length + 1}`] });
  const removeColumn = (i: number) => {
    if (block.headers.length <= 1) return;
    onChange({ ...block, headers: block.headers.filter((_, idx) => idx !== i) });
  };

  return (
    <>
      <FormField label="Prompt / instruction">
        <input
          className={inputClass}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Complete the table comparing the adaptations of each animal."
        />
      </FormField>
      <div>
        <label className="mb-2 block text-sm font-semibold text-forest-900">Column headers</label>
        <div className="flex flex-wrap gap-2">
          {block.headers.map((h, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                className={`${inputClass} w-36`}
                value={h}
                onChange={(e) => setHeader(i, e.target.value)}
                placeholder={`Column ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeColumn(i)}
                disabled={block.headers.length <= 1}
                className="p-1 text-clay-400 hover:text-clay-600 disabled:opacity-25"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {block.headers.length < 8 && (
            <button type="button" onClick={addColumn} className="text-xs font-medium text-forest-700 hover:underline self-center">
              + Column
            </button>
          )}
        </div>
      </div>
      <FormField label="Number of rows students fill in" hint="Not counting the header row">
        <input
          type="number"
          className={inputClass}
          value={block.rows}
          onChange={(e) => onChange({ ...block, rows: Math.max(1, +e.target.value) })}
          min={1}
          max={20}
        />
      </FormField>
      <div className="overflow-x-auto rounded-xl border border-sand">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-sand bg-cream">
              {block.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-forest-900">{h || `Column ${i + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.min(block.rows, 5) }).map((_, r) => (
              <tr key={r} className="border-b border-sand last:border-0">
                {block.headers.map((_, c) => (
                  <td key={c} className="px-3 py-2 text-charcoal-soft/40">student fills in…</td>
                ))}
              </tr>
            ))}
            {block.rows > 5 && (
              <tr>
                <td colSpan={block.headers.length} className="px-3 py-2 text-xs text-charcoal-soft/40 text-center">
                  + {block.rows - 5} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function GraphEditor({ block, onChange }: { block: GraphBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <FormField label="Graph prompt" required>
        <textarea
          className={inputClass}
          rows={3}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Plot the population data in the table above on a bar chart and describe the trend you notice."
        />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Chart type">
          <select
            className={inputClass}
            value={block.chartType}
            onChange={(e) => onChange({ ...block, chartType: e.target.value as GraphBlock["chartType"] })}
          >
            <option value="bar">Bar chart</option>
            <option value="line">Line graph</option>
            <option value="scatter">Scatter plot</option>
          </select>
        </FormField>
        <FormField label="X-axis label">
          <input
            className={inputClass}
            value={block.xLabel}
            onChange={(e) => onChange({ ...block, xLabel: e.target.value })}
            placeholder="e.g. Year"
          />
        </FormField>
        <FormField label="Y-axis label">
          <input
            className={inputClass}
            value={block.yLabel}
            onChange={(e) => onChange({ ...block, yLabel: e.target.value })}
            placeholder="e.g. Population"
          />
        </FormField>
      </div>
    </>
  );
}

function ResearchEditor({ block, onChange }: { block: ResearchBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <FormField label="Research prompt" required>
        <textarea
          className={inputClass}
          rows={3}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Choose one Australian animal and research how it has adapted to its environment."
        />
      </FormField>
      <FormField label="Fields" hint="One per line — students complete each field">
        <textarea
          className={inputClass}
          rows={4}
          value={block.fields.join("\n")}
          onChange={(e) => onChange({ ...block, fields: e.target.value.split("\n").filter(Boolean) })}
          placeholder={"Source\nEvidence\nSummary"}
        />
      </FormField>
    </>
  );
}

function DrawingEditor({ block, onChange }: { block: DrawingBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <FormField label="Drawing prompt" required>
        <textarea
          className={inputClass}
          rows={3}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Draw and label a food web from the Australian bush showing at least 5 organisms."
        />
      </FormField>
      <ImageUpload
        label="Background image (optional)"
        hint="Leave empty for a blank white canvas — or upload an image students will annotate over"
        value={block.backgroundImageUrl ?? ""}
        onChange={(url) => onChange({ ...block, backgroundImageUrl: url })}
      />
    </>
  );
}

function SortingEditor({ block, onChange }: { block: SortingBlock; onChange: (b: ActivityBlock) => void }) {
  const setCategory = (i: number, val: string) => {
    const categories = [...block.categories];
    categories[i] = val;
    onChange({ ...block, categories });
  };
  const setItem = (i: number, val: string) => {
    const items = [...block.items];
    items[i] = val;
    onChange({ ...block, items });
  };

  return (
    <>
      <FormField label="Prompt" required>
        <textarea
          className={inputClass}
          rows={2}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Sort the following animals into the correct groups."
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-forest-900">Categories</label>
          <div className="space-y-2">
            {block.categories.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputClass + " flex-1"}
                  value={cat}
                  onChange={(e) => setCategory(i, e.target.value)}
                  placeholder={`Category ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...block, categories: block.categories.filter((_, idx) => idx !== i) })}
                  disabled={block.categories.length <= 2}
                  className="p-1 text-clay-400 hover:text-clay-600 disabled:opacity-25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {block.categories.length < 6 && (
              <button
                type="button"
                onClick={() => onChange({ ...block, categories: [...block.categories, ""] })}
                className="text-xs font-medium text-forest-700 hover:underline"
              >
                + Add category
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-forest-900">Items to sort</label>
          <div className="space-y-2">
            {block.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputClass + " flex-1"}
                  value={item}
                  onChange={(e) => setItem(i, e.target.value)}
                  placeholder={`Item ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })}
                  disabled={block.items.length <= 1}
                  className="p-1 text-clay-400 hover:text-clay-600 disabled:opacity-25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {block.items.length < 20 && (
              <button
                type="button"
                onClick={() => onChange({ ...block, items: [...block.items, ""] })}
                className="text-xs font-medium text-forest-700 hover:underline"
              >
                + Add item
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── STEM Challenge editor ────────────────────────────────────────────────────

function StemChallengeEditor({ block, onChange }: { block: StemChallengeBlock; onChange: (b: ActivityBlock) => void }) {
  const setMaterial = (i: number, val: string) => {
    const materials = [...(block.materials ?? [])];
    materials[i] = val;
    onChange({ ...block, materials });
  };
  const addMaterial = () => onChange({ ...block, materials: [...(block.materials ?? []), ""] });
  const removeMaterial = (i: number) => onChange({ ...block, materials: (block.materials ?? []).filter((_, idx) => idx !== i) });

  return (
    <>
      <div className="rounded-xl border-2 border-orange-200 bg-orange-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-800">
          <Camera className="h-4 w-4" />
          Students will photograph their completed work and write a response
        </div>
      </div>

      <FormField label="Challenge title" required>
        <input
          className={inputClass}
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="e.g. Design a miniature habitat"
        />
      </FormField>

      <FormField label="Challenge description" hint="What students must do — be specific about the task" required>
        <textarea
          className={inputClass}
          rows={4}
          value={block.challenge}
          onChange={(e) => onChange({ ...block, challenge: e.target.value })}
          placeholder="e.g. Using only natural materials you can find outside (sticks, leaves, bark, rocks), design and build a shelter for a small Australian animal of your choice. Your shelter must protect the animal from rain and at least one predator."
        />
      </FormField>

      <div>
        <label className="mb-2 block text-sm font-semibold text-forest-900">
          Materials list <span className="text-xs font-normal text-charcoal-soft">(optional — what students will need)</span>
        </label>
        <div className="space-y-2">
          {(block.materials ?? []).map((mat, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-charcoal-soft">·</span>
              <input
                className={inputClass + " flex-1"}
                value={mat}
                onChange={(e) => setMaterial(i, e.target.value)}
                placeholder={`e.g. Ruler`}
              />
              <button type="button" onClick={() => removeMaterial(i)} className="p-1 text-clay-400 hover:text-clay-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addMaterial} className="text-xs font-medium text-forest-700 hover:underline">
            + Add material
          </button>
        </div>
      </div>

      <FormField label="Photo prompt" hint="Tell students exactly what to photograph" required>
        <input
          className={inputClass}
          value={block.photoPrompt}
          onChange={(e) => onChange({ ...block, photoPrompt: e.target.value })}
          placeholder="e.g. Take a photo of your completed shelter next to a ruler to show its size"
        />
      </FormField>

      <FormField label="Written response prompt" hint="What students reflect on after completing the challenge" required>
        <textarea
          className={inputClass}
          rows={3}
          value={block.textPrompt}
          onChange={(e) => onChange({ ...block, textPrompt: e.target.value })}
          placeholder="e.g. Which animal did you design for and why? What features of your shelter protect it from the threats you identified?"
        />
      </FormField>
    </>
  );
}

// ─── Field Journal editor ────────────────────────────────────────────────────

function FieldJournalEditor({ block, onChange }: { block: FieldJournalBlock; onChange: (b: ActivityBlock) => void }) {
  return (
    <>
      <div className="rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
          <MapPin className="h-4 w-4" />
          Students take this outside and record real observations
        </div>
      </div>

      <FormField label="Context / scene-setting" hint="Optional — helps orient students before they go outside">
        <textarea
          className={inputClass}
          rows={2}
          value={block.context ?? ""}
          onChange={(e) => onChange({ ...block, context: e.target.value })}
          placeholder="e.g. Head to your school grounds or a nearby green space. You're looking for signs of animal activity — tracks, nests, feeding marks, or the animals themselves."
        />
      </FormField>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-forest-900">Observation prompts <span className="text-xs font-normal text-charcoal-soft">— customise what students are asked to record</span></p>
        <FormField label="What I observed">
          <input
            className={inputClass}
            value={block.prompts.observations}
            onChange={(e) => onChange({ ...block, prompts: { ...block.prompts, observations: e.target.value } })}
            placeholder="What did you observe?"
          />
        </FormField>
        <FormField label="What I noticed">
          <input
            className={inputClass}
            value={block.prompts.noticed}
            onChange={(e) => onChange({ ...block, prompts: { ...block.prompts, noticed: e.target.value } })}
            placeholder="What did you notice or find interesting?"
          />
        </FormField>
        <FormField label="What I'm wondering">
          <input
            className={inputClass}
            value={block.prompts.wondering}
            onChange={(e) => onChange({ ...block, prompts: { ...block.prompts, wondering: e.target.value } })}
            placeholder="What are you wondering now?"
          />
        </FormField>
      </div>

      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={block.includeWeather}
            onChange={(e) => onChange({ ...block, includeWeather: e.target.checked })}
            className="h-4 w-4 accent-forest-600"
          />
          <span className="text-sm text-forest-900">Include weather conditions field</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={block.includeSketch}
            onChange={(e) => onChange({ ...block, includeSketch: e.target.checked })}
            className="h-4 w-4 accent-forest-600"
          />
          <span className="text-sm text-forest-900">Include sketch canvas</span>
        </label>
      </div>
    </>
  );
}

// ─── Storyboard editor ───────────────────────────────────────────────────────

function StoryboardEditor({ block, onChange }: { block: StoryboardBlock; onChange: (b: ActivityBlock) => void }) {
  const setFrameLabel = (i: number, val: string) => {
    const frameLabels = [...block.frameLabels];
    frameLabels[i] = val;
    onChange({ ...block, frameLabels });
  };

  const setFrameCount = (count: number) => {
    const clamped = Math.min(6, Math.max(2, count));
    const frameLabels = Array.from({ length: clamped }, (_, i) => block.frameLabels[i] ?? `Frame ${i + 1}`);
    onChange({ ...block, frameCount: clamped, frameLabels });
  };

  return (
    <>
      <FormField label="Storyboard prompt" hint="What should students create a storyboard about?" required>
        <textarea
          className={inputClass}
          rows={3}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Create a storyboard for a short wildlife documentary about an Australian animal's daily life. Think about how you'd introduce the animal, show a key challenge it faces, and end with a conservation message."
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Number of frames" hint="2–6">
          <input
            type="number"
            className={inputClass}
            value={block.frameCount}
            onChange={(e) => setFrameCount(+e.target.value)}
            min={2}
            max={6}
          />
        </FormField>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-forest-900">
          Frame labels <span className="text-xs font-normal text-charcoal-soft">— guide students on what each frame should show</span>
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: block.frameCount }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-charcoal-soft">Frame {i + 1}</span>
              <input
                className={inputClass}
                value={block.frameLabels[i] ?? ""}
                onChange={(e) => setFrameLabel(i, e.target.value)}
                placeholder={`Frame ${i + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Preview — students fill in each frame</p>
        <div className={`grid gap-3 ${block.frameCount <= 3 ? "grid-cols-" + block.frameCount : "grid-cols-3"}`}>
          {Array.from({ length: block.frameCount }).map((_, i) => (
            <div key={i} className="rounded-xl border-2 border-dashed border-sand-dark bg-white p-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-charcoal-soft">
                {i + 1}. {block.frameLabels[i] || `Frame ${i + 1}`}
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 rounded bg-sand/60 w-3/4" />
                <div className="h-2 rounded bg-sand/60 w-full" />
                <div className="h-2 rounded bg-sand/60 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Concept Map editor ──────────────────────────────────────────────────────

function ConceptMapEditor({ block, onChange }: { block: ConceptMapBlock; onChange: (b: ActivityBlock) => void }) {
  const setNode = (i: number, val: string) => {
    const nodes = [...block.starterNodes];
    nodes[i] = val;
    onChange({ ...block, starterNodes: nodes });
  };

  return (
    <>
      <FormField label="Prompt" hint="What concept or question should the map explore?" required>
        <textarea
          className={inputClass}
          rows={3}
          value={block.prompt}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="e.g. Create a concept map showing how a kangaroo is connected to its ecosystem. Include at least 8 concepts and label every arrow to show the relationship."
        />
      </FormField>

      <div>
        <label className="mb-2 block text-sm font-semibold text-forest-900">
          Starter nodes <span className="text-xs font-normal text-charcoal-soft">— optional concepts pre-placed to help students begin</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {block.starterNodes.map((node, i) => (
            <div key={i} className="flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 pl-3 pr-1 py-1">
              <input
                className="w-24 bg-transparent text-xs font-medium text-cyan-800 outline-none"
                value={node}
                onChange={(e) => setNode(i, e.target.value)}
                placeholder="Concept"
              />
              <button
                type="button"
                onClick={() => onChange({ ...block, starterNodes: block.starterNodes.filter((_, idx) => idx !== i) })}
                className="rounded-full p-0.5 text-cyan-400 hover:text-cyan-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {block.starterNodes.length < 8 && (
            <button
              type="button"
              onClick={() => onChange({ ...block, starterNodes: [...block.starterNodes, ""] })}
              className="rounded-full border border-dashed border-cyan-300 px-3 py-1 text-xs font-medium text-cyan-600 hover:border-cyan-500"
            >
              + Add starter node
            </button>
          )}
        </div>
        {block.starterNodes.length === 0 && (
          <p className="mt-1.5 text-xs text-charcoal-soft">No starter nodes — students build the map from scratch</p>
        )}
      </div>

      <div className="rounded-xl bg-cyan-50 px-4 py-3 text-xs text-cyan-700">
        <strong>Student experience:</strong> an interactive canvas where they add nodes, type labels, and draw arrows between concepts. Starter nodes appear pre-placed.
      </div>
    </>
  );
}

// ─── Block dispatcher ─────────────────────────────────────────────────────────

export function BlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: ActivityBlock;
  onChange: (b: ActivityBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const meta = BLOCK_CATALOGUE.find((c) => c.type === block.type)!;

  return (
    <div className="rounded-2xl border border-sand-dark bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
          {meta.icon}
          {meta.label}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="rounded p-1 text-charcoal-soft hover:text-forest-700 disabled:opacity-25" aria-label="Move up">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="rounded p-1 text-charcoal-soft hover:text-forest-700 disabled:opacity-25" aria-label="Move down">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={onRemove} className="rounded p-1 text-clay-400 hover:text-clay-600" aria-label="Remove block">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      {block.type === "instruction"     && <InstructionEditor     block={block} onChange={onChange} />}
      {block.type === "image"           && <ImageEditor           block={block} onChange={onChange} />}
      {block.type === "q_and_a"        && <QAEditor              block={block} onChange={onChange} />}
      {block.type === "multiple_choice" && <MultipleChoiceEditor  block={block} onChange={onChange} />}
      {block.type === "writing"         && <WritingEditor         block={block} onChange={onChange} />}
      {block.type === "fill_blanks"    && <FillBlanksEditor      block={block} onChange={onChange} />}
      {block.type === "word_bank"      && <WordBankEditor        block={block} onChange={onChange} />}
      {block.type === "label_diagram"  && <LabelDiagramEditor    block={block} onChange={onChange} />}
      {block.type === "matching"        && <MatchingEditor        block={block} onChange={onChange} />}
      {block.type === "table"           && <TableEditor           block={block} onChange={onChange} />}
      {block.type === "graph"           && <GraphEditor           block={block} onChange={onChange} />}
      {block.type === "research"        && <ResearchEditor        block={block} onChange={onChange} />}
      {block.type === "drawing_canvas" && <DrawingEditor         block={block} onChange={onChange} />}
      {block.type === "sorting"         && <SortingEditor         block={block} onChange={onChange} />}
      {block.type === "stem_challenge"  && <StemChallengeEditor  block={block} onChange={onChange} />}
      {block.type === "field_journal"   && <FieldJournalEditor   block={block} onChange={onChange} />}
      {block.type === "storyboard"      && <StoryboardEditor     block={block} onChange={onChange} />}
      {block.type === "concept_map"     && <ConceptMapEditor     block={block} onChange={onChange} />}
    </div>
  );
}

// ─── Block picker ─────────────────────────────────────────────────────────────

export function BlockPicker({ onAdd }: { onAdd: (type: ActivityBlockType) => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-sand-dark bg-cream/60 p-5 space-y-3">
      <p className="text-sm font-semibold text-forest-900">Choose a block type</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {BLOCK_CATALOGUE.map(({ type, label, description, icon, color }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex flex-col gap-2 rounded-2xl bg-white p-3.5 text-left ring-1 ring-sand transition hover:ring-forest-300 hover:shadow-sm"
          >
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
              {icon}
            </span>
            <div>
              <p className="text-xs font-semibold text-forest-900">{label}</p>
              <p className="mt-0.5 text-[0.65rem] leading-tight text-charcoal-soft">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
