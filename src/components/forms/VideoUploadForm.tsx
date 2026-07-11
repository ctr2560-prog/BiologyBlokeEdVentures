"use client";
import { useRef, useState } from "react";
import { FormField, Button, inputClass } from "@/components/ui/primitives";
import { createVideo } from "@/lib/supabaseService";
import { Loader } from "lucide-react";
import type { Topic, Video } from "@/types";

type UploadState = "idle" | "creating" | "uploading" | "processing" | "error";

interface Props {
  /** Pre-selected and locked topic - hides the topic dropdown */
  lockedTopic?: Topic;
  /** Topics list for the dropdown (used when no lockedTopic) */
  availableTopics?: Topic[];
  onDone: (video: Video) => void;
}

export function VideoUploadForm({ lockedTopic, availableTopics = [], onDone }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState(lockedTopic?.id ?? "");
  const [learningIntent, setLearningIntent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedTopic = lockedTopic ?? availableTopics.find((t) => t.id === topicId);

  const reset = () => {
    setTitle("");
    setDescription("");
    if (!lockedTopic) setTopicId("");
    setLearningIntent("");
    setFile(null);
    setUploadState("idle");
    setUploadProgress(0);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedTopicId = lockedTopic?.id ?? topicId;
    if (!file || !resolvedTopicId || !title) return;
    setErrorMsg("");

    try {
      setUploadState("creating");
      const video = await createVideo({
        title,
        description,
        topicId: resolvedTopicId,
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

      {lockedTopic ? (
        <div className="rounded-2xl bg-forest-50 px-4 py-2.5 text-sm text-forest-800">
          <span className="font-semibold">Topic: </span>{lockedTopic.title}
        </div>
      ) : (
        <FormField label="Topic" required>
          <select
            className={inputClass}
            required
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
          >
            <option value="">Select a topic</option>
            {availableTopics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </FormField>
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
        disabled={
          !file ||
          !title ||
          (!lockedTopic && !topicId) ||
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
