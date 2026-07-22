"use client";
/*
 * Read-only lesson review: everything a student did on a completed lesson in
 * one place - videos to rewatch, quiz results (correct/incorrect per
 * question), and their worksheet answers with teacher feedback. Nothing here
 * is editable; this is a summary, not the interactive lesson feed.
 */
import { use, useEffect, useState } from "react";
import Link from "next/link";
import MuxPlayer from "@mux/mux-player-react";
import { useApp } from "@/lib/store";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { WorksheetReview } from "@/components/insights/WorksheetReview";
import {
  getTopic,
  getLessonOrTopicItems,
  getActivitiesForLesson,
  getStudentActivityResponse,
  getQuizResultsForStudentLesson,
  markFeedbackSeen,
  type ClassQuizResult,
} from "@/lib/supabaseService";
import { DEMO_STUDENT_ID } from "@/data/people";
import { ArrowLeft, Film, Play, Check, X, ListChecks } from "lucide-react";
import type { Video, Quiz, Activity, StudentActivityResponse } from "@/types";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LessonReviewPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const classId = currentUser?.classIds[0] ?? "";

  const [loading, setLoading] = useState(true);
  const [lessonTitle, setLessonTitle] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizResults, setQuizResults] = useState<ClassQuizResult[]>([]);
  const [worksheetResponses, setWorksheetResponses] = useState<StudentActivityResponse[]>([]);
  const [activityById, setActivityById] = useState<Map<string, Activity>>(new Map());
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [topic, items, pool] = await Promise.all([
        getTopic(lessonId),
        getLessonOrTopicItems(lessonId, true),
        getActivitiesForLesson(lessonId),
      ]);
      setLessonTitle(topic?.title ?? "");
      setVideos(items.filter((i) => i.itemType === "video").map((i) => i.video));
      setQuizzes(items.filter((i) => i.itemType === "quiz").map((i) => i.quiz));

      const results = await getQuizResultsForStudentLesson(lessonId, studentId);
      setQuizResults(results);

      if (classId) {
        const responses = await Promise.all(
          pool.map((a) => getStudentActivityResponse(a.id, studentId, classId))
        );
        const withResponses = responses.filter((r): r is StudentActivityResponse => r !== null);
        setWorksheetResponses(withResponses);

        const feedbackActivityIds = withResponses.filter((r) => r.teacherFeedback).map((r) => r.activityId);
        if (feedbackActivityIds.length > 0) markFeedbackSeen(feedbackActivityIds, studentId);
      }
      setActivityById(new Map(pool.map((a) => [a.id, a])));

      setLoading(false);
    })();
  }, [lessonId, studentId, classId]);

  if (loading) return <FullPageLoader />;

  const quizResultByQuizId = new Map(quizResults.map((r) => [r.quizId, r]));

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20">
      <Link
        href="/student/classwork"
        className="flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to class work
      </Link>

      <div
        className="overflow-hidden rounded-3xl shadow-hero"
        style={{ background: "linear-gradient(120deg, #204535, #3d7a5e)" }}
      >
        <div className="px-6 py-8">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-200/80">Lesson review</p>
          <h1 className="display mt-1 text-2xl font-bold text-cream">{lessonTitle || "Lesson"}</h1>
        </div>
      </div>

      {/* Videos */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h2 className="display text-lg font-bold text-forest-900">Reels</h2>
          {videos.map((v) => {
            const isOpen = expandedVideoId === v.id;
            return (
              <div key={v.id} className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
                <button
                  type="button"
                  onClick={() => setExpandedVideoId(isOpen ? null : v.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest-100 text-forest-700">
                    <Film className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-forest-900">{v.title}</span>
                    <span className="block text-xs text-charcoal-soft">{formatDuration(v.durationSeconds)}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest-700 px-3.5 py-1.5 text-xs font-bold text-cream">
                    <Play className="h-3.5 w-3.5" aria-hidden />
                    {isOpen ? "Hide" : "Watch again"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <div
                      className="mx-auto overflow-hidden rounded-2xl bg-forest-950"
                      style={v.aspectRatio === "vertical" ? { maxWidth: 320 } : undefined}
                    >
                      <MuxPlayer
                        playbackId={v.muxPlaybackId ?? ""}
                        metadata={{ video_title: v.title }}
                        streamType="on-demand"
                        accentColor="#4f9776"
                        style={{ width: "100%", aspectRatio: v.aspectRatio === "vertical" ? "9/16" : "16/9" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quiz results */}
      {quizzes.length > 0 && (
        <div className="space-y-3">
          <h2 className="display text-lg font-bold text-forest-900">Quiz results</h2>
          {quizzes.map((quiz) => {
            const res = quizResultByQuizId.get(quiz.id);
            const detailKeys = res ? Object.keys(res.details ?? {}) : [];
            return (
              <div key={quiz.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold text-forest-900">
                    <ListChecks className="h-4 w-4 text-forest-600" aria-hidden />
                    {quiz.title}
                  </p>
                  {res ? (
                    <Badge tone={res.score >= 80 ? "forest" : res.score >= 50 ? "gold" : "clay"}>
                      {Math.round(res.score)}%
                    </Badge>
                  ) : (
                    <Badge tone="sand">Not attempted</Badge>
                  )}
                </div>
                {res && detailKeys.length === 0 && (
                  <p className="mt-2 text-xs text-charcoal-soft">
                    Per-question detail wasn&apos;t recorded for this attempt.
                  </p>
                )}
                {res && detailKeys.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {quiz.questions.map((q, i) => {
                      const d = res.details[q.id];
                      if (!d) return null;
                      return (
                        <li key={q.id} className="rounded-xl bg-cream p-3">
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                                d.correct ? "bg-forest-100 text-forest-700" : "bg-clay-400/20 text-clay-600"
                              }`}
                            >
                              {d.correct ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
                            </span>
                            <p className="text-sm font-medium text-forest-900">{i + 1}. {q.questionText}</p>
                          </div>
                          <p className="mt-1.5 pl-7 text-xs text-charcoal-soft">
                            Your answer: <span className={d.correct ? "font-semibold text-forest-700" : "font-semibold text-clay-600"}>{d.answer || "—"}</span>
                            {!d.correct && d.correctAnswer ? <> · Correct answer: <span className="font-semibold text-forest-700">{d.correctAnswer}</span></> : null}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Worksheet + feedback (read-only) */}
      <div className="space-y-3">
        <h2 className="display text-lg font-bold text-forest-900">Your worksheet</h2>
        {worksheetResponses.length === 0 ? (
          <EmptyState title="No worksheet yet" message="Nothing to review here yet." />
        ) : (
          <WorksheetReview responses={worksheetResponses} activityById={activityById} />
        )}
      </div>
    </div>
  );
}
