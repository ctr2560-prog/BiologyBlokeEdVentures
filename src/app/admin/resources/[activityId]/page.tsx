"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/ui/primitives";
import { getActivities, upsertActivity } from "@/lib/supabaseService";
import { ArrowLeft, Eye, Loader, Plus } from "lucide-react";
import type { TaggedActivityBlock, ActivityBlockType } from "@/types";
import { BlockEditor, BlockPicker, newBlock } from "./blocks";
import { PreviewModal } from "./preview";

function Count({ n }: { n: number }) {
  return (
    <span className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full text-[10px] font-bold ${n > 0 ? "bg-forest-100 text-forest-700" : "bg-charcoal/8 text-charcoal-soft/40"}`}>
      {n || "·"}
    </span>
  );
}

export default function ActivityBuilderPage() {
  const params = useParams<{ activityId: string }>();
  const router = useRouter();
  const isNew = params.activityId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<TaggedActivityBlock[]>([]);
  const [addingBlock, setAddingBlock] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isNew) return;
    getActivities().then((all) => {
      const found = all.find((a) => a.id === params.activityId);
      if (found) {
        setTitle(found.title);
        setBlocks(found.blocks);
        setSavedId(found.id);
      }
      setLoading(false);
    });
  }, [isNew, params.activityId]);

  const addBlock = (type: ActivityBlockType) => {
    setBlocks((prev) => [...prev, newBlock(type)]);
    setAddingBlock(false);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  };

  const updateBlock = (i: number, updated: TaggedActivityBlock) =>
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
      // Derive topic tags from whatever blocks have been tagged
      const topicTags = [...new Set(blocks.map((b) => b.topicTag).filter(Boolean))] as string[];
      const saved = await upsertActivity({
        id: savedId,
        topicTags,
        title: title.trim(),
        difficulty: "core",
        blocks,
      });
      setSavedId(saved.id);
      if (isNew) {
        window.history.replaceState(null, "", `/admin/resources/${saved.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
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

  // Derive topic tags from blocks for the coverage matrix
  const topicTags = [...new Set(blocks.map((b) => b.topicTag).filter(Boolean))] as string[];

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
            onClick={() => setPreviewing(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-forest-300 bg-white px-4 py-2 text-sm font-semibold text-forest-700 shadow-sm transition hover:bg-forest-50"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : !savedId ? "Create activity" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-black/5">
        <FormField label="Activity title" required>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Australian animal adaptations"
            autoFocus={isNew}
          />
        </FormField>
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

      {/* Coverage summary — appears once blocks have been tagged */}
      {topicTags.length > 0 && blocks.length > 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
          <p className="mb-3 text-sm font-semibold text-forest-900">Coverage — blocks per level × topic</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="pb-2 text-left font-semibold text-charcoal-soft"></th>
                  <th className="pb-2 text-center font-semibold text-charcoal-soft">All topics</th>
                  {topicTags.map((tag) => (
                    <th key={tag} className="pb-2 text-center font-semibold text-charcoal-soft capitalize">{tag}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([undefined, "foundation", "core", "advanced"] as const).map((diff) => {
                  const rowBlocks = blocks.filter((b) => b.blockDifficulty === diff);
                  return (
                    <tr key={diff ?? "all"} className="border-t border-sand">
                      <td className="py-2 pr-4 font-semibold text-charcoal-soft capitalize">{diff ?? "All levels"}</td>
                      <td className="py-2 text-center">
                        <Count n={rowBlocks.filter((b) => !b.topicTag).length} />
                      </td>
                      {topicTags.map((tag) => (
                        <td key={tag} className="py-2 text-center">
                          <Count n={rowBlocks.filter((b) => b.topicTag === tag).length} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      <PreviewModal
        open={previewing}
        onClose={() => setPreviewing(false)}
        title={title}
        difficulty="core"
        blocks={blocks}
      />
    </div>
  );
}
