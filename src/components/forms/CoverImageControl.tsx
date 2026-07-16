"use client";
/*
 * Compact cover-image uploader for units and lessons. The image shows on the
 * teacher-side library/dashboard cards (and unit hero). Stored in the public
 * `covers` bucket; the row keeps only the public URL.
 */
import { useRef, useState } from "react";
import Image from "next/image";
import { uploadCoverImage, setUnitCover, setLessonCover } from "@/lib/supabaseService";
import { ImagePlus, Loader, Trash2 } from "lucide-react";

export function CoverImageControl({
  kind,
  id,
  initialUrl,
  compact = false,
}: {
  kind: "unit" | "lesson";
  id: string;
  initialUrl: string;
  /** Smaller preview strip for tight layouts (unit cards). */
  compact?: boolean;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const persist = kind === "unit" ? setUnitCover : setLessonCover;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const publicUrl = await uploadCoverImage(kind, id, file);
      await persist(id, publicUrl);
      setUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError("");
    try {
      await persist(id, "");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setBusy(false);
    }
  };

  const previewH = compact ? "h-20" : "h-32";

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {url ? (
        <div className={`group relative ${previewH} overflow-hidden rounded-2xl ring-1 ring-sand`}>
          <Image src={url} alt="Cover image" fill className="object-cover" sizes="480px" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-forest-950/0 opacity-0 transition-all group-hover:bg-forest-950/50 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-forest-900 hover:bg-white"
            >
              {busy ? "Working…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="rounded-full bg-white/95 p-1.5 text-clay-600 hover:bg-white"
              aria-label="Remove cover image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className={`flex ${previewH} w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-sand-dark bg-cream/40 text-charcoal-soft transition-colors hover:border-forest-400 hover:text-forest-700`}
        >
          {busy ? (
            <Loader className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" aria-hidden />
              <span className="text-xs font-semibold">Add cover image</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-3 py-2 text-xs font-medium text-clay-600">{error}</p>
      )}
    </div>
  );
}
