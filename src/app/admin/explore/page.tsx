"use client";
/*
 * Admin builder for the student Explore section: ecosystem tiles students
 * browse at home, plus which one is the "Featured ecosystem" on their home
 * page (one at a time).
 */
import { createElement, useEffect, useState } from "react";
import { SectionHeader, Button, Modal, FormField, inputClass, Badge, EmptyState } from "@/components/ui/primitives";
import { getEcosystems, upsertEcosystem, deleteEcosystem } from "@/lib/supabaseService";
import { ECO_ICON_CHOICES, getEcoIconByKey } from "@/lib/icons";
import {
  Compass, Plus, Star, Pencil, Trash2, Loader, ChevronUp, ChevronDown, Eye, EyeOff, X,
} from "lucide-react";
import type { Ecosystem } from "@/types";

const COLOR_CHOICES = [
  "#1b4332", "#2d6a4f", "#40916c", "#74c69d", "#a47148", "#c08552",
  "#8b5e3c", "#d4a373", "#5c8aa8", "#457b9d", "#3b3a63", "#6d597a",
];

const emptyEco = (sortOrder: number): Ecosystem => ({
  id: `eco-${Date.now().toString(36)}`,
  name: "",
  blurb: "",
  color: COLOR_CHOICES[0],
  icon: "Leaf",
  tags: [],
  featured: false,
  published: true,
  sortOrder,
});

