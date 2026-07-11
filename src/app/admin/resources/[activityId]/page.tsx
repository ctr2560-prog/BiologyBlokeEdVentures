"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormField, inputClass, Badge } from "@/components/ui/primitives";
import { getActivities, upsertActivity } from "@/lib/supabaseService";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader,
  PenLine,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import type {
  Activity,
  ActivityBlock,
  ActivityBlockType,
  Difficulty,
  GraphBlock,
  QABlock,
  WritingBlock,
  ResearchBlock,
  DrawingBlock,
} from "@/types";

// ─── Block type catalogue ────────────────────────────────────────────────────

const BLOCK_CATALOGUE: {
  type: ActivityBlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "q_and_a",
    label: "Question & Answer",
    description: "A question students respond to in writing",
    icon: <PenLine className="h-5 w-5" />,
  },
  {
    type: "writing",
    label: "Writing task",
    description: "Open-ended prompt with optional word guide",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    type: "research",
    label: "Research task",
    description: "Structured fields — source, evidence, summary",
    icon: <Search className="h-5 w-5" />,
  },
  {
    type: "drawing_canvas",
    label: "Drawing canvas",
    description: "Freehand sketch or annotate an image",
    icon: <Pencil className="h-5 w-5" />,
  },
  {
    type: "graph",
    label: "Graph / chart",
    description: "Students plot data on a bar, line, or scatter chart",
    icon: <BarChart2 className="h-5 w-5" />,
  },
];

const DIFF_TONE = { foundation: "clay", core: "forest", advanced: "mist" } as const;
const DIFFICULTIES: Difficulty[] = ["foundation", "core", "advanced"];

// ─── Block factory ───────────────────────────────────────────────────────────

