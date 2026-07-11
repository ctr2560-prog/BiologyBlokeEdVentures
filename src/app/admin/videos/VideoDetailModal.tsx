"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import MuxPlayer from "@mux/mux-player-react";
import { Button, FormField, inputClass, Badge } from "@/components/ui/primitives";
import { updateVideo } from "@/lib/supabaseService";
import { X, Film, Loader, Check } from "lucide-react";
import type { Video } from "@/types";

interface Props {
  video: Video;
  onClose: () => void;
  onUpdated: (v: Video) => void;
}

export function VideoDetailModal({ video, onClose, onUpdated }: Props) {
  const [tab, setTab]                   = useState<"preview" | "edit">("preview");
  const [title, setTitle]               = useState(video.title);
  const [description, setDescription]   = useState(video.description);
  const [tags, setTags]                 = useState(video.tags.join(", "));
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState("");
  const [saved, setSaved]               = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const updated = await updateVideo(video.id, {
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-cream shadow-hero overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-sand px-6 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <h2 className="display text-lg font-bold text-forest-900 leading-tight line-clamp-2">
              {video.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-charcoal-soft">
              {video.muxPlaybackId ? (
                <Badge tone="forest">Ready to play</Badge>
              ) : video.muxUploadId ? (
                <Badge tone="sand">Processing...</Badge>
              ) : (
                <Badge tone="neutral">No file</Badge>
              )}
              {video.tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded-full bg-sand px-2 py-0.5">#{t}</span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-charcoal-soft hover:bg-sand hover:text-charcoal"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sand">
          {(["preview", "edit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-forest-700 text-forest-700"
                  : "text-charcoal-soft hover:text-charcoal"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 155px)" }}>

          {/* Preview tab */}
          {tab === "preview" && (
            <div>
              {video.muxPlaybackId ? (
                <div className="overflow-hidden rounded-2xl bg-forest-950">
                  <MuxPlayer
                    playbackId={video.muxPlaybackId}
                    metadata={{ video_title: video.title }}
                    streamType="on-demand"
                    accentColor="#40916c"
                    style={{ width: "100%", aspectRatio: "16/9" }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-forest-950/10 py-16 text-charcoal-soft">
                  {video.muxUploadId ? (
                    <>
                      <Loader className="h-10 w-10 animate-spin text-forest-600" aria-hidden />
                      <p className="mt-3 text-sm font-semibold">Video is still processing</p>
                      <p className="mt-1 text-xs">Check back in a minute</p>
                    </>
                  ) : (
                    <>
                      <Film className="h-10 w-10" aria-hidden />
                      <p className="mt-3 text-sm font-semibold">No file uploaded yet</p>
                    </>
                  )}
                </div>
              )}
              {video.description && (
                <p className="mt-4 text-sm text-charcoal-soft">{video.description}</p>
              )}
            </div>
          )}

          {/* Edit tab */}
          {tab === "edit" && (
            <div className="space-y-4">
              <FormField label="Title" required>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  className={inputClass}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this video covers"
                />
              </FormField>
              <FormField label="Tags" hint="Comma separated">
                <input
                  className={inputClass}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="adaptations, koala, habitat"
                />
              </FormField>
              {saveError && (
                <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">
                  {saveError}
                </p>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-forest-700">
                    <Check className="h-4 w-4" /> Saved
                  </span>
                )}
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
