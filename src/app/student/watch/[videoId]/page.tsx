"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button, Badge, EmptyState } from "@/components/ui/primitives";
import { VideoPlayerMock, type WatchSignals } from "@/components/media/VideoPlayerMock";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { AdaptiveRecommendationPanel } from "@/components/cards/InsightCards";
import {
  getVideo,
  getTopic,
  getQuizByTopic,
  getResource,
  getAdaptiveTasks,
  upsertProgress,
  getActivityForVideoTags,
  logAnalyticsEvent,
  awardPoints,
} from "@/lib/supabaseService";
import { generateAdaptiveRecommendation } from "@/lib/adaptive";
import { DEMO_STUDENT_ID } from "@/data/people";
import type { Video, Topic, Quiz, Resource, AdaptiveTask, AdaptiveRecommendation, Activity } from "@/types";

type Stage = "watch" | "quiz" | "reflect" | "result";

type PageData = {
  video: Video;
  topic: Topic | null;
  quiz: Quiz | null;
  adaptiveTasks: AdaptiveTask[];
};

export default function WatchPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = use(params);
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [linkedResource, setLinkedResource] = useState<Resource | null>(null);
  const [topicActivity, setTopicActivity] = useState<Activity | null>(null);

  const [stage, setStage] = useState<Stage>("watch");
  const [signals, setSignals] = useState<WatchSignals | null>(null);
  const [reaction, setReaction] = useState<"like" | "dislike" | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reflection, setReflection] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [saving, setSaving] = useState(false);

  // Load video, topic, quiz, and adaptive tasks in parallel on mount.
  useEffect(() => {
    getVideo(videoId).then(async (video) => {
      if (!video) {
        setPageLoading(false);
        return;
      }
      const [topic, tasks] = await Promise.all([
        getTopic(video.topicId),
        getAdaptiveTasks(),
      ]);
      const quiz = topic ? await getQuizByTopic(topic.id) : null;
      setPageData({ video, topic, quiz, adaptiveTasks: tasks });
      // Find the activity whose blocks are tagged with the same tags as this video
      if (video.tags.length > 0) {
        getActivityForVideoTags(video.tags).then(setTopicActivity);
      }
      setPageLoading(false);
    });
  }, [videoId]);

  const quizScore = useMemo(() => {
    const quiz = pageData?.quiz;
    if (!quiz) return null;
    const graded = quiz.questions.filter((q) => q.type !== "shortResponse");
    if (graded.length === 0) return 100;
    const correct = graded.filter((q) => answers[q.id] === q.correctAnswer).length;
    return Math.round((correct / graded.length) * 100);
  }, [pageData?.quiz, answers]);

  const rec: AdaptiveRecommendation | null = useMemo(() => {
    const video = pageData?.video;
    if (!signals || !video) return null;
    return generateAdaptiveRecommendation({
      watchTimeSeconds: signals.watchTimeSeconds,
      durationSeconds: video.durationSeconds,
      quizScore,
      replayCount: signals.replayCount,
      clickedCurious: signals.clickedCurious,
      clickedHelp: signals.clickedHelp,
    });
  }, [signals, pageData?.video, quizScore]);

  const recommendedTask = useMemo(() => {
    if (!rec || !pageData) return undefined;
    const { adaptiveTasks, video } = pageData;
    return (
      adaptiveTasks.find((t) => t.type === rec.recommendedTaskType && t.topicId === video.topicId) ??
      adaptiveTasks.find((t) => t.type === rec.recommendedTaskType)
    );
  }, [rec, pageData]);

  // Load linked resource when task is determined.
  useEffect(() => {
    if (recommendedTask?.linkedResourceId) {
      getResource(recommendedTask.linkedResourceId).then(setLinkedResource);
    } else {
      setLinkedResource(null);
    }
  }, [recommendedTask?.linkedResourceId]);

  const finishLesson = async () => {
    const { video, topic } = pageData ?? {};
    if (!signals || !rec || !video) return;
    setSaving(true);

    let pts = 20;
    if (quizScore !== null && quizScore >= 80) pts += 20;
    if (quizScore !== null) pts += 10;
    if (signals.clickedCurious) pts += 5;
    setPointsEarned(pts);

    try {
      await upsertProgress({
        studentId,
        classId: currentUser?.classIds[0] ?? "",
        unitId: video.unitId,
        topicId: video.topicId,
        videoId: video.id,
        watchTimeSeconds: signals.watchTimeSeconds,
        videoCompletionPercentage: signals.completion,
        replayCount: signals.replayCount,
        skipped: signals.skipped,
        clickedCurious: signals.clickedCurious,
        clickedHelp: signals.clickedHelp,
        quizScore,
        quizAttempts: quizScore !== null ? 1 : 0,
        worksheetCompleted: false,
        adaptiveFocusArea: rec.adaptiveFocusArea,
        engagementLevel: rec.engagementLevel,
        recommendedTaskType: rec.recommendedTaskType,
        videoReaction: reaction,
        lastActive: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error("Failed to save progress:", err);
    }

    const classId = currentUser?.classIds[0] ?? "";

    logAnalyticsEvent({
      userId: studentId,
      role: "student",
      eventType: "video_completed",
      videoId: video.id,
      topicId: video.topicId,
      unitId: video.unitId,
      classId,
      metadata: {
        watchTimeSeconds: signals.watchTimeSeconds,
        completion: signals.completion,
        quizScore: quizScore ?? -1,
        reaction: reaction ?? "none",
      },
    });
    if (quizScore !== null) {
      logAnalyticsEvent({
        userId: studentId,
        role: "student",
        eventType: "quiz_submitted",
        videoId: video.id,
        topicId: video.topicId,
        unitId: video.unitId,
        classId,
        metadata: { score: quizScore },
      });
    }

    // Award points — all fire-and-forget, failures never block the flow
    await awardPoints(studentId, classId, "video_completed", video.id);
    if (quizScore !== null && quizScore >= 80) {
      await awardPoints(studentId, classId, "quiz_ace", video.id);
    }
    if (signals.clickedCurious) {
      await awardPoints(studentId, classId, "curious_click", video.id);
    }

    setSaving(false);
    setStage("result");
  };

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-charcoal/8" />
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-charcoal/8" />
        <div className="aspect-video animate-pulse rounded-3xl bg-charcoal/8" />
      </div>
    );
  }

  if (!pageData?.video) {
    return (
      <EmptyState
        title="Reel not found"
        message="This video may have been removed."
        action={
          <Link href="/student/classwork">
            <Button>Back to class work</Button>
          </Link>
        }
      />
    );
  }

  const { video, topic, quiz } = pageData;

  return (
    <div className="space-y-6">
      <Link href="/student/classwork" className="text-sm font-semibold text-forest-700 hover:underline">
        Back to class work
      </Link>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        {(["watch", "quiz", "reflect", "result"] as Stage[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full ${
                stage === s ? "bg-forest-700 text-cream" : "bg-forest-50 text-forest-600"
              }`}
            >
              {i + 1}
            </span>
            <span className={`capitalize ${stage === s ? "text-forest-900" : "text-charcoal-soft"}`}>
              {s === "result" ? "Reward" : s}
            </span>
            {i < 3 && <span className="text-sand-dark">-</span>}
          </div>
        ))}
      </div>

      {/* WATCH */}
      {stage === "watch" && (
        <div className="space-y-4">
          {video.muxPlaybackId ? (
            <VideoPlayer
              video={video}
              onComplete={(s) => setSignals(s)}
            />
          ) : (
            <VideoPlayerMock
              video={video}
              onComplete={(s) => setSignals(s)}
            />
          )}

          {/* Like / dislike — shown once video is done */}
          {signals && (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
              <p className="text-sm font-semibold text-forest-900">What did you think of this video?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReaction(reaction === "like" ? undefined : "like")}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    reaction === "like"
                      ? "bg-forest-700 text-cream"
                      : "bg-cream text-charcoal-soft ring-1 ring-sand-dark hover:bg-forest-50 hover:text-forest-700"
                  }`}
                >
                  👍 Liked it
                </button>
                <button
                  type="button"
                  onClick={() => setReaction(reaction === "dislike" ? undefined : "dislike")}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    reaction === "dislike"
                      ? "bg-clay-400/30 text-clay-700"
                      : "bg-cream text-charcoal-soft ring-1 ring-sand-dark hover:bg-clay-50 hover:text-clay-600"
                  }`}
                >
                  👎 Not for me
                </button>
              </div>
              <button
                type="button"
                onClick={() => setStage(quiz ? "quiz" : "reflect")}
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-forest-700 px-8 py-3 text-sm font-bold text-cream shadow-soft transition hover:bg-forest-800"
              >
                {quiz ? "Continue to quiz →" : "Continue →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUIZ */}
      {stage === "quiz" && quiz && (
        <div className="mx-auto max-w-xl space-y-4">
          <h2 className="display text-xl font-bold text-forest-900">Quick check: {topic?.title}</h2>
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
              <p className="font-semibold text-forest-900">
                {i + 1}. {q.questionText}
              </p>
              {q.type === "shortResponse" ? (
                <textarea
                  className="mt-3 w-full rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
                  rows={2}
                  placeholder="Type your answer..."
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                />
              ) : (
                <div className="mt-3 space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-sm transition-colors ${
                        answers[q.id] === opt
                          ? "border-forest-600 bg-forest-50 font-semibold text-forest-900"
                          : "border-sand hover:border-forest-400"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                          answers[q.id] === opt
                            ? "border-forest-600 bg-forest-600 text-white"
                            : "border-sand-dark"
                        }`}
                      >
                        {answers[q.id] === opt && ""}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button
            className="w-full"
            size="lg"
            onClick={() => setStage("reflect")}
            disabled={Object.keys(answers).length < quiz.questions.length}
          >
            Submit answers
          </Button>
        </div>
      )}

      {/* REFLECT */}
      {stage === "reflect" && (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
            <h2 className="display text-xl font-bold text-forest-900">Reflect</h2>
            <p className="mt-1 text-sm text-charcoal-soft">{video.learningIntent}</p>
            <p className="mt-4 font-semibold text-forest-900">
              What is one thing that surprised you in this reel?
            </p>
            <textarea
              className="mt-3 w-full rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm focus:border-forest-500 focus:outline-none"
              rows={3}
              placeholder="Share your thoughts..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
            {quizScore !== null && (
              <div className="mt-4 rounded-2xl bg-forest-50 px-4 py-3 text-sm text-forest-800">
                You scored <b>{quizScore}%</b> on the quick check.
              </div>
            )}
          </div>
          <Button className="w-full" size="lg" onClick={finishLesson} disabled={saving}>
            {saving ? "Saving..." : "Complete mission"}
          </Button>
        </div>
      )}

      {/* RESULT + adaptive pathway */}
      {stage === "result" && rec && (
        <div className="mx-auto max-w-xl space-y-4">
          <div
            className="overflow-hidden rounded-3xl text-cream shadow-hero"
            style={{ background: "linear-gradient(120deg, #14352a, #2d6a4f)" }}
          >
            <div className="p-8 text-center">
              <p className="text-5xl"></p>
              <h2 className="display mt-2 text-2xl font-bold">Mission complete!</h2>
              <p className="mt-1 text-forest-100/90">
                Great exploring, {currentUser?.name?.split(" ")[0]}.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-300/30 px-5 py-2 text-lg font-bold text-cream">
                +{pointsEarned} explorer points
              </div>
            </div>
          </div>

          <AdaptiveRecommendationPanel rec={rec} audience="student" />

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
              <Link href={`/student/activity/${topicActivity.id}?videoId=${videoId}`} className="mt-4 block">
                <Button className="w-full">Start your activity →</Button>
              </Link>
            </div>
          )}

          {recommendedTask && (
            <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <h3 className="display font-bold text-forest-900">
                  Your task: {recommendedTask.title}
                </h3>
                <Badge tone="sand">~{recommendedTask.estimatedTimeMinutes} min</Badge>
              </div>
              <p className="mt-1 text-sm text-charcoal-soft">{recommendedTask.instructions}</p>
              {linkedResource && (
                <p className="mt-2 text-sm">
                  Linked resource: <b>{linkedResource.title}</b>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Link href="/student/classwork" className="flex-1">
              <Button variant="secondary" className="w-full">
                Back to class work
              </Button>
            </Link>
            <Link href="/student/explore" className="flex-1">
              <Button className="w-full">Explore more</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
