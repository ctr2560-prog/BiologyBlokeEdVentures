"use client";
import { useEffect, useRef, useState } from "react";
import { SectionHeader, Button, Modal, FormField, inputClass } from "@/components/ui/primitives";
import { VideoCard } from "@/components/cards/ContentCards";
import { getVideos, createVideo, getTopics } from "@/lib/supabaseService";
import { Upload, CheckCircle, Loader } from "lucide-react";
import type { Video, Topic } from "@/types";

type UploadState = "idle" | "creating" | "uploading" | "processing" | "done" | "error";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [learningIntent, setLearningIntent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getVideos(), getTopics()]).then(([v, t]) => {
      setVideos(v);
      setTopics(t);
      setLoading(false);
    });
  }, []);

  const selectedTopic = topics.find((t) => t.id === topicId);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTopicId("");
    setLearningIntent("");
    setFile(null);
    setUploadState("idle");
    setUploadProgress(0);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !topicId || !title) return;
    setErrorMsg("");

    try {
      // 1. Create the video record in Supabase (unpublished until Mux is ready)
      setUploadState("creating");
      const video = await createVideo({
        title,
        description,
        topicId,
        unitId: selectedTopic?.unitId ?? "",
        videoUrl: "",
        thumbnailUrl: "",
        thumbEmoji: "",
        durationSeconds: 0,
        tags: [],
        stage: "Stage 3" as const,
        yearGroups: [],
        transcript: "",
        learningIntent,
        successCriteria: [],
        published: false,
      });

      // 2. Get a Mux direct upload URL (server creates it + stores upload_id)
      setUploadState("uploading");
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
      });
      const { uploadUrl, error } = await res.json();
      if (error || !uploadUrl) throw new Error(error ?? "Failed to get upload URL");

      // 3. PUT the file directly to Mux — never goes through our server
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      // 4. Mux now processes the video. Webhook will set mux_playback_id when ready.
      setUploadState("processing");
      setVideos((prev) => [{ ...video, muxUploadId: "pending" }, ...prev]);

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  };

  const closeModal = () => {
    setModal(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Videos"
        subtitle="Short-form wildlife reels, the heart of every Edventure"
        action={
          <Button onClick={() => setModal(true)}>
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
            <div key={v.id} className="relative">
              <VideoCard video={v} href={`/admin/analytics?video=${v.id}`} />
              {v.muxUploadId && !v.muxPlaybackId && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-forest-950/70">
                  <div className="text-center text-cream">
                    <Loader className="mx-auto h-8 w-8 animate-spin" aria-hidden />
                    <p className="mt-2 text-xs font-semibold">Processing...</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title="Upload video" maxWidth="max-w-lg">
        {uploadState === "processing" || uploadState === "done" ? (
          <div className="py-6 text-center">
            <Loader className="mx-auto h-12 w-12 animate-spin text-forest-600" aria-hidden />
            <h3 className="display mt-4 text-lg font-bold text-forest-900">Uploaded!</h3>
            <p className="mt-1 text-sm text-charcoal-soft">
              Mux is transcoding your video. It will appear as playable in a minute or two.
            </p>
            <Button className="mt-5" onClick={closeModal}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            <FormField label="Title" required>
              <input
                className={inputClass}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hunting with Cheetahs"
              />
            </FormField>

            <FormField label="Topic" required>
              <select
                className={inputClass}
                required
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
              >
                <option value="">Select a topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Description">
              <textarea
                className={inputClass}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the reel"
              />
            </FormField>

            <FormField label="Learning intent">
              <input
                className={inputClass}
                value={learningIntent}
                onChange={(e) => setLearningIntent(e.target.value)}
                placeholder="e.g. Students will understand predator-prey dynamics"
              />
            </FormField>

            <FormField label="Video file" required>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                required
                className={inputClass + " cursor-pointer"}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="mt-1 text-xs text-charcoal-soft">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </FormField>

            {uploadState === "uploading" && (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-forest-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-right text-xs text-charcoal-soft">{uploadProgress}%</p>
              </div>
            )}

            {errorMsg && (
              <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{errorMsg}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!file || !title || !topicId || uploadState === "creating" || uploadState === "uploading"}
            >
              {uploadState === "creating" ? "Creating..." : uploadState === "uploading" ? `Uploading ${uploadProgress}%` : "Upload to Mux"}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
