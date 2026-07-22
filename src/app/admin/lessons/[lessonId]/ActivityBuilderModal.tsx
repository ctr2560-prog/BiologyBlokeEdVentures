"use client";
import { useState } from "react";
import { Modal, Button, FormField, inputClass, Badge } from "@/components/ui/primitives";
import { Plus, X, ChevronUp, ChevronDown, PenLine, BookOpen, Search, Pencil } from "lucide-react";
import type { Activity, ActivityBlock, ActivityBlockType, Difficulty } from "@/types";

const BLOCK_TYPES: { type: ActivityBlockType; label: string; description: string }[] = [
  { type: "q_and_a",        label: "Question & Answer", description: "A question students respond to in writing" },
  { type: "writing",        label: "Writing task",       description: "Open-ended prompt with optional word guide" },
  { type: "research",       label: "Research task",      description: "Structured fields - source, evidence, summary" },
  { type: "drawing_canvas", label: "Drawing canvas",     description: "Freehand sketch or annotate an image" },
];

function newBlock(type: ActivityBlockType): ActivityBlock {
  const id = `blk-${Date.now()}`;
  switch (type) {
    case "q_and_a":        return { id, type, question: "", hint: "" };
    case "writing":        return { id, type, prompt: "", wordGuide: undefined };
    case "research":       return { id, type, prompt: "", fields: ["Source", "Evidence", "Summary"] };
    case "drawing_canvas": return { id, type, prompt: "", backgroundImageUrl: "" };
    case "graph":          return { id, type, prompt: "", chartType: "bar", xLabel: "", yLabel: "" };
    case "image":           return { id, type, url: "", caption: "" };
    case "instruction":     return { id, type, content: "" };
    case "multiple_choice": return { id, type, question: "", options: ["", "", "", ""], correctIndex: 0, hint: "" };
    case "fill_blanks":    return { id, type, instructions: "", text: "" };
    case "word_bank":      return { id, type, instructions: "", text: "", words: [] };
    case "label_diagram":  return { id, type, prompt: "", imageUrl: "", labels: ["", "", ""] };
    case "matching":        return { id, type, prompt: "", pairs: [{ left: "", right: "" }, { left: "", right: "" }] };
    case "table":           return { id, type, prompt: "", headers: ["Column 1", "Column 2"], rows: 4 };
    case "sorting":         return { id, type, prompt: "", categories: ["Category A", "Category B"], items: ["", "", ""] };
    case "stem_challenge":  return { id, type, title: "", challenge: "", materials: [], photoPrompt: "Take a photo of your completed work", textPrompt: "Describe what you did and what you found." };
    case "field_journal":   return { id, type, context: "", prompts: { observations: "What did you observe?", noticed: "What did you notice or find interesting?", wondering: "What are you wondering now?" }, includeSketch: true, includeWeather: true };
    case "storyboard":      return { id, type, prompt: "", frameCount: 4, frameLabels: ["Introduction", "Rising action", "Key moment", "Conclusion"] };
    case "concept_map":     return { id, type, prompt: "", starterNodes: [] };
  }
}

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
  const typeInfo = BLOCK_TYPES.find((t) => t.type === block.type)!;

  return (
    <div className="rounded-2xl border border-sand-dark bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Badge tone={
          block.type === "q_and_a" ? "forest" :
          block.type === "writing" ? "mist" :
          block.type === "research" ? "sand" : "gold"
        }>
          {typeInfo.label}
        </Badge>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-charcoal-soft hover:text-forest-700 disabled:opacity-30" aria-label="Move up">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 text-charcoal-soft hover:text-forest-700 disabled:opacity-30" aria-label="Move down">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button onClick={onRemove} className="p-1 text-clay-500 hover:text-clay-700" aria-label="Remove block">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {block.type === "q_and_a" && (
        <>
          <FormField label="Question">
            <input className={inputClass} value={block.question} onChange={(e) => onChange({ ...block, question: e.target.value })} placeholder="e.g. How does the wombat's thick skin help it survive?" />
          </FormField>
          <FormField label="Hint (optional)">
            <input className={inputClass} value={block.hint ?? ""} onChange={(e) => onChange({ ...block, hint: e.target.value })} placeholder="e.g. Think about predators..." />
          </FormField>
        </>
      )}

      {block.type === "writing" && (
        <>
          <FormField label="Writing prompt">
            <textarea className={inputClass} rows={2} value={block.prompt} onChange={(e) => onChange({ ...block, prompt: e.target.value })} placeholder="e.g. In your own words, describe what an adaptation is and give two examples from the videos." />
          </FormField>
          <FormField label="Word guide (optional)">
            <input type="number" className={inputClass} value={block.wordGuide ?? ""} onChange={(e) => onChange({ ...block, wordGuide: e.target.value ? +e.target.value : undefined })} placeholder="e.g. 80" />
          </FormField>
        </>
      )}

      {block.type === "research" && (
        <>
          <FormField label="Research prompt">
            <textarea className={inputClass} rows={2} value={block.prompt} onChange={(e) => onChange({ ...block, prompt: e.target.value })} placeholder="e.g. Choose one Australian animal and research how it has adapted to its environment." />
          </FormField>
          <FormField label="Fields" hint="One per line - students fill in each">
            <textarea
              className={inputClass}
              rows={3}
              value={block.fields.join("\n")}
              onChange={(e) => onChange({ ...block, fields: e.target.value.split("\n").filter(Boolean) })}
            />
          </FormField>
        </>
      )}

      {block.type === "drawing_canvas" && (
        <>
          <FormField label="Drawing prompt">
            <textarea className={inputClass} rows={2} value={block.prompt} onChange={(e) => onChange({ ...block, prompt: e.target.value })} placeholder="e.g. Draw and label a food web from the Australian bush showing at least 5 organisms." />
          </FormField>
          <FormField label="Background image URL (optional)" hint="Leave blank for a plain white canvas">
            <input className={inputClass} value={block.backgroundImageUrl ?? ""} onChange={(e) => onChange({ ...block, backgroundImageUrl: e.target.value })} placeholder="https://…" />
          </FormField>
        </>
      )}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  difficulty: Difficulty;
  existing?: Activity;
  onSaved: (activity: Activity) => void;
}

