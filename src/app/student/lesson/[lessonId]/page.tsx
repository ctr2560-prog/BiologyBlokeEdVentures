"use client";
/*
 * Immersive full-screen lesson feed (TikTok-style): one step per screen with a
 * story progress bar up top. Videos and quizzes advance the feed, and the
 * personalised worksheet is built and completed inline straight after the
 * final video/quiz — with a short "building" phase while it's picked.
 */
import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { Button, Badge, EmptyState } from "@/components/ui/primitives";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { VideoPlayerMock, type WatchSignals } from "@/components/media/VideoPlayerMock";
import { StudentBlockRenderer } from "../../activity/[activityId]/renderers";
import { filterBlocksForStudent } from "@/lib/activityRouting";
import { toSlidesEmbedUrl } from "@/lib/slides";
import { Film, HelpCircle, X, Sparkles, CheckCircle, Loader, Presentation, ChevronUp } from "lucide-react";
import {
  getLessonOrTopicItems,
  getTopic,
  getProgressByStudent,
  getActivityForVideoTags,
  getActivitiesForLesson,
  selectAdaptiveActivities,
  getStudentActivityResponse,
  upsertStudentActivityResponse,
  upsertProgress,
  logAnalyticsEvent,
  awardPoints,
} from "@/lib/supabaseService";
import { DEMO_STUDENT_ID } from "@/data/people";
import type {
  LessonItemWithContent, Activity, Video, Quiz, Topic,
  TaggedActivityBlock, BlockResponse,
} from "@/types";

type QuizScore = { quizId: string; score: number };
type WatchEntry = {
  tags: string[];
  watchTimeSeconds: number;
  completion: number;
  weight: number;
};
type WorksheetSection = { activity: Activity; blocks: TaggedActivityBlock[] };

