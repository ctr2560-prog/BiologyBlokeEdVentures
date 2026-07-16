"use client";
import { useCallback, useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/primitives";
import { useRouter } from "next/navigation";
import {
  getTopic, getLessonItems,
  addItemToLesson, removeLessonItem, reorderLessonItems,
  setLessonFeatured, setLessonSlides, deleteTopic, setTopicMeta,
} from "@/lib/supabaseService";
import { toSlidesEmbedUrl } from "@/lib/slides";
import { CoverImageControl } from "@/components/forms/CoverImageControl";
import {
  ArrowLeft, Film, CircleHelp, ChevronUp, ChevronDown,
  Trash2, Loader, BookOpen, Plus, Check, PenLine, Sparkles, Search, X, Star,
  Presentation, Eye, EyeOff, Image as ImageIcon,
} from "lucide-react";
import type {
  Topic, Video, Quiz, LessonItemWithContent, Subject, Stage,
} from "@/types";
import { SUBJECTS } from "@/types";

type LibraryActivity = { id: string; title: string; difficulty: string; lesson_id: string | null; blocks: unknown[] };

type LibraryTab = "videos" | "quizzes" | "resources";

// ── Lesson slides card (Canva / Google Slides embed) ──────────────────────────

function LessonSlidesCard({
  lessonId,
  initialUrl,
}: {
  lessonId: string;
  initialUrl: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [draft, setDraft] = useState(initialUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const embedUrl = url ? toSlidesEmbedUrl(url) : null;

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed && !toSlidesEmbedUrl(trimmed)) {
      setError("That doesn't look like a Canva or Google Slides link.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await setLessonSlides(lessonId, trimmed);
      setUrl(trimmed);
      if (!trimmed) setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="display flex items-center gap-2 text-lg font-bold text-forest-900">
            <Presentation className="h-5 w-5 text-forest-600" aria-hidden /> Lesson slides
          </h2>
          <p className="text-sm text-charcoal-soft">
            Paste a Canva or Google Slides link — students see it as the first step, and
            teachers can present it to the class.
          </p>
        </div>
        {embedUrl && (
          <button
            onClick={() => setShowPreview((p) => !p)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-sand-dark bg-white px-3 py-1.5 text-xs font-bold text-charcoal transition-colors hover:bg-cream"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Hide preview" : "Preview"}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setError(""); }}
          placeholder="https://www.canva.com/design/…/view  or  https://docs.google.com/presentation/…"
          className="flex-1 rounded-2xl border border-sand bg-cream/50 px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-forest-400 focus:bg-white focus:outline-none transition-colors"
        />
        <button
          onClick={save}
          disabled={saving || draft.trim() === url}
          className="shrink-0 rounded-full bg-forest-700 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-forest-800 disabled:opacity-40"
        >
          {saving ? "Saving…" : url && !draft.trim() ? "Remove" : "Save"}
        </button>
      </div>

      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-2.5 text-xs font-medium text-clay-600">{error}</p>
      )}
      {url && !error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-forest-700">
          <Check className="h-3.5 w-3.5" aria-hidden /> Slides attached — shown before the first video.
        </p>
      )}

      {showPreview && embedUrl && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-sand">
          <iframe
            src={embedUrl}
            className="aspect-video w-full"
            allow="fullscreen"
            loading="lazy"
          />
        </div>
      )}
    </section>
  );
}

const tabMeta: Record<LibraryTab, { label: string; Icon: typeof Film; activeText: string }> = {
  videos:    { label: "Videos",    Icon: Film,       activeText: "text-forest-700" },
  quizzes:   { label: "Quizzes",   Icon: CircleHelp, activeText: "text-mist-600" },
  resources: { label: "Resources", Icon: PenLine,    activeText: "text-clay-600" },
};

