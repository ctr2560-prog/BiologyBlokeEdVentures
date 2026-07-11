"use client";
import { useEffect, useState } from "react";
import { Modal, Button, Badge, EmptyState } from "@/components/ui/primitives";
import { VideoUploadForm } from "@/components/forms/VideoUploadForm";
import { ResourceForm, QuizForm } from "@/components/forms/ContentForms";
import {
  getVideosByTopic,
  getResourcesByTopic,
  getQuizzesByTopic,
} from "@/lib/supabaseService";
import { Film, FileText, CircleHelp, Upload, Plus, BookOpen, Loader } from "lucide-react";
import type { Topic, Video, Resource, Quiz } from "@/types";

type Panel = "overview" | "add-video" | "add-resource" | "add-quiz";

interface Props {
  topic: Topic;
  open: boolean;
  onClose: () => void;
}

export function TopicContentModal({ topic, open, onClose }: Props) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<Panel>("overview");

  useEffect(() => {
    if (!open) {
      setPanel("overview");
      return;
    }
    setLoading(true);
    Promise.all([
      getVideosByTopic(topic.id),
      getResourcesByTopic(topic.id),
      getQuizzesByTopic(topic.id),
    ]).then(([v, r, q]) => {
      setVideos(v);
      setResources(r);
      setQuizzes(q);
      setLoading(false);
    });
  }, [open, topic.id]);

  const refreshContent = async () => {
    const [v, r, q] = await Promise.all([
      getVideosByTopic(topic.id),
      getResourcesByTopic(topic.id),
      getQuizzesByTopic(topic.id),
    ]);
    setVideos(v);
    setResources(r);
    setQuizzes(q);
  };

  const difficultyColor: Record<string, string> = {
    foundation: "clay",
    core: "forest",
    advanced: "mist",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={topic.title}
      maxWidth="max-w-2xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-forest-600" aria-hidden />
        </div>
      ) : panel === "overview" ? (
        <div className="space-y-6">
          {topic.description && (
            <p className="text-sm text-charcoal-soft">{topic.description}</p>
          )}

          {/* Videos */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                <Film className="h-4 w-4 text-forest-600" aria-hidden />
                Videos
                <Badge tone="neutral">{videos.length}</Badge>
              </h3>
              <Button size="sm" variant="secondary" onClick={() => setPanel("add-video")}>
                <Upload className="h-3.5 w-3.5" aria-hidden /> Upload video
              </Button>
            </div>
            {videos.length === 0 ? (
              <p className="rounded-2xl bg-cream/60 px-4 py-3 text-sm text-charcoal-soft">
                No videos yet. Upload the first reel for this topic.
              </p>
            ) : (
              <div className="space-y-2">
                {videos.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 ring-1 ring-sand"
                  >
                    <Film className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                    <span className="flex-1 truncate text-sm font-medium text-charcoal">
                      {v.title}
                    </span>
                    {v.muxUploadId && !v.muxPlaybackId ? (
                      <Badge tone="sand">Processing</Badge>
                    ) : v.published ? (
                      <Badge tone="forest">Published</Badge>
                    ) : (
                      <Badge tone="neutral">Draft</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Resources */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                <FileText className="h-4 w-4 text-forest-600" aria-hidden />
                Resources
                <Badge tone="neutral">{resources.length}</Badge>
              </h3>
              <Button size="sm" variant="secondary" onClick={() => setPanel("add-resource")}>
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add resource
              </Button>
            </div>
            {resources.length === 0 ? (
              <p className="rounded-2xl bg-cream/60 px-4 py-3 text-sm text-charcoal-soft">
                No resources yet. Add worksheets, guides or activities.
              </p>
            ) : (
              <div className="space-y-2">
                {resources.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 ring-1 ring-sand"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                    <span className="flex-1 truncate text-sm font-medium text-charcoal">
                      {r.title}
                    </span>
                    <Badge tone="sand">{r.type}</Badge>
                    {r.published ? (
                      <Badge tone="forest">Published</Badge>
                    ) : (
                      <Badge tone="neutral">Draft</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quizzes */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                <CircleHelp className="h-4 w-4 text-forest-600" aria-hidden />
                Quizzes
                <Badge tone="neutral">{quizzes.length}</Badge>
              </h3>
              <Button size="sm" variant="secondary" onClick={() => setPanel("add-quiz")}>
                <Plus className="h-3.5 w-3.5" aria-hidden /> Build quiz
              </Button>
            </div>
            {quizzes.length === 0 ? (
              <p className="rounded-2xl bg-cream/60 px-4 py-3 text-sm text-charcoal-soft">
                No quizzes yet. Build a quick check for this topic.
              </p>
            ) : (
              <div className="space-y-2">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 ring-1 ring-sand"
                  >
                    <CircleHelp className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                    <span className="flex-1 truncate text-sm font-medium text-charcoal">
                      {q.title}
                    </span>
                    <Badge tone="forest">{q.questions.length} Q</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : panel === "add-video" ? (
        <div className="space-y-4">
          <button
            className="text-sm font-semibold text-forest-700 hover:underline"
            onClick={() => setPanel("overview")}
          >
            Back to overview
          </button>
          <VideoUploadForm
            lockedTopic={topic}
            onDone={(video) => {
              setVideos((prev) => [video, ...prev]);
              setPanel("overview");
            }}
          />
        </div>
      ) : panel === "add-resource" ? (
        <div className="space-y-4">
          <button
            className="text-sm font-semibold text-forest-700 hover:underline"
            onClick={() => setPanel("overview")}
          >
            Back to overview
          </button>
          <ResourceForm
            lockedTopicId={topic.id}
            lockedUnitId={topic.unitId}
            lockedTopicTitle={topic.title}
            onSaved={async () => {
              await refreshContent();
              setPanel("overview");
            }}
          />
        </div>
      ) : panel === "add-quiz" ? (
        <div className="space-y-4">
          <button
            className="text-sm font-semibold text-forest-700 hover:underline"
            onClick={() => setPanel("overview")}
          >
            Back to overview
          </button>
          <QuizForm
            lockedTopicId={topic.id}
            lockedTopicTitle={topic.title}
            onSaved={async () => {
              await refreshContent();
              setPanel("overview");
            }}
          />
        </div>
      ) : null}
    </Modal>
  );
}
