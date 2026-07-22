"use client";
import { useRef, useState } from "react";
import { FormField, Button, inputClass } from "@/components/ui/primitives";
import { createVideo } from "@/lib/supabaseService";
import { Loader, X, RectangleVertical, RectangleHorizontal } from "lucide-react";
import type { Topic, Video, VideoAspectRatio } from "@/types";

type UploadState = "idle" | "creating" | "uploading" | "processing" | "error";

interface Props {
  /** Pre-selected and locked topic (when uploading from within a lesson). */
  lockedTopic?: Topic;
  onDone: (video: Video) => void;
}

export function VideoUploadForm({ lockedTopic, onDone }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("vertical");
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagDraft("");
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setTagDraft("");
    setAspectRatio("vertical");
    setFile(null);
    setUploadState("idle");
    setUploadProgress(0);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    setErrorMsg("");

    // Pick up a tag still sitting in the input that was never committed
    const finalTags = [...tags];
    const pending = tagDraft.trim().toLowerCase();
    if (pending && !finalTags.includes(pending)) finalTags.push(pending);

    try {
      setUploadState("creating");
      const video = await createVideo({
        title,
        description,
        topicId: lockedTopic?.id ?? "",
        unitId: lockedTopic?.unitId ?? "",
        videoUrl: "",
        thumbnailUrl: "",
        thumbEmoji: "",
        durationSeconds: 0,
        tags: finalTags,
        stage: "Stage 3" as const,
        yearGroups: [],
        transcript: "",
        learningIntent: "",
        successCriteria: [],
        published: false,
        aspectRatio,
      });

      setUploadState("uploading");
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
      });
      const { uploadUrl, error } = await res.json();
      if (error || !uploadUrl) throw new Error(error ?? "Failed to get upload URL");

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

      setUploadState("processing");
      onDone({ ...video, muxUploadId: "pending" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  };

  if (uploadState === "processing") {
    return (
      <div className="py-6 text-center">
        <Loader className="mx-auto h-10 w-10 animate-spin text-forest-600" aria-hidden />
        <h3 className="display mt-3 text-lg font-bold text-forest-900">Uploaded!</h3>
        <p className="mt-1 text-sm text-charcoal-soft">
          Mux is transcoding your video. It will be playable in a minute or two.
        </p>
        <Button className="mt-5" onClick={reset} variant="secondary">Upload another</Button>
      </div>
    );
  }

  return (
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

      {lockedTopic && (
        <div className="rounded-2xl bg-forest-50 px-4 py-2.5 text-sm text-forest-800">
          <span className="font-semibold">Lesson: </span>{lockedTopic.title}
        </div>
      )}

      <FormField label="Description">
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of the reel"
        />
      </FormField>

      <FormField label="Tags" hint="Power the adaptive engine — students who watch longer on a tag get activities matched to it">
        <div>
          {tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-800"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                    className="text-forest-600 hover:text-clay-600"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            className={inputClass}
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="e.g. chimpanzees — press Enter to add"
          />
        </div>
      </FormField>

      <FormField label="Framing" hint="Vertical fills the screen edge-to-edge in the lesson feed; horizontal is letterboxed">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAspectRatio("vertical")}
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-sm font-semibold transition-colors ${
              aspectRatio === "vertical"
                ? "border-forest-700 bg-forest-50 text-forest-800"
                : "border-sand-dark text-charcoal-soft hover:bg-cream"
            }`}
          >
            <RectangleVertical className="h-4 w-4" aria-hidden /> Vertical (9:16)
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio("horizontal")}
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-sm font-semibold transition-colors ${
              aspectRatio === "horizontal"
                ? "border-forest-700 bg-forest-50 text-forest-800"
                : "border-sand-dark text-charcoal-soft hover:bg-cream"
            }`}
          >
            <RectangleHorizontal className="h-4 w-4" aria-hidden /> Horizontal (16:9)
          </button>
        </div>
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
        disabled={
          !file ||
          !title ||
          uploadState === "creating" ||
          uploadState === "uploading"
        }
      >
        {uploadState === "creating"
          ? "Creating..."
          : uploadState === "uploading"
          ? `Uploading ${uploadProgress}%`
          : "Upload to Mux"}
      </Button>
    </form>
  );
}