export default function AdminExplorePage() {
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Ecosystem | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    getEcosystems().then((e) => {
      setEcosystems(e);
      setLoading(false);
    });
  }, []);

  const persist = async (eco: Ecosystem) => {
    await upsertEcosystem(eco);
    setEcosystems((prev) => {
      const exists = prev.some((e) => e.id === eco.id);
      const next = exists ? prev.map((e) => (e.id === eco.id ? eco : e)) : [...prev, eco];
      return [...next].sort((a, b) => a.sortOrder - b.sortOrder);
    });
  };

  // Only one featured ecosystem at a time — starring one unstars the rest.
  const handleFeature = async (eco: Ecosystem) => {
    const next = !eco.featured;
    const updated = ecosystems.map((e) => ({
      ...e,
      featured: e.id === eco.id ? next : false,
    }));
    setEcosystems(updated);
    await Promise.all(
      updated
        .filter((e) => e.featured !== ecosystems.find((o) => o.id === e.id)?.featured)
        .map((e) => upsertEcosystem(e))
    );
  };

  const handlePublish = async (eco: Ecosystem) => {
    await persist({ ...eco, published: !eco.published });
  };

  const handleDelete = async (eco: Ecosystem) => {
    if (!confirm(`Delete "${eco.name}"? Students will no longer see this world.`)) return;
    await deleteEcosystem(eco.id);
    setEcosystems((prev) => prev.filter((e) => e.id !== eco.id));
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ecosystems.length) return;
    const next = [...ecosystems];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((e, i) => ({ ...e, sortOrder: i }));
    setEcosystems(reordered);
    await Promise.all([reordered[index], reordered[target]].map((e) => upsertEcosystem(e)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Explore worlds"
          subtitle="The ecosystem tiles students browse at home — star one to feature it on their home page"
        />
        <Button
          onClick={() => {
            setEditing(emptyEco(ecosystems.length));
            setIsNew(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> New world
        </Button>
      </div>

      {ecosystems.length === 0 ? (
        <EmptyState
          Icon={Compass}
          title="No worlds yet"
          message="Create your first ecosystem tile for students to explore."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ecosystems.map((eco, i) => {
            const Icon = getEcoIconByKey(eco.icon, eco.id);
            return (
              <div key={eco.id} className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
                {/* Tile preview — matches what students see */}
                <div
                  className={`relative aspect-[2/1] p-4 text-cream ${eco.published ? "" : "opacity-45"}`}
                  style={{ background: `linear-gradient(150deg, ${eco.color}, #0d2419)` }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.1]"
                    style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "18px 18px" }}
                  />
                  <Icon className="absolute right-3 top-3 h-9 w-9 drop-shadow-lg" aria-hidden strokeWidth={1.5} />
                  {eco.featured && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-clay-600">
                      <Star className="h-3 w-3 fill-gold-500 text-gold-500" aria-hidden /> Featured
                    </span>
                  )}
                  <div className="absolute inset-x-4 bottom-3">
                    <h3 className="display text-lg font-bold">{eco.name}</h3>
                    <p className="line-clamp-1 text-xs text-forest-100/90">{eco.blurb}</p>
                  </div>
                </div>

                {/* Meta + controls */}
                <div className="space-y-2 p-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {!eco.published && <Badge tone="neutral">Hidden</Badge>}
                    {eco.tags.length > 0 ? (
                      eco.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-semibold text-forest-700">
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-charcoal-soft/60">Matches reels by name</span>
                    )}
                    {eco.tags.length > 3 && (
                      <span className="text-[10px] text-charcoal-soft">+{eco.tags.length - 3}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleFeature(eco)}
                      title={eco.featured ? "Remove from featured" : "Feature on student home"}
                      className={`rounded-lg p-1.5 transition-colors ${
                        eco.featured ? "text-gold-500 hover:bg-gold-300/20" : "text-charcoal-soft/40 hover:bg-gold-300/20 hover:text-gold-500"
                      }`}
                    >
                      <Star className={`h-4 w-4 ${eco.featured ? "fill-gold-500" : ""}`} />
                    </button>
                    <button
                      onClick={() => handlePublish(eco)}
                      title={eco.published ? "Hide from students" : "Show to students"}
                      className="rounded-lg p-1.5 text-charcoal-soft transition-colors hover:bg-forest-50 hover:text-forest-700"
                    >
                      {eco.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleMove(i, -1)}
                      disabled={i === 0}
                      className="rounded-lg p-1.5 text-charcoal-soft hover:bg-forest-50 hover:text-forest-700 disabled:opacity-20"
                      aria-label="Move earlier"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMove(i, 1)}
                      disabled={i === ecosystems.length - 1}
                      className="rounded-lg p-1.5 text-charcoal-soft hover:bg-forest-50 hover:text-forest-700 disabled:opacity-20"
                      aria-label="Move later"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => {
                        setEditing(eco);
                        setIsNew(false);
                      }}
                      className="rounded-lg p-1.5 text-charcoal-soft transition-colors hover:bg-forest-50 hover:text-forest-700"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eco)}
                      className="rounded-lg p-1.5 text-clay-400 transition-colors hover:bg-clay-400/10 hover:text-clay-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / create modal */}
      {editing && (
        <EcosystemForm
          eco={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={async (eco) => {
            await persist(eco);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EcosystemForm({
  eco,
  isNew,
  onClose,
  onSaved,
}: {
  eco: Ecosystem;
  isNew: boolean;
  onClose: () => void;
  onSaved: (eco: Ecosystem) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Ecosystem>(eco);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const patch = (p: Partial<Ecosystem>) => setDraft((d) => ({ ...d, ...p }));

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || draft.tags.includes(tag)) return;
    patch({ tags: [...draft.tags, tag] });
    setTagInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Please give this world a name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSaved({ ...draft, name: draft.name.trim(), blurb: draft.blurb.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? "New world" : `Edit ${eco.name}`} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        {/* Live tile preview */}
        <div
          className="relative overflow-hidden rounded-3xl p-5 text-cream"
          style={{ background: `linear-gradient(150deg, ${draft.color}, #0d2419)` }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.1]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "18px 18px" }}
          />
          {createElement(getEcoIconByKey(draft.icon, draft.id), {
            className: "absolute right-4 top-4 h-10 w-10 drop-shadow-lg",
            "aria-hidden": true,
            strokeWidth: 1.5,
          })}
          <h3 className="display mt-8 text-lg font-bold">{draft.name || "World name"}</h3>
          <p className="mt-1 line-clamp-2 max-w-sm text-xs text-forest-100/90">
            {draft.blurb || "A short line about this wild place…"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" required>
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. Coral Reefs"
              autoFocus={isNew}
            />
          </FormField>
          <FormField label="Blurb">
            <input
              className={inputClass}
              value={draft.blurb}
              onChange={(e) => patch({ blurb: e.target.value })}
              placeholder="One evocative line for the tile"
            />
          </FormField>
        </div>

        {/* Colour */}
        <div>
          <p className="mb-1.5 text-sm font-semibold text-forest-900">Tile colour</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patch({ color: c })}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110 ${
                  draft.color === c ? "ring-forest-700" : "ring-transparent"
                }`}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <p className="mb-1.5 text-sm font-semibold text-forest-900">Icon</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ECO_ICON_CHOICES).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => patch({ icon: key })}
                className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                  draft.icon === key
                    ? "bg-forest-700 text-cream"
                    : "bg-cream text-charcoal-soft ring-1 ring-sand hover:bg-forest-50 hover:text-forest-700"
                }`}
                aria-label={key}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="mb-1.5 text-sm font-semibold text-forest-900">
            Video tags <span className="font-normal text-charcoal-soft">(reels with these tags appear in this world)</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-sand bg-cream/50 p-2">
            {draft.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-forest-700 px-2.5 py-1 text-xs font-semibold text-cream">
                #{t}
                <button
                  type="button"
                  onClick={() => patch({ tags: draft.tags.filter((x) => x !== t) })}
                  className="leading-none hover:opacity-70"
                  aria-label={`Remove tag ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              onBlur={() => tagInput.trim() && addTag(tagInput)}
              placeholder={draft.tags.length === 0 ? "e.g. chimpanzee, reef…" : "Add another…"}
              className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-sm focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-charcoal-soft/70">
            Leave empty to match reels by the world&apos;s name.
          </p>
        </div>

        {/* Published */}
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => patch({ published: e.target.checked })}
          />
          <span className="text-sm font-semibold text-forest-900">Visible to students</span>
        </label>

        {error && (
          <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving…" : isNew ? "Create world" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
