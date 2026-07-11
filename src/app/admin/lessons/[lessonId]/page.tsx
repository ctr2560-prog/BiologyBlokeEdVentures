"use client";
import { useCallback, useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { ActivityBuilderModal } from "./ActivityBuilderModal";
import {
  getTopic, getVideos, getQuizzes, getLessonItems,
  addItemToLesson, removeLessonItem, reorderLessonItems,
  getActivitiesForLesson, deleteActivity,
} from "@/lib/supabaseService";
import {
  ArrowLeft, Film, CircleHelp, ChevronUp, ChevronDown,
  Trash2, Loader, Pencil, BookOpen, Plus, Check,
} from "lucide-react";
import type {
  Topic, Video, Quiz, LessonItemWithContent, Activity, Difficulty,
} from "@/types";

const DIFFICULTIES: Difficulty[] = ["foundation", "core", "advanced"];

const difficultyMeta: Record<
  Difficulty,
  { label: string; tone: "clay" | "forest" | "mist"; description: string }
> = {
  foundation: { label: "Foundation", tone: "clay",   description: "For students who need extra support" },
  core:       { label: "Core",       tone: "forest", description: "For students at the expected level" },
  advanced:   { label: "Advanced",   tone: "mist",   description: "For students ready for extension" },
};

export default function LessonBuilderPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);

  const [lesson, setLesson]         = useState<Topic | null>(null);
  const [items, setItems]           = useState<LessonItemWithContent[]>([]);
  const [allVideos, setAllVideos]   = useState<Video[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);

  const [libraryTab, setLibraryTab] = useState<"videos" | "quizzes">("videos");
  const [activityModal, setActivityModal] = useState<{
    diff: Difficulty;
    existing?: Activity;
  } | null>(null);

  const load = useCallback(async () => {
    const [topicData, itemsData, videosData, quizzesData, activitiesData] =
      await Promise.all([
        getTopic(lessonId),
        getLessonItems(lessonId),
        getVideos(),
        getQuizzes(),
        getActivitiesForLesson(lessonId),
      ]);
    setLesson(topicData);
    setItems(itemsData);
    setAllVideos(videosData);
    setAllQuizzes(quizzesData);
    setActivities(activitiesData);
    setLoading(false);
  }, [lessonId]);

  useEffect(() => { load(); }, [load]);

  // ── Sequence actions ──────────────────────────────────────────────────────

  const addedVideoIds = new Set(
    items
      .filter((i): i is Extract<LessonItemWithContent, { itemType: "video" }> => i.itemType === "video")
      .map((i) => i.video.id)
  );
  const addedQuizIds = new Set(
    items
      .filter((i): i is Extract<LessonItemWithContent, { itemType: "quiz" }> => i.itemType === "quiz")
      .map((i) => i.quiz.id)
  );

  const handleAddVideo = async (video: Video) => {
    if (addedVideoIds.has(video.id)) return;
    const item = await addItemToLesson(lessonId, "video", video.id, items.length);
    setItems((prev) => [...prev, { ...item, itemType: "video" as const, video }]);
  };

  const handleAddQuiz = async (quiz: Quiz) => {
    if (addedQuizIds.has(quiz.id)) return;
    const item = await addItemToLesson(lessonId, "quiz", quiz.id, items.length);
    setItems((prev) => [...prev, { ...item, itemType: "quiz" as const, quiz }]);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeLessonItem(itemId);
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== itemId);
      return filtered.map((it, idx) => ({ ...it, orderIndex: idx }));
    });
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((it, i) => ({ ...it, orderIndex: i }));
    setItems(reordered);
    await reorderLessonItems(reordered.map(({ id, orderIndex }) => ({ id, orderIndex })));
  };

  // ── Activity actions ──────────────────────────────────────────────────────

  const handleActivitySaved = (saved: Activity) => {
    setActivities((prev) => {
      const without = prev.filter((a) => a.difficulty !== saved.difficulty);
      return [...without, saved].sort(
        (a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty)
      );
    });
    setActivityModal(null);
  };

  const handleDeleteActivity = async (id: string) => {
    await deleteActivity(id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!lesson) {
    return <p className="p-8 text-charcoal-soft">Lesson not found.</p>;
  }

  const videoCount = items.filter((i) => i.itemType === "video").length;
  const quizCount  = items.filter((i) => i.itemType === "quiz").length;

  return (
    <div className="flex min-h-0 flex-col gap-6">
      {/* Page header */}
      <div>
        <Link
          href="/admin/lessons"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to lessons
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="display text-2xl font-bold text-forest-900 md:text-3xl">
            {lesson.title}
          </h1>
          <Badge
            tone={
              lesson.difficulty === "foundation" ? "clay"
              : lesson.difficulty === "advanced" ? "mist"
              : "forest"
            }
          >
            {lesson.difficulty}
          </Badge>
        </div>
        {lesson.description && (
          <p className="mt-1 text-sm text-charcoal-soft">{lesson.description}</p>
        )}
      </div>

      {/* Two-column builder */}
      <div className="flex gap-6 items-start">

        {/* ── Left library panel ────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 rounded-3xl bg-white shadow-soft ring-1 ring-black/5 overflow-hidden sticky top-6">
          <div className="border-b border-sand px-4 pt-4 pb-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">
              Library
            </p>
            <div className="flex">
              {(["videos", "quizzes"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLibraryTab(t)}
                  className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    libraryTab === t
                      ? "border-b-2 border-forest-700 text-forest-700"
                      : "text-charcoal-soft hover:text-charcoal"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {libraryTab === "videos" && (
              <>
                {allVideos.length === 0 ? (
                  <div className="px-2 py-8 text-center">
                    <Film className="mx-auto h-7 w-7 text-sand-dark" aria-hidden />
                    <p className="mt-2 text-xs text-charcoal-soft">
                      No videos yet. Upload on the Videos page.
                    </p>
                    <Link
                      href="/admin/videos"
                      className="mt-2 inline-block text-xs font-semibold text-forest-700 hover:underline"
                    >
                      Go to Videos
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {allVideos.map((v) => {
                      const added = addedVideoIds.has(v.id);
                      return (
                        <li key={v.id}>
                          <button
                            onClick={() => handleAddVideo(v)}
                            disabled={added}
                            className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                              added
                                ? "cursor-default bg-forest-50 text-forest-700"
                                : "hover:bg-cream text-charcoal hover:text-forest-900"
                            }`}
                          >
                            <Film
                              className={`h-4 w-4 shrink-0 ${added ? "text-forest-600" : "text-charcoal-soft"}`}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {v.title}
                            </span>
                            {added ? (
                              <Check className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                            ) : (
                              <Plus className="h-4 w-4 shrink-0 text-charcoal-soft opacity-0 group-hover:opacity-100" aria-hidden />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            {libraryTab === "quizzes" && (
              <>
                {allQuizzes.length === 0 ? (
                  <div className="px-2 py-8 text-center">
                    <CircleHelp className="mx-auto h-7 w-7 text-sand-dark" aria-hidden />
                    <p className="mt-2 text-xs text-charcoal-soft">
                      No quizzes yet. Create on the Quizzes page.
                    </p>
                    <Link
                      href="/admin/quizzes"
                      className="mt-2 inline-block text-xs font-semibold text-forest-700 hover:underline"
                    >
                      Go to Quizzes
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {allQuizzes.map((q) => {
                      const added = addedQuizIds.has(q.id);
                      return (
                        <li key={q.id}>
                          <button
                            onClick={() => handleAddQuiz(q)}
                            disabled={added}
                            className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                              added
                                ? "cursor-default bg-forest-50 text-forest-700"
                                : "hover:bg-cream text-charcoal hover:text-forest-900"
                            }`}
                          >
                            <CircleHelp
                              className={`h-4 w-4 shrink-0 ${added ? "text-forest-600" : "text-charcoal-soft"}`}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{q.title}</p>
                              <p className="text-xs text-charcoal-soft">
                                {q.questions.length} question{q.questions.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            {added ? (
                              <Check className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                            ) : (
                              <Plus className="h-4 w-4 shrink-0 text-charcoal-soft" aria-hidden />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </aside>

        {/* ── Right main area ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Content sequence */}
          <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 space-y-4">
            <div>
              <h2 className="display text-lg font-bold text-forest-900">Content sequence</h2>
              <p className="text-sm text-charcoal-soft">
                Click videos or quizzes in the library to add them. Reorder below.
              </p>
            </div>

            {items.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 py-10 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-sand-dark" aria-hidden />
                <p className="text-sm text-charcoal-soft">
                  No content yet. Pick videos and quizzes from the library.
                </p>
              </div>
            ) : (
              <ol className="space-y-2">
                {items.map((item, i) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3 ring-1 ring-sand"
                  >
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-charcoal-soft">
                      {i + 1}
                    </span>

                    {item.itemType === "video" ? (
                      <Film className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                    ) : (
                      <CircleHelp className="h-4 w-4 shrink-0 text-mist-600" aria-hidden />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-charcoal">
                        {item.itemType === "video" ? item.video.title : item.quiz.title}
                      </p>
                      <p className="text-xs text-charcoal-soft">
                        {item.itemType === "video"
                          ? item.video.muxPlaybackId
                            ? "Ready to play"
                            : item.video.muxUploadId
                            ? "Processing..."
                            : "No file uploaded"
                          : `${item.quiz.questions.length} questions`}
                      </p>
                    </div>

                    <Badge tone={item.itemType === "video" ? "forest" : "mist"}>
                      {item.itemType === "video" ? "Video" : "Quiz"}
                    </Badge>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleMove(i, -1)}
                        disabled={i === 0}
                        className="p-1.5 text-charcoal-soft hover:text-forest-700 disabled:opacity-25"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMove(i, 1)}
                        disabled={i === items.length - 1}
                        className="p-1.5 text-charcoal-soft hover:text-forest-700 disabled:opacity-25"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-clay-400 hover:text-clay-600"
                        aria-label="Remove from lesson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <p className="text-xs text-charcoal-soft">
              {videoCount} video{videoCount !== 1 ? "s" : ""},{" "}
              {quizCount} quiz checkpoint{quizCount !== 1 ? "s" : ""}
            </p>
          </section>

          {/* Adaptive activities */}
          <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 space-y-4">
            <div>
              <h2 className="display text-lg font-bold text-forest-900">Adaptive activities</h2>
              <p className="text-sm text-charcoal-soft">
                One activity is served to each student after the lesson based on their quiz scores and watch time.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {DIFFICULTIES.map((diff) => {
                const meta     = difficultyMeta[diff];
                const existing = activities.find((a) => a.difficulty === diff);

                return (
                  <div
                    key={diff}
                    className="flex flex-col gap-3 rounded-2xl bg-cream/60 p-4 ring-1 ring-sand"
                  >
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <p className="text-xs text-charcoal-soft">{meta.description}</p>

                    {existing ? (
                      <>
                        <p className="text-sm font-semibold text-forest-900 line-clamp-2">
                          {existing.title}
                        </p>
                        <p className="text-xs text-charcoal-soft">
                          {existing.blocks.length} block{existing.blocks.length !== 1 ? "s" : ""}
                        </p>
                        <div className="mt-auto flex gap-2">
                          <button
                            onClick={() => setActivityModal({ diff, existing })}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-forest-300 bg-white px-3 py-1.5 text-sm font-semibold text-forest-700 hover:bg-forest-50 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(existing.id)}
                            className="p-1.5 text-clay-400 hover:text-clay-600"
                            aria-label="Delete activity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => setActivityModal({ diff })}
                        className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Build activity
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Activity builder modal */}
      {activityModal && (
        <ActivityBuilderModal
          open
          onClose={() => setActivityModal(null)}
          lessonId={lessonId}
          difficulty={activityModal.diff}
          existing={activityModal.existing}
          onSaved={handleActivitySaved}
        />
      )}
    </div>
  );
}