export default function LessonPlayerPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const classId = currentUser?.classIds[0] ?? "";

  const [lesson, setLesson] = useState<Topic | null>(null);
  const [items, setItems] = useState<LessonItemWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [signals, setSignals] = useState<WatchSignals | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  // Per-question grading feedback returned from the server after submission
  const [quizResultDetails, setQuizResultDetails] = useState<Record<string, { correct: boolean; correctAnswer: string }>>({});
  const [topicActivity, setTopicActivity] = useState<Activity | null>(null);
  const [done, setDone] = useState(false);

  // Interest signals per watched video this session — feeds worksheet building.
  const [watchHistory, setWatchHistory] = useState<WatchEntry[]>([]);

  // Inline worksheet state
  const [wsSections, setWsSections] = useState<WorksheetSection[]>([]);
  const [wsResponses, setWsResponses] = useState<Record<string, BlockResponse[]>>({});
  const [wsReady, setWsReady] = useState(false);
  const [wsSubmitting, setWsSubmitting] = useState(false);
  const [wsCompleted, setWsCompleted] = useState(false);
  const buildStartedRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Swipe-to-advance state ────────────────────────────────────────────────
  // Auto-advance timer after quiz submit; cleared by advanceOrFinish.
  const autoNextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounce so trackpad momentum doesn't skip multiple steps at once.
  const wheelLockRef = useRef(0);
  const touchRef = useRef<{ y: number; atBottom: boolean } | null>(null);
  // Live watch signals from the video player, so a swipe mid-video can
  // record whatever was watched so far without pressing "Done watching".
  const liveSignalsRef = useRef<WatchSignals | null>(null);

  const atScrollBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 32;
  };

  useEffect(() => {
    Promise.all([
      getLessonOrTopicItems(lessonId, true),
      getTopic(lessonId),
      getProgressByStudent(studentId),
    ]).then(([lessonItems, topic]) => {
      setItems(lessonItems);
      setLesson(topic);
      setLoading(false);
    });
  }, [lessonId, studentId]);

  const currentItem = items[currentIndex] ?? null;
  const hasActivitySlot = items.some((i) => i.itemType === "activity");

  // Slide deck (Canva / Google Slides) shown as step 0 when attached
  const slidesEmbed = lesson?.slidesUrl ? toSlidesEmbedUrl(lesson.slidesUrl) : null;
  const hasSlides = Boolean(slidesEmbed);
  const [slidesDone, setSlidesDone] = useState(false);
  const onSlides = hasSlides && !slidesDone && !done;
  const totalSteps = items.length + (hasSlides ? 1 : 0);
  const displayStep = done
    ? totalSteps
    : onSlides
    ? 1
    : currentIndex + 1 + (hasSlides ? 1 : 0);

  const allVideoTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => {
      if (item.itemType === "video") item.video.tags.forEach((t) => tags.add(t));
    });
    return [...tags];
  }, [items]);

  const avgQuizScore = quizScores.length
    ? quizScores.reduce((sum, q) => sum + q.score, 0) / quizScores.length
    : null;

  // Scroll back to the top of the feed on every step change.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [currentIndex, done, slidesDone]);

  // ── Worksheet building — kicks in the moment the feed hits the slot ──────
  useEffect(() => {
    if (currentItem?.itemType !== "activity" || buildStartedRef.current) return;
    buildStartedRef.current = true;

    (async () => {
      const pool = await getActivitiesForLesson(lessonId);

      // Interest maps from this session's watch behaviour
      const interest: Record<string, number> = {};
      const watchTimeByTag: Record<string, number> = {};
      const completionByTag: Record<string, number> = {};
      watchHistory.forEach(({ tags, watchTimeSeconds, completion, weight }) =>
        tags.forEach((t) => {
          interest[t] = (interest[t] ?? 0) + weight;
          watchTimeByTag[t] = (watchTimeByTag[t] ?? 0) + watchTimeSeconds;
          completionByTag[t] = Math.max(completionByTag[t] ?? 0, completion);
        })
      );

      const picked = selectAdaptiveActivities(pool, avgQuizScore, interest);
      const quizScore = avgQuizScore ?? 50;
      const sections = picked
        .map((activity) => ({
          activity,
          blocks: filterBlocksForStudent(
            activity.blocks, quizScore, watchTimeByTag,
            activity.topicTags ?? [], completionByTag, {}
          ) as TaggedActivityBlock[],
        }))
        .filter((s) => s.blocks.length > 0);

      // Resume any saved answers
      const existing: Record<string, BlockResponse[]> = {};
      if (classId) {
        await Promise.all(
          sections.map(async (s) => {
            const resp = await getStudentActivityResponse(s.activity.id, studentId, classId);
            if (resp) existing[s.activity.id] = resp.responses;
          })
        );
      }

      if (sections.length > 0) {
        logAnalyticsEvent({
          userId: studentId,
          role: "student",
          eventType: "worksheet_served",
          classId,
          metadata: {
            activityIds: sections.map((s) => s.activity.id).join(","),
            difficulties: sections.map((s) => s.activity.difficulty).join(","),
            avgQuizScore: avgQuizScore ?? -1,
            topInterests: Object.entries(interest)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([tag]) => tag)
              .join(","),
          },
        });
      }

      // Small pause so the "building" moment reads, even on fast connections
      setTimeout(() => {
        setWsSections(sections);
        setWsResponses(existing);
        setWsReady(true);
      }, 1200);
    })();
  }, [currentItem, lessonId, watchHistory, avgQuizScore, studentId, classId]);

  // ── Video / quiz handlers ─────────────────────────────────────────────────

  const handleVideoComplete = (s: WatchSignals) => setSignals(s);

  const handleSaveVideoProgress = async (live?: WatchSignals) => {
    const sig = live ?? signals;
    if (!sig || !currentItem || currentItem.itemType !== "video") return;
    const video = currentItem.video as Video;
    setSaving(true);
    const weight =
      sig.completion / 100 +
      sig.replayCount * 0.25 +
      (sig.clickedCurious ? 0.5 : 0) +
      (sig.reaction === "like" ? 0.5 : sig.reaction === "dislike" ? -0.5 : 0) -
      (sig.skipped ? 0.5 : 0);
    setWatchHistory((prev) => [
      ...prev,
      {
        tags: video.tags,
        watchTimeSeconds: sig.watchTimeSeconds,
        completion: sig.completion,
        weight,
      },
    ]);
    try {
      await upsertProgress({
        studentId,
        classId,
        unitId: video.unitId,
        topicId: video.topicId,
        videoId: video.id,
        watchTimeSeconds: sig.watchTimeSeconds,
        videoCompletionPercentage: sig.completion,
        replayCount: sig.replayCount,
        skipped: sig.skipped,
        clickedCurious: sig.clickedCurious,
        clickedHelp: sig.clickedHelp,
        videoReaction: sig.reaction,
        quizScore: null,
        quizAttempts: 0,
        worksheetCompleted: false,
        adaptiveFocusArea: "core",
        engagementLevel: "medium",
        recommendedTaskType: "core",
        lastActive: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error("Failed to save video progress:", err);
    }
    logAnalyticsEvent({
      userId: studentId,
      role: "student",
      eventType: "video_completed",
      videoId: video.id,
      topicId: video.topicId,
      unitId: video.unitId,
      classId,
      metadata: { watchTimeSeconds: sig.watchTimeSeconds, completion: sig.completion },
    });
    await awardPoints(studentId, classId, "video_completed", video.id);
    if (sig.clickedCurious) {
      await awardPoints(studentId, classId, "curious_click", video.id);
    }
    setSaving(false);
    advanceOrFinish();
  };

  const handleSubmitQuiz = async () => {
    if (!currentItem || currentItem.itemType !== "quiz") return;
    const quiz = currentItem.quiz as Quiz;
    setSaving(true);
    try {
      const res = await fetch("/api/student/quiz-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, answers, studentId, classId, lessonId }),
      });
      const { score, results } = await res.json();
      setQuizScores((prev) => [...prev, { quizId: quiz.id, score }]);
      setQuizResultDetails(results ?? {});
      logAnalyticsEvent({
        userId: studentId,
        role: "student",
        eventType: "quiz_submitted",
        classId,
        metadata: { quizId: quiz.id, score },
      });
      if (score >= 80) {
        await awardPoints(studentId, classId, "quiz_ace", quiz.id);
      }
      setQuizSubmitted(true);
      // Show the marked answers briefly, then move on automatically.
      autoNextRef.current = setTimeout(() => advanceOrFinish(), 2000);
    } finally {
      setSaving(false);
    }
  };

  const advanceOrFinish = async () => {
    if (autoNextRef.current) {
      clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }
    setSignals(null);
    liveSignalsRef.current = null;
    setAnswers({});
    setQuizSubmitted(false);
    setQuizResultDetails({});
    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      // Legacy fallback for lessons without an adaptive step
      if (!hasActivitySlot && allVideoTags.length > 0) {
        const activity = await getActivityForVideoTags(allVideoTags);
        setTopicActivity(activity);
      }
      setDone(true);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  /*
   * What a swipe-up (or scroll past the end) does on the current step.
   * Returns null when the step isn't ready to advance — quizzes must be
   * submitted first, the worksheet must be submitted via its own button.
   */
  const swipeAction = (): (() => void) | null => {
    if (saving) return null;
    if (onSlides) return () => setSlidesDone(true);
    if (done) return null;
    if (currentItem?.itemType === "video") {
      // Swipe works mid-video: record whatever was watched so far. Skipping
      // early is a legitimate signal — it lowers that video's interest weight.
      const sig = signals ?? liveSignalsRef.current ?? {
        watchTimeSeconds: 0,
        completion: 0,
        replayCount: 0,
        skipped: true,
        clickedCurious: false,
        clickedHelp: false,
      };
      return () => handleSaveVideoProgress(sig);
    }
    if (currentItem?.itemType === "quiz" && quizSubmitted) return advanceOrFinish;
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { y: e.touches[0].clientY, atBottom: atScrollBottom() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start || !start.atBottom) return;
    const dy = start.y - e.changedTouches[0].clientY;
    if (dy < 70) return; // Not a deliberate upward swipe
    swipeAction()?.();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 60 || !atScrollBottom()) return;
    const now = Date.now();
    if (now - wheelLockRef.current < 900) return;
    const act = swipeAction();
    if (act) {
      wheelLockRef.current = now;
      act();
    }
  };

  // ── Worksheet handlers ────────────────────────────────────────────────────

  const updateWsResponse = (activityId: string) => (r: BlockResponse) => {
    setWsResponses((prev) => {
      const next = [...(prev[activityId] ?? []).filter((x) => x.blockId !== r.blockId), r];
      if (classId) {
        upsertStudentActivityResponse({
          activityId, studentId, classId, responses: next,
        }).catch(console.error);
      }
      return { ...prev, [activityId]: next };
    });
  };

  const handleSubmitWorksheet = async () => {
    setWsSubmitting(true);
    for (const s of wsSections) {
      if (classId) {
        try {
          await upsertStudentActivityResponse({
            activityId: s.activity.id,
            studentId,
            classId,
            responses: wsResponses[s.activity.id] ?? [],
            submittedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.error(e);
        }
      }
      await awardPoints(studentId, classId || null, "activity_completed", s.activity.id);
    }
    logAnalyticsEvent({
      userId: studentId,
      role: "student",
      eventType: "worksheet_submitted",
      classId,
      metadata: { lessonId, activityIds: wsSections.map((s) => s.activity.id).join(",") },
    });
    setWsSubmitting(false);
    setWsCompleted(true);
    advanceOrFinish();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950">
        <Loader className="h-8 w-8 animate-spin text-forest-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Lesson not found"
        message="This lesson has no content yet."
        action={
          <Link href="/student/classwork">
            <Button>Back to class work</Button>
          </Link>
        }
      />
    );
  }

  const stepIcon = (item: LessonItemWithContent) =>
    item.itemType === "video" ? Film : item.itemType === "quiz" ? HelpCircle : Sparkles;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "linear-gradient(175deg, #0d2419 0%, #14352a 55%, #1b4332 100%)" }}
    >
      {/* ── Top bar: close + story progress ── */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/student/classwork"
            aria-label="Exit lesson"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-cream backdrop-blur transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Link>
          <div className="flex flex-1 items-center gap-1.5">
            {hasSlides && (
              <div className="flex flex-1 items-center gap-1.5">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    slidesDone || done ? "bg-gold-400" : "bg-cream"
                  }`}
                />
                <Presentation
                  className={`h-3.5 w-3.5 shrink-0 ${
                    slidesDone || done ? "text-gold-400" : "text-cream"
                  }`}
                  aria-hidden
                />
              </div>
            )}
            {items.map((item, i) => {
              const Icon = stepIcon(item);
              const isDone = done || (!onSlides && i < currentIndex);
              const isCurrent = !done && !onSlides && i === currentIndex;
              return (
                <div key={i} className="flex flex-1 items-center gap-1.5">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      isDone ? "bg-gold-400" : isCurrent ? "bg-cream" : "bg-white/15"
                    }`}
                  />
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isDone ? "text-gold-400" : isCurrent ? "text-cream" : "text-white/25"
                    }`}
                    aria-hidden
                  />
                </div>
              );
            })}
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-white/50">
            {displayStep}/{totalSteps}
          </span>
        </div>
        {lesson && (
          <div className="mx-auto mt-2 flex max-w-2xl items-center gap-2">
            <Image
              src="/edventra-white.png"
              alt="Edventra"
              width={472}
              height={119}
              className="h-4 w-auto opacity-60"
            />
            <span className="text-white/20">·</span>
            <p className="min-w-0 truncate text-xs font-semibold text-white/40">{lesson.title}</p>
          </div>
        )}
      </div>

      {/* ── Feed ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          key={done ? "done" : onSlides ? "slides" : currentIndex}
          className="rise-in mx-auto max-w-2xl px-4 pb-24 pt-2"
        >

          {/* ── Slides slide ── */}
          {onSlides ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                  <Presentation className="h-4 w-4 text-gold-400" aria-hidden />
                </span>
                <h2 className="display font-bold text-cream">Lesson slides</h2>
              </div>

              <div className="overflow-hidden rounded-3xl shadow-hero ring-1 ring-white/10">
                <iframe
                  src={slidesEmbed!}
                  className="aspect-video w-full bg-forest-950"
                  allow="fullscreen"
                />
              </div>
              <p className="text-center text-xs text-forest-100/60">
                Click through the slides, then keep going when you&apos;re ready.
              </p>

              <div className="sticky bottom-4 pt-2">
                <button
                  onClick={() => setSlidesDone(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-4 text-base font-bold text-forest-950 shadow-hero transition-transform hover:scale-[1.01]"
                >
                  Keep going →
                </button>
              </div>
            </div>
          ) : done ? (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
              <p className="text-7xl">🎉</p>
              <div>
                <h2 className="display text-3xl font-bold text-cream">Lesson complete!</h2>
                <p className="mt-2 text-forest-100/70">
                  Great work, {currentUser?.name?.split(" ")[0] ?? "Explorer"}!
                </p>
              </div>

              {quizScores.length > 0 && (
                <div className="w-full max-w-sm rounded-3xl bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/50">Quiz results</p>
                  <div className="mt-3 space-y-2">
                    {quizScores.map((qs, i) => (
                      <div key={qs.quizId} className="flex items-center justify-between">
                        <span className="text-sm text-cream">Quiz {i + 1}</span>
                        <Badge tone={qs.score >= 80 ? "gold" : "sand"}>{qs.score}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wsCompleted && (
                <div className="flex items-center gap-2 rounded-full bg-gold-400/20 px-4 py-2 text-sm font-semibold text-gold-300">
                  <CheckCircle className="h-4 w-4" aria-hidden /> Personalised worksheet submitted
                </div>
              )}

              {topicActivity && (
                <Link href={`/student/activity/${topicActivity.id}${avgQuizScore !== null ? `?score=${Math.round(avgQuizScore)}` : ""}`} className="w-full max-w-sm">
                  <Button className="w-full" size="lg">Start your activity →</Button>
                </Link>
              )}

              <Link href="/student/classwork" className="w-full max-w-sm">
                <Button variant="secondary" className="w-full" size="lg">Back to class work</Button>
              </Link>
            </div>
          ) : currentItem?.itemType === "video" ? (
            /* ── Video slide ── */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                  <Film className="h-4 w-4 text-gold-400" aria-hidden />
                </span>
                <h2 className="display font-bold text-cream">{currentItem.video.title}</h2>
              </div>

              {currentItem.video.muxPlaybackId ? (
                <VideoPlayer
                  video={currentItem.video}
                  onComplete={handleVideoComplete}
                  liveSignalsRef={liveSignalsRef}
                  showDoneButton={false}
                />
              ) : (
                <VideoPlayerMock video={currentItem.video} onComplete={handleVideoComplete} liveSignalsRef={liveSignalsRef} />
              )}
            </div>
          ) : currentItem?.itemType === "quiz" ? (
            /* ── Quiz slide ── */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                  <HelpCircle className="h-4 w-4 text-gold-400" aria-hidden />
                </span>
                <h2 className="display font-bold text-cream">{currentItem.quiz.title}</h2>
              </div>

              {currentItem.quiz.questions.map((q, i) => (
                <div key={q.id} className="rounded-3xl bg-white p-5 shadow-soft">
                  <p className="font-semibold text-forest-900">
                    {i + 1}. {q.questionText}
                  </p>
                  {q.type === "shortResponse" ? (
                    <textarea
                      className="mt-3 w-full rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
                      rows={2}
                      disabled={quizSubmitted}
                      placeholder="Type your answer…"
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    />
                  ) : (
                    <div className="mt-3 space-y-2">
                      {q.options.map((opt) => {
                        const selected = answers[q.id] === opt;
                        const result = quizResultDetails[q.id];
                        const correct = quizSubmitted && result != null && opt === result.correctAnswer;
                        const wrong = quizSubmitted && selected && result != null && !result.correct && opt !== result.correctAnswer;
                        return (
                          <button
                            key={opt}
                            disabled={quizSubmitted}
                            onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                            className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-sm transition-colors ${
                              wrong
                                ? "border-clay-400 bg-clay-400/10 text-clay-600"
                                : correct
                                ? "border-forest-500 bg-forest-50 font-semibold text-forest-900"
                                : selected
                                ? "border-forest-600 bg-forest-50 font-semibold text-forest-900"
                                : "border-sand hover:border-forest-400"
                            }`}
                          >
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                                selected && !wrong ? "border-forest-600 bg-forest-600 text-white" : "border-sand-dark"
                              }`}
                            />
                            {opt}
                            {correct && !selected && <span className="ml-auto text-xs text-forest-600">✓ Correct</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              <div className="sticky bottom-4 pt-2">
                {!quizSubmitted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={saving || Object.keys(answers).length < currentItem.quiz.questions.length}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-4 text-base font-bold text-forest-950 shadow-hero transition-transform hover:scale-[1.01] disabled:opacity-40"
                  >
                    {saving ? <><Loader className="h-4 w-4 animate-spin" /> Marking…</> : "Submit answers"}
                  </button>
                ) : (
                  <button
                    onClick={advanceOrFinish}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-4 text-base font-bold text-forest-950 shadow-hero transition-transform hover:scale-[1.01]"
                  >
                    Keep going →
                  </button>
                )}
              </div>
            </div>
          ) : currentItem?.itemType === "activity" ? (
            /* ── Worksheet slide ── */
            !wsReady ? (
              /* Building phase */
              <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
                <div className="relative">
                  <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/20" />
                  <span className="relative grid h-20 w-20 place-items-center rounded-full bg-white/10 text-4xl backdrop-blur">
                    🔍
                  </span>
                </div>
                <h2 className="display text-2xl font-bold text-cream">Building your Edventure…</h2>
                <p className="max-w-xs text-sm text-forest-100/70">
                  Picking activities just for you, based on what you watched and how you went in the quizzes.
                </p>
                <Loader className="h-5 w-5 animate-spin text-gold-400" aria-hidden />
              </div>
            ) : wsSections.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-forest-100/70">No activities available for this lesson yet.</p>
                <button
                  onClick={advanceOrFinish}
                  className="rounded-full bg-gold-400 px-8 py-3 text-sm font-bold text-forest-950"
                >
                  Finish lesson →
                </button>
              </div>
            ) : (
              /* Inline personalised worksheet */
              <div className="space-y-5">
                <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold-400" aria-hidden />
                    <p className="text-xs font-bold uppercase tracking-widest text-gold-300">
                      Made just for you
                    </p>
                  </div>
                  <h2 className="display mt-1 text-2xl font-bold text-cream">Your worksheet</h2>
                  <p className="mt-1 text-sm text-forest-100/70">
                    {wsSections.length} activit{wsSections.length !== 1 ? "ies" : "y"} picked from your
                    interests and quiz results. Answers save automatically.
                  </p>
                </div>

                {wsSections.map((section, si) => (
                  <section key={section.activity.id} className="space-y-3">
                    <div className="flex items-center gap-3 pt-1">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-400 text-sm font-bold text-forest-950">
                        {si + 1}
                      </span>
                      <h3 className="display min-w-0 flex-1 truncate text-lg font-bold text-cream">
                        {section.activity.title}
                      </h3>
                    </div>
                    {section.blocks.map((block, bi) => (
                      <StudentBlockRenderer
                        key={block.id}
                        block={block}
                        index={bi}
                        response={(wsResponses[section.activity.id] ?? []).find((r) => r.blockId === block.id)}
                        onChange={updateWsResponse(section.activity.id)}
                        submitted={false}
                      />
                    ))}
                  </section>
                ))}

                <div className="sticky bottom-4 pt-2">
                  <button
                    onClick={handleSubmitWorksheet}
                    disabled={wsSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-4 text-base font-bold text-forest-950 shadow-hero transition-transform hover:scale-[1.01] disabled:opacity-60"
                  >
                    {wsSubmitting ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" /> Submit worksheet
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          ) : null}

          {/* Swipe hint — shown whenever the current step is ready to advance */}
          {swipeAction() && (
            <div className="pointer-events-none mt-8 flex flex-col items-center gap-1 text-forest-100/50">
              <ChevronUp className="float-y-fast h-5 w-5" aria-hidden />
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest">
                Swipe up for the next step
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
