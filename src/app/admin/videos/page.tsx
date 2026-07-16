"use client";
import { useEffect, useState } from "react";
import { SectionHeader, Button, Modal } from "@/components/ui/primitives";
import { VideoCard } from "@/components/cards/ContentCards";
import { getVideos, deleteVideo } from "@/lib/supabaseService";
import { VideoUploadForm } from "@/components/forms/VideoUploadForm";
import { VideoDetailModal } from "./VideoDetailModal";
import { Upload, Loader, Trash2 } from "lucide-react";
import type { Video } from "@/types";

export default function VideosPage() {
  const [videos, setVideos]   = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen]     = useState(false);
  const [selected, setSelected]         = useState<Video | null>(null);

  useEffect(() => {
    getVideos().then((v) => {
      setVideos(v);
      setLoading(false);
    });
  }, []);

  const handleUpdated = (updated: Video) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setSelected(updated);
  };

  const handleDelete = async (v: Video, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete video "${v.title}"? This cannot be undone.`)) return;
    try {
      await deleteVideo(v.id);
      setVideos((prev) => prev.filter((vid) => vid.id !== v.id));
      if (selected?.id === v.id) setSelected(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed — this video may still have student progress linked to it.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Videos"
        subtitle="Short-form wildlife reels, the heart of every Edventure"
        action={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" aria-hidden /> Upload video
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <div
              key={v.id}
              className="relative cursor-pointer"
              onClick={() => setSelected(v)}
            >
              <VideoCard video={v} />
              {v.muxUploadId && !v.muxPlaybackId && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-forest-950/70">
                  <div className="text-center text-cream">
                    <Loader className="mx-auto h-8 w-8 animate-spin" aria-hidden />
                    <p className="mt-2 text-xs font-semibold">Processing...</p>
                  </div>
                </div>
              )}
              <button
                onClick={(e) => handleDelete(v, e)}
                className="absolute right-3 top-3 rounded-xl bg-white/90 p-1.5 text-charcoal-soft shadow hover:bg-clay-400/20 hover:text-clay-600 transition-colors"
                aria-label="Delete video"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload video" maxWidth="max-w-lg">
        <VideoUploadForm
          onDone={(video) => {
            setVideos((prev) => [{ ...video, muxUploadId: "pending" }, ...prev]);
            setUploadOpen(false);
          }}
        />
      </Modal>

      {/* Video detail modal */}
      {selected && (
        <VideoDetailModal
          video={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