function newBlock(type: ActivityBlockType): ActivityBlock {
  const id = `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case "q_and_a":        return { id, type, question: "", hint: "" };
    case "writing":        return { id, type, prompt: "", wordGuide: undefined };
    case "research":       return { id, type, prompt: "", fields: ["Source", "Evidence", "Summary"] };
    case "drawing_canvas": return { id, type, prompt: "", backgroundImageUrl: "" };
    case "graph":          return { id, type, prompt: "", chartType: "bar", xLabel: "", yLabel: "" };
  }
}

// ─── Individual block editors ────────────────────────────────────────────────

function BlockEditor({
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
  const tone =
    block.type === "q_and_a" ? "forest" :
    block.type === "writing" ? "mist" :
    block.type === "research" ? "sand" :
    block.type === "graph" ? "gold" : "clay";

  return (
    <div className="rounded-2xl border border-sand-dark bg-white p-5 space-y-4">
      {/* Block header */}
      <div className="flex items-center gap-2">
        <Badge tone={tone as "forest" | "mist" | "sand" | "gold" | "clay"}>
          {meta.label}
        </Badge>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded p-1 text-charcoal-soft hover:text-forest-700 disabled:opacity-25"
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded p-1 text-charcoal-soft hover:text-forest-700 disabled:opacity-25"
            aria-label="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-clay-400 hover:text-clay-600"
            aria-label="Remove block"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Q&A */}
      {block.type === "q_and_a" && (
        <>
          <FormField label="Question" required>
            <input
              className={inputClass}
              value={(block as QABlock).question}
              onChange={(e) => onChange({ ...block, question: e.target.value } as QABlock)}
              placeholder="e.g. How does the wombat's thick skin help it survive predators?"
            />
          </FormField>
          <FormField label="Hint (optional)" hint="Shown to students who get stuck">
            <input
              className={inputClass}
              value={(block as QABlock).hint ?? ""}
              onChange={(e) => onChange({ ...block, hint: e.target.value } as QABlock)}
              placeholder="e.g. Think about what a predator might do..."
            />
          </FormField>
        </>
      )}

      {/* Writing */}
      {block.type === "writing" && (
        <>
          <FormField label="Writing prompt" required>
            <textarea
              className={inputClass}
              rows={3}
              value={(block as WritingBlock).prompt}
              onChange={(e) => onChange({ ...block, prompt: e.target.value } as WritingBlock)}
              placeholder="e.g. In your own words, describe what an adaptation is and give two examples from the videos."
            />
          </FormField>
          <FormField label="Word guide (optional)" hint="Target word count shown to students">
            <input
              type="number"
              className={inputClass}
              value={(block as WritingBlock).wordGuide ?? ""}
              onChange={(e) =>
                onChange({ ...block, wordGuide: e.target.value ? +e.target.value : undefined } as WritingBlock)
              }
              placeholder="e.g. 100"
              min={10}
              max={2000}
            />
          </FormField>
        </>
      )}

      {/* Research */}
      {block.type === "research" && (
        <>
          <FormField label="Research prompt" required>
            <textarea
              className={inputClass}
              rows={3}
              value={(block as ResearchBlock).prompt}
              onChange={(e) => onChange({ ...block, prompt: e.target.value } as ResearchBlock)}
              placeholder="e.g. Choose one Australian animal and research how it has adapted to its environment."
            />
          </FormField>
          <FormField label="Fields" hint="One per line — students fill in each field">
            <textarea
              className={inputClass}
              rows={4}
              value={(block as ResearchBlock).fields.join("\n")}
              onChange={(e) =>
                onChange({
                  ...block,
                  fields: e.target.value.split("\n").filter(Boolean),
                } as ResearchBlock)
              }
              placeholder={"Source\nEvidence\nSummary"}
            />
          </FormField>
        </>
      )}

      {/* Drawing canvas */}
      {block.type === "drawing_canvas" && (
        <>
          <FormField label="Drawing prompt" required>
            <textarea
              className={inputClass}
              rows={3}
              value={(block as DrawingBlock).prompt}
              onChange={(e) => onChange({ ...block, prompt: e.target.value } as DrawingBlock)}
              placeholder="e.g. Draw and label a food web from the Australian bush showing at least 5 organisms."
            />
          </FormField>
          <FormField
            label="Background image URL (optional)"
            hint="Leave blank for a plain white canvas — or paste an image URL to give students a diagram to annotate"
          >
            <input
              className={inputClass}
              value={(block as DrawingBlock).backgroundImageUrl ?? ""}
              onChange={(e) =>
                onChange({ ...block, backgroundImageUrl: e.target.value } as DrawingBlock)
              }
              placeholder="https://…"
            />
          </FormField>
        </>
      )}

      {/* Graph */}
      {block.type === "graph" && (
        <>
          <FormField label="Graph prompt" required>
            <textarea
              className={inputClass}
              rows={3}
              value={(block as GraphBlock).prompt}
              onChange={(e) => onChange({ ...block, prompt: e.target.value } as GraphBlock)}
              placeholder="e.g. Plot the population data below on a bar chart and describe the trend you notice."
            />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Chart type">
              <select
                className={inputClass}
                value={(block as GraphBlock).chartType}
                onChange={(e) =>
                  onChange({ ...block, chartType: e.target.value } as GraphBlock)
                }
              >
                <option value="bar">Bar chart</option>
                <option value="line">Line graph</option>
                <option value="scatter">Scatter plot</option>
              </select>
            </FormField>
            <FormField label="X-axis label">
              <input
                className={inputClass}
                value={(block as GraphBlock).xLabel}
                onChange={(e) => onChange({ ...block, xLabel: e.target.value } as GraphBlock)}
                placeholder="e.g. Year"
              />
            </FormField>
            <FormField label="Y-axis label">
              <input
                className={inputClass}
                value={(block as GraphBlock).yLabel}
                onChange={(e) => onChange({ ...block, yLabel: e.target.value } as GraphBlock)}
                placeholder="e.g. Population"
              />
            </FormField>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Add-block picker ────────────────────────────────────────────────────────

function BlockPicker({ onAdd }: { onAdd: (type: ActivityBlockType) => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-sand-dark bg-cream/60 p-5 space-y-3">
      <p className="text-sm font-semibold text-forest-900">Choose a block type</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {BLOCK_CATALOGUE.map(({ type, label, description, icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex flex-col items-start gap-2 rounded-2xl bg-white p-4 text-left ring-1 ring-sand transition hover:bg-forest-50 hover:ring-forest-300"
          >
            <span className="text-forest-600">{icon}</span>
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

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ActivityBuilderPage() {
  const params = useParams<{ activityId: string }>();
  const router = useRouter();
  const isNew = params.activityId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("core");
  const [blocks, setBlocks] = useState<ActivityBlock[]>([]);
  const [addingBlock, setAddingBlock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingId, setExistingId] = useState<string | undefined>();

  useEffect(() => {
    if (isNew) return;
    getActivities().then((all) => {
      const found = all.find((a) => a.id === params.activityId);
      if (found) {
        setTitle(found.title);
        setDifficulty(found.difficulty);
        setBlocks(found.blocks);
        setExistingId(found.id);
      }
      setLoading(false);
    });
  }, [isNew, params.activityId]);

  const addBlock = (type: ActivityBlockType) => {
    setBlocks((prev) => [...prev, newBlock(type)]);
    setAddingBlock(false);
  };

  const updateBlock = (i: number, updated: ActivityBlock) =>
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? updated : b)));

  const removeBlock = (i: number) =>
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));

  const moveBlock = (i: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = i + dir;
      if (target < 0 || target >= next.length) return next;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (blocks.length === 0) { setError("Add at least one block."); return; }
    setError("");
    setSaving(true);
    try {
      await upsertActivity({ id: existingId, title: title.trim(), difficulty, blocks });
      router.push("/admin/resources");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/resources")}
            className="flex items-center gap-1.5 text-sm font-medium text-charcoal-soft hover:text-forest-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Activity library
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-forest-700 px-6 py-2.5 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-600 disabled:opacity-60"
        >
          {saving ? "Saving…" : isNew ? "Create activity" : "Save changes"}
        </button>
      </div>

      {/* Title + difficulty */}
      <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-black/5 space-y-4">
        <FormField label="Activity title" required>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Australian animal adaptations — core task"
            autoFocus={isNew}
          />
        </FormField>

        <div>
          <label className="mb-2 block text-sm font-semibold text-forest-900">
            Difficulty tier
            <span className="ml-2 text-xs font-normal text-charcoal-soft">
              Served to students whose quiz result matches this level
            </span>
          </label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  difficulty === d
                    ? d === "foundation"
                      ? "bg-clay-100 text-clay-700 ring-2 ring-clay-300"
                      : d === "core"
                      ? "bg-forest-100 text-forest-700 ring-2 ring-forest-400"
                      : "bg-mist-100 text-mist-700 ring-2 ring-mist-400"
                    : "bg-cream text-charcoal-soft hover:bg-sand ring-1 ring-sand"
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <BlockEditor
            key={block.id}
            block={block}
            onChange={(b) => updateBlock(i, b)}
            onRemove={() => removeBlock(i)}
            onMoveUp={() => moveBlock(i, -1)}
            onMoveDown={() => moveBlock(i, 1)}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
          />
        ))}
      </div>

      {/* Add block */}
      {addingBlock ? (
        <div>
          <BlockPicker onAdd={addBlock} />
          <button
            type="button"
            onClick={() => setAddingBlock(false)}
            className="mt-2 text-xs text-charcoal-soft hover:text-charcoal"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingBlock(true)}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-sand-dark bg-cream/60 px-5 py-3 text-sm font-semibold text-charcoal-soft transition hover:border-forest-400 hover:text-forest-700"
        >
          <Plus className="h-4 w-4" />
          Add block
        </button>
      )}

      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">
          {error}
        </p>
      )}
    </div>
  );
}