export default function LessonBuilderPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const router = useRouter();

  const [lesson, setLesson]         = useState<Topic | null>(null);
  const [items, setItems]           = useState<LessonItemWithContent[]>([]);
  const [allVideos, setAllVideos]       = useState<Video[]>([]);
  const [allQuizzes, setAllQuizzes]     = useState<Quiz[]>([]);
  const [allActivities, setAllActivities] = useState<LibraryActivity[]>([]);
  const [linkError, setLinkError]       = useState("");
  const [loading, setLoading]       = useState(true);

  const [libraryTab, setLibraryTab] = useState<LibraryTab>("videos");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const [topicData, itemsData, libraryData] =
      await Promise.all([
        getTopic(lessonId),
        getLessonItems(lessonId),
        fetch(`/api/admin/lesson/${lessonId}/library`).then((r) => r.json()),
      ]);
    setLesson(topicData);
    setItems(itemsData);
    setAllVideos(libraryData.videos ?? []);
    setAllQuizzes(libraryData.quizzes ?? []);
    setAllActivities(libraryData.activities ?? []);
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

  const hasActivitySlot = items.some((i) => i.itemType === "activity");

  const handleAddActivitySlot = async () => {
    if (hasActivitySlot) return;
    const item = await addItemToLesson(lessonId, "activity", "adaptive", items.length);
    setItems((prev) => [...prev, { ...item, itemType: "activity" as const }]);
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

  const handleToggleFeatured = async () => {
    if (!lesson) return;
    const next = !lesson.featured;
    setLesson({ ...lesson, featured: next });
    try {
      await setLessonFeatured(lesson.id, next);
    } catch {
      setLesson({ ...lesson, featured: !next });
    }
  };

  const handleMetaChange = async (fields: { subject?: Subject; stage?: Stage }) => {
    if (!lesson) return;
    const prev = lesson;
    setLesson({ ...lesson, ...fields });
    try {
      await setTopicMeta(lesson.id, fields);
    } catch {
      setLesson(prev);
    }
  };

  const handleDeleteLesson = async () => {
    if (!lesson) return;
    if (!confirm(`Delete lesson "${lesson.title}"? Its sequence and linked activities go with it. This cannot be undone.`)) return;
    try {
      await deleteTopic(lesson.id);
      router.push("/admin/content");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  // ── Activity actions ──────────────────────────────────────────────────────

  const handleLinkActivity = async (activity: LibraryActivity) => {
    setLinkError("");
    const res = await fetch("/api/admin/activity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activity.id, lessonId }),
    });
    const data = await res.json();
    if (!res.ok) { setLinkError(data.error ?? "Failed to link activity"); return; }
    setAllActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, lesson_id: lessonId } : a))
    );
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

  const videoCount    = items.filter((i) => i.itemType === "video").length;
  const quizCount     = items.filter((i) => i.itemType === "quiz").length;
  const linkedActivityCount = allActivities.filter((a) => a.lesson_id === lessonId).length;

  const query = search.trim().toLowerCase();
  const matches = (title: string) => !query || title.toLowerCase().includes(query);
  const filteredVideos     = allVideos.filter((v) => matches(v.title));
  const filteredQuizzes    = allQuizzes.filter((q) => matches(q.title));
  const filteredActivities = allActivities.filter((a) => matches(a.title));

  const tabCounts: Record<LibraryTab, number> = {
    videos: allVideos.length,
    quizzes: allQuizzes.length,
    resources: allActivities.length,
  };

  return (
    <div className="flex min-h-0 flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to content
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
            <select
              value={lesson.subject}
              onChange={(e) => handleMetaChange({ subject: e.target.value as Subject })}
              className="rounded-full border border-sand bg-white px-3 py-1.5 text-xs font-semibold text-forest-800 focus:border-forest-400 focus:outline-none"
              title="Learning area"
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={lesson.stage}
              onChange={(e) => handleMetaChange({ stage: e.target.value as Stage })}
              className="rounded-full border border-sand bg-white px-3 py-1.5 text-xs font-semibold text-forest-800 focus:border-forest-400 focus:outline-none"
              title="Stage"
            >
              {(["Stage 3", "Stage 4", "Stage 5"] as Stage[]).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleToggleFeatured}
              title={lesson.featured ? "Remove from featured" : "Feature on teacher dashboard"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all ${
                lesson.featured
                  ? "bg-gold-300/40 text-clay-600 ring-gold-400/60"
                  : "bg-white text-charcoal-soft ring-sand hover:bg-gold-300/20 hover:text-clay-600 hover:ring-gold-400/50"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${lesson.featured ? "fill-gold-500 text-gold-500" : ""}`} aria-hidden />
              {lesson.featured ? "Featured" : "Feature"}
            </button>
            <button
              onClick={handleDeleteLesson}
              title="Delete this lesson"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-soft ring-1 ring-sand transition-all hover:bg-clay-400/10 hover:text-clay-600 hover:ring-clay-400/40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
            </button>
          </div>
          {lesson.description && (
            <p className="mt-1 text-sm text-charcoal-soft">{lesson.description}</p>
          )}
        </div>

        {/* At-a-glance chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700 ring-1 ring-forest-100">
            <Film className="h-3.5 w-3.5" aria-hidden /> {videoCount} video{videoCount !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mist-100/60 px-3 py-1.5 text-xs font-semibold text-mist-600 ring-1 ring-mist-400/40">
            <CircleHelp className="h-3.5 w-3.5" aria-hidden /> {quizCount} quiz{quizCount !== 1 ? "zes" : ""}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
            hasActivitySlot
              ? "bg-gold-300/25 text-clay-600 ring-gold-400/50"
              : "bg-cream text-charcoal-soft/60 ring-sand"
          }`}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> {hasActivitySlot ? "Adaptive worksheet on" : "No worksheet yet"}
          </span>
        </div>
      </div>

      {/* Two-column builder */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* ── Left library panel ────────────────────────────────────────── */}
        <aside className="w-full shrink-0 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5 lg:sticky lg:top-6 lg:w-[21rem]">
          {/* Panel header */}
          <div className="border-b border-sand/70 px-4 pb-3 pt-4">
            <p className="text-sm font-bold text-forest-900">Content library</p>
            <p className="mt-0.5 text-xs text-charcoal-soft">Click an item to add it to this lesson.</p>

            {/* Tab bar */}
            <div className="mt-3 flex gap-1 rounded-2xl bg-cream p-1">
              {(Object.keys(tabMeta) as LibraryTab[]).map((id) => {
                const { label, Icon, activeText } = tabMeta[id];
                const active = libraryTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setLibraryTab(id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                      active
                        ? `bg-white shadow-sm ${activeText}`
                        : "text-charcoal-soft hover:text-charcoal"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none ${
                      active ? "bg-cream text-charcoal" : "bg-sand text-charcoal-soft"
                    }`}>
                      {tabCounts[id]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft/50" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${tabMeta[libraryTab].label.toLowerCase()}…`}
                className="w-full rounded-2xl border border-sand bg-cream/50 py-2 pl-10 pr-9 text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-forest-400 focus:bg-white focus:outline-none transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-charcoal-soft/50 hover:bg-sand hover:text-charcoal"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {libraryTab === "resources" && (
              <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-charcoal-soft">
                <Check className="h-3 w-3 text-forest-600" aria-hidden />
                {linkedActivityCount} linked to this lesson — these feed the adaptive worksheet
              </p>
            )}
          </div>

          {/* Tab content */}
          <div className="overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 330px)" }}>

            {/* ── Videos ── */}
            {libraryTab === "videos" && (
              allVideos.length === 0 ? (
                <EmptyLibrary
                  icon={<Film className="h-7 w-7 text-sand-dark" />}
                  message="No videos yet."
                  cta={{ label: "Upload videos", href: "/admin/videos" }}
                />
              ) : filteredVideos.length === 0 ? (
                <NoMatches query={search} />
              ) : (
                <ul className="space-y-2">
                  {filteredVideos.map((v) => {
                    const added = addedVideoIds.has(v.id);
                    const thumb = v.muxPlaybackId
                      ? `https://image.mux.com/${v.muxPlaybackId}/thumbnail.jpg?width=160&height=90&fit_mode=smartcrop`
                      : null;
                    return (
                      <li key={v.id}>
                        <button
                          onClick={() => handleAddVideo(v)}
                          disabled={added}
                          className={`group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all ${
                            added
                              ? "bg-forest-50 ring-1 ring-forest-100"
                              : "ring-1 ring-transparent hover:bg-cream hover:ring-sand hover:shadow-sm"
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative h-11 w-[4.9rem] shrink-0 overflow-hidden rounded-xl bg-charcoal/10">
                            {thumb ? (
                              <Image src={thumb} alt="" fill className="object-cover" />
                            ) : (
                              <Film className="absolute inset-0 m-auto h-4 w-4 text-charcoal-soft/40" />
                            )}
                          </div>
                          {/* Meta */}
                          <div className="min-w-0 flex-1">
                            <p className={`line-clamp-2 text-[13px] font-semibold leading-snug ${added ? "text-forest-800" : "text-charcoal"}`}>
                              {v.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-charcoal-soft">
                              {v.muxPlaybackId ? "Ready to play" : v.muxUploadId ? "Processing…" : "No file"}
                            </p>
                          </div>
                          {/* Status icon */}
                          {added ? (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest-600 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream text-charcoal-soft/60 ring-1 ring-sand transition-colors group-hover:bg-forest-600 group-hover:text-white group-hover:ring-forest-600">
                              <Plus className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )
            )}

            {/* ── Quizzes ── */}
            {libraryTab === "quizzes" && (
              allQuizzes.length === 0 ? (
                <EmptyLibrary
                  icon={<CircleHelp className="h-7 w-7 text-sand-dark" />}
                  message="No quizzes yet."
                  cta={{ label: "Create a quiz", href: "/admin/quizzes" }}
                />
              ) : filteredQuizzes.length === 0 ? (
                <NoMatches query={search} />
              ) : (
                <ul className="space-y-2">
                  {filteredQuizzes.map((q) => {
                    const added = addedQuizIds.has(q.id);
                    return (
                      <li key={q.id}>
                        <button
                          onClick={() => handleAddQuiz(q)}
                          disabled={added}
                          className={`group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all ${
                            added
                              ? "bg-mist-100/50 ring-1 ring-mist-400/50"
                              : "ring-1 ring-transparent hover:bg-cream hover:ring-sand hover:shadow-sm"
                          }`}
                        >
                          {/* Icon box */}
                          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                            added ? "bg-mist-100" : "bg-mist-100/50"
                          }`}>
                            <CircleHelp className="h-5 w-5 text-mist-600" />
                          </div>
                          {/* Meta */}
                          <div className="min-w-0 flex-1">
                            <p className={`line-clamp-2 text-[13px] font-semibold leading-snug ${added ? "text-mist-600" : "text-charcoal"}`}>
                              {q.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-charcoal-soft">
                              {q.questions.length} question{q.questions.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {added ? (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mist-600 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream text-charcoal-soft/60 ring-1 ring-sand transition-colors group-hover:bg-mist-600 group-hover:text-white group-hover:ring-mist-600">
                              <Plus className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )
            )}

            {/* ── Resources (Activity Library) ── */}
            {libraryTab === "resources" && (
              <>
                {linkError && (
                  <p className="mb-2 rounded-xl bg-clay-400/10 px-3 py-2 text-xs font-medium text-clay-600">
                    {linkError}
                  </p>
                )}
                {allActivities.length === 0 ? (
                  <EmptyLibrary
                    icon={<PenLine className="h-7 w-7 text-sand-dark" />}
                    message="No activities yet."
                    cta={{ label: "Build an activity", href: "/admin/resources" }}
                  />
                ) : filteredActivities.length === 0 ? (
                  <NoMatches query={search} />
                ) : (
                  <ul className="space-y-2">
                    {filteredActivities.map((a) => {
                      const linkedHere = a.lesson_id === lessonId;
                      const usedElsewhere = a.lesson_id !== null && !linkedHere;
                      const diffTone =
                        a.difficulty === "foundation" ? "clay"
                        : a.difficulty === "advanced" ? "mist"
                        : "forest";
                      return (
                        <li key={a.id}>
                          <div className={`flex items-center gap-3 rounded-2xl p-2.5 ring-1 transition-all ${
                            linkedHere
                              ? "bg-forest-50 ring-forest-100"
                              : usedElsewhere
                              ? "bg-cream/40 ring-sand opacity-55"
                              : "ring-transparent hover:bg-cream hover:ring-sand hover:shadow-sm"
                          }`}>
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-300/30">
                              <PenLine className="h-5 w-5 text-clay-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-charcoal">
                                {a.title}
                              </p>
                              <div className="mt-1 flex items-center gap-1.5">
                                <Badge tone={diffTone as "clay" | "forest" | "mist"}>
                                  {a.difficulty}
                                </Badge>
                                <span className="text-[11px] text-charcoal-soft">
                                  {a.blocks.length} block{a.blocks.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                            {linkedHere ? (
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest-600 text-white">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            ) : usedElsewhere ? (
                              <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-charcoal-soft">
                                In use
                              </span>
                            ) : (
                              <button
                                onClick={() => handleLinkActivity(a)}
                                className="shrink-0 rounded-full bg-forest-700 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-forest-800"
                              >
                                Link
                              </button>
                            )}
                          </div>
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
        <div className="min-w-0 flex-1 space-y-6">

          {/* Cover image for teacher library cards */}
          <section className="space-y-3 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
            <div>
              <h2 className="display flex items-center gap-2 text-lg font-bold text-forest-900">
                <ImageIcon className="h-5 w-5 text-forest-600" aria-hidden /> Cover image
              </h2>
              <p className="text-sm text-charcoal-soft">
                Shown on this lesson&apos;s card in the teacher library and dashboard.
              </p>
            </div>
            <CoverImageControl kind="lesson" id={lessonId} initialUrl={lesson.coverImage} />
          </section>

          {/* Lesson slides */}
          <LessonSlidesCard lessonId={lessonId} initialUrl={lesson.slidesUrl} />

          {/* Content sequence */}
          <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
            <div>
              <h2 className="display text-lg font-bold text-forest-900">Lesson flow</h2>
              <p className="text-sm text-charcoal-soft">
                Students work through these steps in order. Use the arrows to rearrange.
              </p>
            </div>

            {items.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 px-6 py-12 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-forest-50">
                  <BookOpen className="h-7 w-7 text-forest-400" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-charcoal">Start building your lesson</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-charcoal-soft">
                  Pick videos and quizzes from the content library — a good lesson alternates a short
                  video with a quick quiz checkpoint.
                </p>
              </div>
            ) : (
              <ol className="space-y-2.5">
                {items.map((item, i) => {
                  const isVideo = item.itemType === "video";
                  const isQuiz  = item.itemType === "quiz";
                  const thumb = isVideo && item.video.muxPlaybackId
                    ? `https://image.mux.com/${item.video.muxPlaybackId}/thumbnail.jpg?width=160&height=90&fit_mode=smartcrop`
                    : null;
                  return (
                    <li
                      key={item.id}
                      className={`group flex items-center gap-3.5 rounded-2xl px-4 py-3 ring-1 transition-all hover:shadow-sm ${
                        isVideo ? "bg-white ring-sand hover:ring-forest-400"
                        : isQuiz ? "bg-white ring-sand hover:ring-mist-400"
                        : "bg-gradient-to-r from-gold-300/20 to-transparent ring-gold-400/50"
                      }`}
                    >
                      {/* Step number */}
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        isVideo ? "bg-forest-100 text-forest-700"
                        : isQuiz ? "bg-mist-100 text-mist-600"
                        : "bg-gold-400/80 text-forest-950"
                      }`}>
                        {i + 1}
                      </span>

                      {/* Visual */}
                      {isVideo ? (
                        <div className="relative hidden h-11 w-[4.9rem] shrink-0 overflow-hidden rounded-xl bg-charcoal/10 sm:block">
                          {thumb ? (
                            <Image src={thumb} alt="" fill className="object-cover" />
                          ) : (
                            <Film className="absolute inset-0 m-auto h-4 w-4 text-charcoal-soft/40" />
                          )}
                        </div>
                      ) : (
                        <div className={`hidden h-11 w-11 shrink-0 place-items-center rounded-xl sm:grid ${
                          isQuiz ? "bg-mist-100/60" : "bg-gold-300/30"
                        }`}>
                          {isQuiz
                            ? <CircleHelp className="h-5 w-5 text-mist-600" aria-hidden />
                            : <Sparkles className="h-5 w-5 text-clay-600" aria-hidden />}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-charcoal">
                          {isVideo ? item.video.title : isQuiz ? item.quiz.title : "Adaptive worksheet"}
                        </p>
                        <p className="line-clamp-1 text-xs text-charcoal-soft">
                          {isVideo
                            ? item.video.muxPlaybackId
                              ? "Ready to play"
                              : item.video.muxUploadId
                              ? "Processing…"
                              : "No file uploaded"
                            : isQuiz
                            ? `${item.quiz.questions.length} question${item.quiz.questions.length !== 1 ? "s" : ""} · quick checkpoint`
                            : `3-4 activities per student, picked from ${linkedActivityCount} linked resource${linkedActivityCount !== 1 ? "s" : ""}`}
                        </p>
                      </div>

                      <Badge tone={isVideo ? "forest" : isQuiz ? "mist" : "gold"}>
                        {isVideo ? "Video" : isQuiz ? "Quiz" : "Adaptive"}
                      </Badge>

                      {/* Controls */}
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => handleMove(i, -1)}
                          disabled={i === 0}
                          className="rounded-lg p-1.5 text-charcoal-soft transition-colors hover:bg-forest-50 hover:text-forest-700 disabled:opacity-20 disabled:hover:bg-transparent"
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMove(i, 1)}
                          disabled={i === items.length - 1}
                          className="rounded-lg p-1.5 text-charcoal-soft transition-colors hover:bg-forest-50 hover:text-forest-700 disabled:opacity-20 disabled:hover:bg-transparent"
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="rounded-lg p-1.5 text-clay-400 transition-colors hover:bg-clay-400/10 hover:text-clay-600"
                          aria-label="Remove from lesson"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {!hasActivitySlot && (
              <button
                onClick={handleAddActivitySlot}
                className="flex w-full items-center gap-3.5 rounded-2xl border-2 border-dashed border-gold-400/60 bg-gold-300/15 px-4 py-3.5 text-left transition-colors hover:border-gold-500 hover:bg-gold-300/25"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-400/80">
                  <Sparkles className="h-4 w-4 text-forest-950" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-charcoal">Add adaptive worksheet step</span>
                  <span className="block text-xs text-charcoal-soft">
                    Each student gets a worksheet of 3-4 activities from this lesson&apos;s resources —
                    quiz scores pick the difficulty, watch time and video tags pick the topics.
                  </span>
                </span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/70 text-clay-600 ring-1 ring-gold-400/50">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
              </button>
            )}

            {hasActivitySlot && linkedActivityCount === 0 && (
              <p className="rounded-2xl bg-gold-300/20 px-4 py-3 text-xs font-medium text-charcoal-soft ring-1 ring-gold-400/40">
                The adaptive worksheet step needs resources to choose from — link activities in the{" "}
                <button onClick={() => setLibraryTab("resources")} className="font-bold text-forest-700 hover:underline">
                  Resources tab
                </button>{" "}
                (aim for a spread of difficulties and topic tags).
              </p>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

function NoMatches({ query }: { query: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-xs text-charcoal-soft">
        Nothing matches “{query}”.
      </p>
    </div>
  );
}

function EmptyLibrary({
  icon,
  message,
  cta,
}: {
  icon: React.ReactNode;
  message: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-sand">
        {icon}
      </div>
      <p className="text-xs text-charcoal-soft">{message}</p>
      <Link
        href={cta.href}
        className="mt-2 inline-block text-xs font-semibold text-forest-700 hover:underline"
      >
        {cta.label} →
      </Link>
    </div>
  );
}