export function ActivityBuilderModal({ open, onClose, lessonId, difficulty, existing, onSaved }: Props) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [feedbackKeywords, setFeedbackKeywords] = useState((existing?.feedbackKeywords ?? []).join(", "));
  const [blocks, setBlocks] = useState<ActivityBlock[]>(existing?.blocks ?? []);
  const [addingBlock, setAddingBlock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const difficultyLabel = difficulty === "foundation" ? "Foundation" : difficulty === "core" ? "Core" : "Advanced";
  const difficultyTone = difficulty === "foundation" ? "clay" : difficulty === "core" ? "forest" : "mist";

  const addBlock = (type: ActivityBlockType) => {
    setBlocks((prev) => [...prev, newBlock(type)]);
    setAddingBlock(false);
  };

  const updateBlock = (index: number, updated: ActivityBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)));
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("Please enter a title for this activity."); return; }
    if (blocks.length === 0) { setError("Add at least one block."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existing?.id,
          lessonId,
          title: title.trim(),
          difficulty,
          blocks,
          feedbackKeywords: feedbackKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save activity");
      const r = data.activity;
      onSaved({
        id: r.id,
        lessonId: r.lesson_id ?? undefined,
        topicTags: r.topic_tags ?? undefined,
        title: r.title,
        difficulty: r.difficulty,
        blocks: r.blocks ?? [],
        feedbackKeywords: r.feedback_keywords ?? undefined,
        createdAt: r.created_at ?? "",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save activity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${difficultyLabel} activity`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge tone={difficultyTone as "clay" | "forest" | "mist"}>{difficultyLabel}</Badge>
          <p className="text-sm text-charcoal-soft">Served to students who match this level after the lesson</p>
        </div>

        <FormField label="Activity title" required>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              difficulty === "foundation"
                ? "e.g. Describe an adaptation"
                : difficulty === "core"
                ? "e.g. Compare two Australian animals"
                : "e.g. Analyse habitat pressures"
            }
          />
        </FormField>

        <FormField
          label="Key concepts to check for (optional)"
          hint="Comma-separated. Used to draft feedback for teachers - flags which of these words/phrases show up in a student's answers."
        >
          <input
            className={inputClass}
            value={feedbackKeywords}
            onChange={(e) => setFeedbackKeywords(e.target.value)}
            placeholder="e.g. adaptation, camouflage, predator, survival"
          />
        </FormField>

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
          <div className="rounded-2xl border-2 border-dashed border-sand-dark bg-cream/60 p-4 space-y-2">
            <p className="text-sm font-semibold text-forest-900">Choose a block type</p>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map(({ type, label, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="flex flex-col gap-1 rounded-2xl bg-white p-3 text-left ring-1 ring-sand hover:bg-forest-50 hover:ring-forest-300 transition-colors"
                >
                  <span className="text-sm font-semibold text-forest-900">{label}</span>
                  <span className="text-xs text-charcoal-soft">{description}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAddingBlock(false)} className="text-xs text-charcoal-soft hover:text-charcoal">Cancel</button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAddingBlock(true)}>
            <Plus className="h-3.5 w-3.5" /> Add block
          </Button>
        )}

        {error && (
          <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{error}</p>
        )}

        <div className="flex justify-end gap-2 border-t border-sand pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save activity"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
