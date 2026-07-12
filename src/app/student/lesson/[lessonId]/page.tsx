"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button, Badge, EmptyState } from "@/components/ui/primitives";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { VideoPlayerMock, type WatchSignals } from "@/components/media/VideoPlayerMock";
import { Film, HelpCircle, CheckCircle2 } from "lucide-react";
import {
  getLessonOrTopicItems,
  getProgressByStudent,
  getActivityForVideoTags,
  upsertProgress,
  logAnalyticsEvent,
  awardPoints,
} from "@/lib/supabaseService";
import { DEMO_STUDENT_ID } from "@/data/people";
import type { LessonItemWithContent, Activity, Video, Quiz } from "@/types";

type QuizScore = { quizId: string; score: number };

export default function LessonPlayerPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const classId = currentUser?.classIds[0] ?? "";

  const [items, setItems] = useState<LessonItemWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [signals, setSignals] = useState<WatchSignals | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [topicActivity, setTopicActivity] = useState<Activity | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([getLessonOrTopicItems(lessonId), getProgressByStudent(studentId)]).then(
      ([lessonItems]) => {
        setItems(lessonItems);
        setLoading(false);
      }
    );
  }, [lessonId, studentId]);

  const currentItem = items[currentIndex] ?? null;

  const allVideoTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => {
      if (item.itemType === "video") item.video.tags.forEach((t) => tags.add(t));
    });
    return [...tags];
  }, [items]);

  const handleVideoComplete = (s: WatchSignals) => {
    setSignals(s);
  };

  const handleSaveVideoProgress = async () => {
    if (!signals || !currentItem || currentItem.itemType !== "video") return;
    const video = currentItem.video as Video;
    setSaving(true);
    try {
      await upsertProgress({
        studentId,
        classId,
        unitId: video.unitId,
        topicId: video.topicId,
        videoId: video.id,
        watchTimeSeconds: signals.watchTimeSeconds,
        videoCompletionPercentage: signals.completion,
        replayCount: signals.replayCount,
        skipped: signals.skipped,
        clickedCurious: signals.clickedCurious,
        clickedHelp: signals.clickedHelp,
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
    if (signals && currentItem?.itemType === "video") {
      const v = currentItem.video as Video;
      logAnalyticsEvent({
        userId: studentId,
        role: "student",
        eventType: "video_completed",
        videoId: v.id,
        topicId: v.topicId,
        unitId: v.unitId,
        classId,
        metadata: { watchTimeSeconds: signals.watchTimeSeconds, completion: signals.completion },
      });
      await awardPoints(studentId, classId, "video_completed", v.id);
      if (signals.clickedCurious) {
        await awardPoints(studentId, classId, "curious_click", v.id);
      }
    }
    setSaving(false);
    advanceOrFinish();
  };

  const computeQuizScore = (quiz: Quiz): number => {
    const graded = quiz.questions.filter((q) => q.type !== "shortResponse");
    if (graded.length === 0) return 100;
    const correct = graded.filter((q) => answers[q.id] === q.correctAnswer).length;
    return Math.round((correct / graded.length) * 100);
  };

  const handleSubmitQuiz = async () => {
    if (!currentItem || currentItem.itemType !== "quiz") return;
    const quiz = currentItem.quiz as Quiz;
    const score = computeQuizScore(quiz);
    setQuizScores((prev) => [...prev, { quizId: quiz.id, score }]);
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
  };

  const advanceOrFinish = async () => {
    setSignals(null);
    setAnswers({});
    setQuizSubmitted(false);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      if (allVideoTags.length > 0) {
        const activity = await getActivityForVideoTags(allVideoTags);
        setTopicActivity(activity);
      }
      setDone(true);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-charcoal/8" />
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-charcoal/8" />
        <div className="aspect-video animate-pulse rounded-3xl bg-charcoal/8" />
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

  if (done) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div
          className="overflow-hidden rounded-3xl text-cream shadow-hero"
          style={{ background: "linear-gradient(120deg, #14352a, #2d6a4f)" }}
        >
          <div className="p-8 text-center">
            <p className="text-5xl">🎉</p>
            <h2 className="display mt-2 text-2xl font-bold">Lesson complete!</h2>
            <p className="mt-1 text-forest-100/90">
              Great work, {currentUser?.name?.split(" ")[0] ?? "Explorer"}!
            </p>
          </div>
        </div>

        {quizScores.length > 0 && (
          <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
            <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">Quiz results</p>
            <div className="mt-3 space-y-2">
              {quizScores.map((qs, i) => (
                <div key={qs.quizId} className="flex items-center justify-between">
                  <span className="text-sm text-charcoal">Quiz {i + 1}</span>
                  <Badge tone={qs.score >= 80 ? "forest" : qs.score >= 50 ? "gold" : "sand"}>
                    {qs.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {topicActivity && (
          <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <p className="font-semibold text-forest-900">{topicActivity.title}</p>
                <p className="text-xs text-charcoal-soft">Personalised activity based on your quiz results</p>
              </div>
            </div>
            <Link href={`/student/activity/${topicActivity.id}`} className="mt-4 block">
              <Button className="w-full">Start your activity →</Button>
            </Link>
          </div>
        )}

        <Link href="/student/classwork">
          <Button variant="secondary" className="w-full">Back to class work</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/student/classwork" className="text-sm font-semibold text-forest-700 hover:underline">
        Back to class work
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {items.map((item, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-forest-600 text-cream"
                    : isCurrent
                    ? "bg-forest-700 text-cream"
                    : "bg-sand text-charcoal-soft"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : item.itemType === "video" ? (
                  <Film className="h-4 w-4" />
                ) : (
                  <HelpCircle className="h-4 w-4" />
                )}
              </div>
              {i < items.length - 1 && (
                <div className={`h-0.5 w-6 rounded-full ${i < currentIndex ? "bg-forest-500" : "bg-sand-dark"}`} />
              )}
            </div>
          );
        })}
        <span className="ml-2 text-xs text-charcoal-soft shrink-0">
          {currentIndex + 1} of {items.length}
        </span>
      </div>

      {/* Video item */}
      {currentItem?.itemType === "video" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-forest-600" aria-hidden />
            <h2 className="display font-bold text-forest-900">{currentItem.video.title}</h2>
          </div>

          {currentItem.video.muxPlaybackId ? (
            <VideoPlayer video={currentItem.video} onComplete={handleVideoComplete} />
          ) : (
            <VideoPlayerMock video={currentItem.video} onComplete={handleVideoComplete} />
          )}

          {signals && (
            <div className="flex justify-end">
              <Button onClick={handleSaveVideoProgress} disabled={saving}>
                {saving ? "Saving…" : "Continue →"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quiz item */}
      {currentItem?.itemType === "quiz" && (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-forest-600" aria-hidden />
            <h2 className="display font-bold text-forest-900">{currentItem.quiz.title}</h2>
          </div>

          {currentItem.quiz.questions.map((q, i) => (
            <div key={q.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
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
                    const correct = quizSubmitted && opt === q.correctAnswer;
                    const wrong = quizSubmitted && selected && opt !== q.correctAnswer;
                    return (
                      <button
                        key={opt}
                        disabled={quizSubmitted}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-sm transition-colors ${
                          wrong
                            ? "border-clay-400 bg-clay-50 text-clay-700"
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

          {!quizSubmitted ? (
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmitQuiz}
              disabled={Object.keys(answers).length < currentItem.quiz.questions.length}
            >
              Submit answers
            </Button>
          ) : (
            <Button className="w-full" size="lg" onClick={advanceOrFinish}>
              Continue →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
