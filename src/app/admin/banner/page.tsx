"use client";
import { useEffect, useRef, useState } from "react";
import { SectionHeader, Button, FormField, inputClass } from "@/components/ui/primitives";
import { PromoBanner } from "@/components/ui/PromoBanner";
import { getBanners, saveBanner, deleteBanner, uploadBannerImage } from "@/lib/supabaseService";
import {
  Loader, Upload, Trash2, Check, Megaphone, Move, Plus, ChevronUp, ChevronDown,
} from "lucide-react";
import type { SiteBanner } from "@/types";

const PLACEMENT = "teacher";

const newBanner = (sortOrder: number): SiteBanner => ({
  id: `bn-${Date.now().toString(36)}`,
  placement: PLACEMENT,
  eyebrow: "",
  title: "",
  message: "",
  imageUrl: "",
  imagePosX: 50,
  imagePosY: 50,
  linkUrl: "",
  linkLabel: "",
  active: false,
  sortOrder,
});

export default function AdminBannerPage() {
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<SiteBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Drag-to-reposition state for the background image on the live preview
  const dragRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
    w: number;
    h: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    getBanners(PLACEMENT).then((list) => {
      setBanners(list);
      if (list.length > 0) {
        setSelectedId(list[0].id);
        setBanner(list[0]);
      }
      setLoading(false);
    });
  }, []);

  const select = (b: SiteBanner) => {
    setSelectedId(b.id);
    setBanner(b);
    setSaved(false);
    setError("");
  };

  const patch = (p: Partial<SiteBanner>) => {
    setSaved(false);
    setBanner((prev) => (prev ? { ...prev, ...p } : prev));
  };

  const handleNew = async () => {
    const b = newBanner(banners.length);
    try {
      await saveBanner(b);
      setBanners((prev) => [...prev, b]);
      select(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create banner");
    }
  };

  const handleDelete = async (b: SiteBanner) => {
    if (!confirm(`Delete banner "${b.title || "Untitled"}"? This cannot be undone.`)) return;
    await deleteBanner(b.id);
    const remaining = banners.filter((x) => x.id !== b.id);
    setBanners(remaining);
    if (selectedId === b.id) {
      if (remaining.length > 0) select(remaining[0]);
      else {
        setSelectedId(null);
        setBanner(null);
      }
    }
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((b, i) => ({ ...b, sortOrder: i }));
    setBanners(reordered);
    if (banner) {
      const updated = reordered.find((b) => b.id === banner.id);
      if (updated) setBanner({ ...banner, sortOrder: updated.sortOrder });
    }
    await Promise.all([reordered[index], reordered[target]].map((b) => saveBanner(b)));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const url = await uploadBannerImage(file);
      patch({ imageUrl: url, imagePosX: 50, imagePosY: 50 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!banner) return;
    setSaving(true);
    setError("");
    try {
      await saveBanner(banner);
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? banner : b)));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!banner?.imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: banner.imagePosX,
      posY: banner.imagePosY,
      w: rect.width,
      h: rect.height,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    // Dragging the image right reveals more of its left side → position % decreases
    patch({
      imagePosX: clamp(d.posX - ((e.clientX - d.startX) / d.w) * 100),
      imagePosY: clamp(d.posY - ((e.clientY - d.startY) / d.h) * 100),
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
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
      <div className="flex items-center justify-between gap-4">
        <SectionHeader
          title="Teacher banners"
          subtitle="These rotate at the top of every teacher's dashboard — announcements, new content, seasonal campaigns"
        />
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4" aria-hidden /> New banner
        </Button>
      </div>

      {/* Banner list */}
      {banners.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {banners.map((b, i) => (
            <div
              key={b.id}
              className={`flex items-center gap-1.5 rounded-2xl py-1.5 pl-3 pr-1.5 text-sm transition-all ${
                selectedId === b.id
                  ? "bg-forest-700 text-cream shadow-soft"
                  : "bg-white text-charcoal ring-1 ring-sand hover:ring-forest-400"
              }`}
            >
              <button onClick={() => select(b)} className="flex items-center gap-2 font-semibold">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    b.active ? "bg-forest-400" : selectedId === b.id ? "bg-white/30" : "bg-charcoal/15"
                  }`}
                  title={b.active ? "Live" : "Hidden"}
                />
                <span className="max-w-[10rem] truncate">{b.title || "Untitled banner"}</span>
              </button>
              <span className={`flex items-center ${selectedId === b.id ? "text-cream/60" : "text-charcoal-soft/50"}`}>
                <button
                  onClick={() => handleMove(i, -1)}
                  disabled={i === 0}
                  className="rounded p-0.5 hover:opacity-70 disabled:opacity-20"
                  aria-label="Move earlier"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleMove(i, 1)}
                  disabled={i === banners.length - 1}
                  className="rounded p-0.5 hover:opacity-70 disabled:opacity-20"
                  aria-label="Move later"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  className="rounded p-0.5 hover:text-clay-400"
                  aria-label="Delete banner"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {!banner ? (
        <div className="rounded-3xl border-2 border-dashed border-sand-dark bg-white/60 py-16 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-sand-dark" aria-hidden />
          <p className="text-sm text-charcoal-soft">No banners yet — create your first one.</p>
          <Button className="mt-4" onClick={handleNew}>
            <Plus className="h-4 w-4" aria-hidden /> New banner
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[24rem,1fr] lg:items-start">
          {/* ── Editor ── */}
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
            {/* Active toggle */}
            <div className="flex items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-forest-900">Show banner</p>
                <p className="text-xs text-charcoal-soft">
                  {banner.active ? "Teachers can see this banner." : "Hidden from teachers."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => patch({ active: !banner.active })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  banner.active ? "bg-forest-600" : "bg-charcoal/20"
                }`}
                aria-pressed={banner.active}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    banner.active ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <FormField label="Eyebrow (small tagline above the title)">
              <input
                className={inputClass}
                value={banner.eyebrow}
                onChange={(e) => patch({ eyebrow: e.target.value })}
                placeholder="e.g. BIOBLOKE X TARONGA ZOO"
              />
            </FormField>

            <FormField label="Title">
              <input
                className={inputClass}
                value={banner.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="e.g. New: Reef Guardians unit is live!"
              />
            </FormField>

            <FormField label="Message">
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={banner.message}
                onChange={(e) => patch({ message: e.target.value })}
                placeholder="A short line or two about what's new…"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Button label">
                <input
                  className={inputClass}
                  value={banner.linkLabel}
                  onChange={(e) => patch({ linkLabel: e.target.value })}
                  placeholder="Explore now"
                />
              </FormField>
              <FormField label="Button link">
                <input
                  className={inputClass}
                  value={banner.linkUrl}
                  onChange={(e) => patch({ linkUrl: e.target.value })}
                  placeholder="/teacher/library"
                />
              </FormField>
            </div>

            {/* Feature image */}
            <div>
              <p className="mb-1.5 block text-sm font-semibold text-forest-900">Feature image</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 px-4 py-3 text-sm font-semibold text-charcoal-soft transition-colors hover:border-forest-400 hover:text-forest-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> {banner.imageUrl ? "Replace image" : "Upload image"}
                    </>
                  )}
                </button>
                {banner.imageUrl && (
                  <button
                    type="button"
                    onClick={() => patch({ imageUrl: "", imagePosX: 50, imagePosY: 50 })}
                    className="rounded-2xl px-3 text-clay-400 ring-1 ring-sand transition-colors hover:bg-clay-400/10 hover:text-clay-600"
                    aria-label="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-charcoal-soft/70">
                Wide images work best (around 1600 × 600). The image fills the whole banner —
                keep the key subject on the right, since the white text card sits on the left.
              </p>
            </div>

            {error && (
              <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">
                {error}
              </p>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              {saving ? "Saving…" : saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                "Save banner"
              )}
            </Button>
          </div>

          {/* ── Live preview ── */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">
              Live preview — what teachers will see
            </p>
            {banner.title || banner.message || banner.imageUrl ? (
              <div className={banner.active ? "" : "opacity-50"}>
                <div className="relative">
                  <PromoBanner banner={banner} />
                  {banner.imageUrl && (
                    <div
                      onPointerDown={startDrag}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className={`absolute inset-0 z-10 rounded-3xl ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                      title="Drag to reposition the background image"
                    />
                  )}
                </div>
                {banner.imageUrl && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs text-charcoal-soft">
                      <Move className="h-3.5 w-3.5" aria-hidden />
                      Drag the preview to reposition the image, then save.
                    </p>
                    {(banner.imagePosX !== 50 || banner.imagePosY !== 50) && (
                      <button
                        onClick={() => patch({ imagePosX: 50, imagePosY: 50 })}
                        className="text-xs font-semibold text-forest-700 hover:underline"
                      >
                        Reset position
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-sand-dark bg-white/60 py-16 text-center">
                <Megaphone className="mx-auto mb-3 h-8 w-8 text-sand-dark" aria-hidden />
                <p className="text-sm text-charcoal-soft">
                  Add a title, message or image to see the banner take shape.
                </p>
              </div>
            )}
            {!banner.active && (banner.title || banner.message || banner.imageUrl) && (
              <p className="text-xs text-charcoal-soft">
                This banner is currently hidden — flip “Show banner” on and save to publish it.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
