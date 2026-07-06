"use client";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button, Badge, EmptyState } from "@/components/ui/primitives";
import { VideoPlayerMock, type WatchSignals } from "@/components/media/VideoPlayerMock";
import { AdaptiveRecommendationPanel } from "@/components/cards/InsightCards";
import {
  getVideo,
  getTopic,
  getQuizByTopic,
  getResource,
  db,
  newId,
} from "@/lib/dataService";
import { generateAdaptiveRecommendation } from "@/lib/adaptive";
import { adaptiveTasks } from "@/data/content";
import { explorerPoints } from "@/data/progress";
import { DEMO_STUDENT_ID } from "@/data/people";
import type { AdaptiveRecommendation } from "@/types";

type Stage = "watch" | "quiz" | "reflect" | "result";

export default function WatchPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = use(params);
  const { currentUser, bump } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;

  const video = getVideo(videoId);
  const topic = video ? getTopic(video.topicId) : undefined;
  const quiz = topic ? getQuizByTopic(topic.id) : undefined;

  const [stage, setStage] = useState<Stage>("watch");
  const [signals, setSignals] = useState<WatchSignals | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reflection, setReflection] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);

  const quizScore = useMemo(() => {
    if (!quiz) return null;
    const graded = quiz.questions.filter((q) => q.type !== "shortResponse");
    if (graded.length === 0) return 100;
    const correct = graded.filter((q) => answers[q.id] === q.correctAnswer).length;
    return Math.round((correct / graded.length) * 100);
  }, [quiz, answers]);

  if (!video) {
    return <EmptyState title="Reel not found" message="This video may have been removed." action={<Link href="/student/classwork"><Button>Back to class work</Button></Link>} />;
  }

  const rec: AdaptiveRecommendation | null =
    signals != null
      ? generateAdaptiveRecommendation({
          watchTimeSeconds: signals.watchTimeSeconds,
          durationSeconds: video.durationSeconds,
          quizScore,
          replayCount: signals.replayCount,
          clickedCurious: signals.clickedCurious,
          clickedHelp: signals.clickedHelp,
        })
      : null;

  // The specific adaptive task to surface, matched by type + topic.
  const recommendedTask = rec
    ? adaptiveTasks.find((t) => t.type === rec.recommendedTaskType && t.topicId === video.topicId) ??
      adaptiveTasks.find((t) => t.type === rec.recommendedTaskType)
    : undefined;

  const finishLesson = () => {
    if (!signals || !rec) return;
    // Persist a StudentProgress record through the data layer (Firestore later).
    let pts = 20; // base for completing the reel
    if (quizScore !== null && quizScore >= 80) pts += 20;
    if (quizScore !== null) pts += 10;
    if (signals.clickedCurious) pts += 5;
    setPointsEarned(pts);
    explorerPoints[studentId] = (explorerPoints[studentId] ?? 0) + pts;

    db.progress.unshift({
      id: newId("prog"),
      studentId,
      classId: currentUser?.classIds[0] ?? "class-5j",
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
      recommendedTaskId: recommendedTask?.id,
      lastActive: new Date().toISOString().slice(0, 10),
    });
    bump();
    setStage("result");
  };

  return (
    <div className="space-y-6">
      <Link href="/student/classwork" className="text-sm font-semibold text-forest-700 hover:underline">
         Back to class work
      </Link>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        {(["watch", "quiz", "reflect", "result"] as Stage[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`grid h-7 w-7 place-items-center rounded-full ${stage === s ? "bg-forest-700 text-cream" : "bg-forest-50 text-forest-600"}`}>
              {i + 1}
            </span>
            <span className={`capitalize ${stage === s ? "text-forest-900" : "text-charcoal-soft"}`}>{s === "result" ? "Reward" : s}</span>
            {i < 3 && <span className="text-sand-dark">-</span>}
          </div>
        ))}
      </div>

      {/* WATCH */}
      {stage === "watch" && (
        <VideoPlayerMock
          video={video}
          onComplete={(s) => {
            setSignals(s);
            setStage(quiz ? "quiz" : "reflect");
          }}
        />
      )}

      {/* QUIZ */}
      {stage === "quiz" && quiz && (
        <div className="mx-auto max-w-xl space-y-4">
          <h2 className="display text-xl font-bold text-forest-900">Quick check: {topic?.title}</h2>
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
              <p className="font-semibold text-forest-900">{i + 1}. {q.questionText}</p>
              {q.type === "shortResponse" ? (
                <textarea
                  className="mt-3 w-full rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
                  rows={2}
                  placeholder="Type your answer…"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                />
              ) : (
                <div className="mt-3 space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-sm transition-colors ${answers[q.id] === opt ? "border-forest-600 bg-forest-50 font-semibold text-forest-900" : "border-sand hover:border-forest-400"}`}
                    >
                      <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${answers[q.id] === opt ? "border-forest-600 bg-forest-600 text-white" : "border-sand-dark"}`}>
                        {answers[q.id] === opt && ""}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button className="w-full" size="lg" onClick={() => setStage("reflect")} disabled={Object.keys(answers).length < quiz.questions.length}>
            Submit answers 
          </Button>
        </div>
      )}

      {/* REFLECT */}
      {stage === "reflect" && (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
            <h2 className="display text-xl font-bold text-forest-900"> Reflect</h2>
            <p className="mt-1 text-sm text-charcoal-soft">{video.learningIntent}</p>
            <p className="mt-4 font-semibold text-forest-900">What is one thing that surprised you in this reel?</p>
            <textarea
              className="mt-3 w-full rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm focus:border-forest-500 focus:outline-none"
              rows={3}
              placeholder="Share your thoughts…"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
            {quizScore !== null && (
              <div className="mt-4 rounded-2xl bg-forest-50 px-4 py-3 text-sm text-forest-800">
                You scored <b>{quizScore}%</b> on the quick check.
              </div>
            )}
          </div>
          <Button className="w-full" size="lg" onClick={finishLesson}>
            Complete mission 
          </Button>
        </div>
      )}

      {/* RESULT + adaptive pathway */}
      {stage === "result" && rec && (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="overflow-hidden rounded-3xl text-cream shadow-hero" style={{ background: "linear-gradient(120deg, #14352a, #2d6a4f)" }}>
            <div className="p-8 text-center">
              <p className="text-5xl"></p>
              <h2 className="display mt-2 text-2xl font-bold">Mission complete!</h2>
              <p className="mt-1 text-forest-100/90">Great exploring, {currentUser?.name?.split(" ")[0]}.</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-300/30 px-5 py-2 text-lg font-bold text-cream">
                 +{pointsEarned} explorer points
              </div>
            </div>
          </div>

          {/* The adaptive recommendation, the personalised next task */}
          <AdaptiveRecommendationPanel rec={rec} audience="student" />

          {recommendedTask && (
            <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <h3 className="display font-bold text-forest-900">Your task: {recommendedTask.title}</h3>
                <Badge tone="sand">~{recommendedTask.estimatedTimeMinutes} min</Badge>
              </div>
              <p className="mt-1 text-sm text-charcoal-soft">{recommendedTask.instructions}</p>
              {recommendedTask.linkedResourceId && (
                <p className="mt-2 text-sm">
                   Linked resource: <b>{getResource(recommendedTask.linkedResourceId)?.title}</b>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Link href="/student/classwork" className="flex-1">
              <Button variant="secondary" className="w-full">Back to class work</Button>
            </Link>
            <Link href="/student/explore" className="flex-1">
              <Button className="w-full"> Explore more</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
