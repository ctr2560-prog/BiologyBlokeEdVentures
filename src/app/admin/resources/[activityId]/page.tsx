"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/ui/primitives";
import { getActivities, upsertActivity } from "@/lib/supabaseService";
import { ArrowLeft, Loader, Plus } from "lucide-react";
import type { ActivityBlock, ActivityBlockType, Difficulty } from "@/types";
import { BlockEditor, BlockPicker, newBlock } from "./blocks";

const DIFFICULTIES: { value: Difficulty; label: string; style: string; active: string }[] = [
  { value: "foundation", label: "Foundation", style: "bg-cream text-charcoal-soft ring-1 ring-sand hover:bg-sand", active: "bg-clay-100 text-clay-700 ring-2 ring-clay-300" },
  { value: "core",       label: "Core",       style: "bg-cream text-charcoal-soft ring-1 ring-sand hover:bg-sand", active: "bg-forest-100 text-forest-700 ring-2 ring-forest-400" },
  { value: "advanced",   label: "Advanced",   style: "bg-cream text-charcoal-soft ring-1 ring-sand hover:bg-sand", active: "bg-mist-100 text-mist-700 ring-2 ring-mist-400" },
];

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
    // Scroll to bottom after adding
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
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
      setError(err instanceof Error ? err.message : "Failed to save.");
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
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 flex items-center justify-between gap-4 border-b border-sand bg-cream/95 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => router.push("/admin/resources")}
          className="flex items-center gap-1.5 text-sm font-medium text-charcoal-soft hover:text-forest-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Activity library
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-charcoal-soft sm:block">
            {blocks.length} block{blocks.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : isNew ? "Create activity" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Title + difficulty */}
      <div className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-black/5 space-y-5">
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
              Platform serves this to students whose quiz result matches this level
            </span>
          </label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(({ value, label, style, active }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDifficulty(value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${difficulty === value ? active : style}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blocks */}
      {blocks.length > 0 && (
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
      )}

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
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-dark bg-cream/60 px-5 py-4 text-sm font-semibold text-charcoal-soft transition hover:border-forest-400 hover:text-forest-700"
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
