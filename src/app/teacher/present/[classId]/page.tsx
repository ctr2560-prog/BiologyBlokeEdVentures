"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SectionHeader, Button, EmptyState } from "@/components/ui/primitives";
import {
  getClass,
  getTopic,
  getTopicsByUnit,
  getVideosByTopic,
  getQuizByTopic,
  getAssignmentsByClass,
  getActivityForVideoTags,
  saveClassSession,
} from "@/lib/supabaseService";
import type { ClassGroup, Topic, Video, Quiz, Activity, Difficulty } from "@/types";
import {
  Film,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader,
  ThumbsUp,
  ThumbsDown,
  Minus,
  X,
  Sparkles,
} from "lucide-react";

type SessionStage = "pick" | "watch" | "react" | "quiz" | "worksheet";
type Reaction = "loved" | "meh" | "skip";

interface QuizResult {
  questionId: string;
  locked: string;
  correct: boolean;
}

const NEXT_DIFFICULTY: Record<Difficulty, Difficulty | null> = {
  foundation: "core",
  core: "advanced",
  advanced: null,
};

function pctToDifficulty(pct: number): Difficulty {
  if (pct >= 80) return "advanced";
  if (pct >= 50) return "core";
  return "foundation";
}

function buildRecommendations(
  blocks: Activity["blocks"],
  difficulty: Difficulty,
  reaction: Reaction
) {
  const recommended: number[] = [];
  const challenge: number[] = [];
  const challengeDiff = NEXT_DIFFICULTY[difficulty];

  let qNum = 0;
  blocks.forEach((b) => {
    // instruction and image blocks are not numbered on the printed worksheet — skip them
    if (b.type === "instruction" || b.type === "image") return;
    qNum++;
    if (reaction === "meh" && b.topicTag) return;
    if (!b.blockDifficulty || b.blockDifficulty === difficulty) {
      recommended.push(qNum);
    } else if (challengeDiff && b.blockDifficulty === challengeDiff) {
      challenge.push(qNum);
    }
  });

  return { recommended, challenge };
}

export default function PresentPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);

  const [cls, setCls] = useState<ClassGroup | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [classData, assignments] = await Promise.all([
        getClass(classId),
        getAssignmentsByClass(classId),
      ]);
      setCls(classData);
      if (classData) {
        const unitIds = [...new Set(assignments.map((a) => a.unitId))];
        const topicArrays = await Promise.all(unitIds.map((u) => getTopicsByUnit(u)));
        const allTopics = topicArrays.flat();
        const withVideos = await Promise.all(
          allTopics.map(async (t) => {
            const vids = await getVideosByTopic(t.id);
            return vids.length > 0 ? t : null;
          })
        );
        setTopics(withVideos.filter(Boolean) as Topic[]);
      }
      setLoading(false);
    })();
  }, [classId]);

  // Session state
  const [stage, setStage] = useState<SessionStage>("pick");
  const [topicData, setTopicData] = useState<{
    topic: Topic;
    video: Video | null;
    quiz: Quiz | null;
    activity: Activity | null;
  } | null>(null);
  const [topicLoading, setTopicLoading] = useState(false);

  // Stage 2 reaction
  const [reaction, setReaction] = useState<Reaction | null>(null);

  // Stage 3 quiz
  const [quizIndex, setQuizIndex] = useState(0);
  const [lockedAnswer, setLockedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  // Stage 4 worksheet
  const [classDifficulty, setClassDifficulty] = useState<Difficulty>("core");
  const [recommendations, setRecommendations] = useState<{
    recommended: number[];
    challenge: number[];
  } | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const startTopic = async (topicId: string) => {
    setTopicLoading(true);
    setStage("watch");
    setReaction(null);
    setQuizIndex(0);
    setLockedAnswer(null);
    setRevealed(false);
    setQuizResults([]);
    setRecommendations(null);
    setSessionSaved(false);

    const [topic, videos, quiz] = await Promise.all([
      getTopic(topicId),
      getVideosByTopic(topicId),
      getQuizByTopic(topicId),
    ]);
    const video = videos[0] ?? null;
    const activity = video?.tags?.length
      ? await getActivityForVideoTags(video.tags)
      : null;

    setTopicData({ topic: topic!, video, quiz, activity });
    setTopicLoading(false);
  };

  const allQuestions = useMemo(() => topicData?.quiz?.questions ?? [], [topicData]);
  const currentQuestion = allQuestions[quizIndex] ?? null;

  const revealAnswer = () => {
    if (!lockedAnswer || !currentQuestion) return;
    const correct = lockedAnswer === currentQuestion.correctAnswer;
    setQuizResults((prev) => [
      ...prev,
      { questionId: currentQuestion.id, locked: lockedAnswer, correct },
    ]);
    setRevealed(true);
  };

  const goToWorksheet = (results: QuizResult[], reactionOverride?: Reaction) => {
    const eff = reactionOverride ?? reaction ?? "skip";
    const mcqQs = allQuestions.filter((q) => q.type !== "shortResponse");
    const mcqCorrect = results.filter((r) => {
      const q = allQuestions.find((q2) => q2.id === r.questionId);
      return q && q.type !== "shortResponse" && r.correct;
    }).length;
    const pct =
      mcqQs.length === 0 ? 65 : Math.round((mcqCorrect / mcqQs.length) * 100);
    const diff = pctToDifficulty(pct);
    setClassDifficulty(diff);
    if (topicData?.activity) {
      setRecommendations(buildRecommendations(topicData.activity.blocks, diff, eff));
    }
    setStage("worksheet");
  };

  const handleSaveSession = async (pct: number | null) => {
    if (!topicData || sessionSaved) return;
    setSaving(true);
    try {
      await saveClassSession({
        classId,
        topicId: topicData.topic.id,
        videoId: topicData.video?.id ?? null,
        teacherId: null,
        classReaction: reaction,
        classScore: pct ?? 0,
        classDifficulty,
        recommendedQs: recommendations?.recommended ?? [],
        challengeQs: recommendations?.challenge ?? [],
      });
      setSessionSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const advanceQuiz = () => {
    const next = quizIndex + 1;
    if (next < allQuestions.length) {
      setQuizIndex(next);
      setLockedAnswer(null);
      setRevealed(false);
    } else {
      goToWorksheet(quizResults);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!cls) {
    return <EmptyState title="Class not found" message="This class may have been removed." />;
  }

  // STAGE: PICK
  if (stage === "pick" || topicLoading) {
    return (
      <div className="space-y-6">
        <Link
          href={`/teacher/classes/${cls.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to class
        </Link>
        <SectionHeader
          title="Present to the class"
          subtitle={`${cls.name} · one screen, no student devices needed`}
        />
        {topicLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-8 w-8 animate-spin text-forest-600" />
          </div>
        ) : topics.length === 0 ? (
          <EmptyState
            title="Nothing to present yet"
            message="Assign a unit to this class first, then come back to run it on the projector."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => startTopic(t.id)}
                className="card-lift overflow-hidden rounded-3xl bg-white text-left shadow-soft ring-1 ring-black/5"
              >
                <div
                  className="flex h-28 items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1b4332, #40916c)" }}
                >
                  <Film className="h-10 w-10 text-cream/90" aria-hidden strokeWidth={1.5} />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-forest-900">{t.title}</p>
                  <p className="mt-1 text-sm text-charcoal-soft line-clamp-2">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const { topic, video, quiz, activity } = topicData!;
  const STAGE_ORDER: SessionStage[] = ["watch", "react", "quiz", "worksheet"];

  function StageBar() {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStage("pick")}
          className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All topics
        </button>
        <span className="truncate text-xs text-charcoal-soft">{topic.title}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {STAGE_ORDER.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === stage
                  ? "w-8 bg-forest-600"
                  : STAGE_ORDER.indexOf(stage) > i
                  ? "w-3 bg-forest-400"
                  : "w-2 bg-sand-dark"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // STAGE: WATCH
  if (stage === "watch") {
    return (
      <div className="space-y-5">
        <StageBar />
        <div className="mx-auto max-w-4xl space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-forest-600">Now watching</p>
            <h1 className="display mt-0.5 text-2xl font-bold text-forest-900 md:text-3xl">
              {video?.title ?? topic.title}
            </h1>
          </div>

          <div
            className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl shadow-hero"
            style={{ background: "linear-gradient(160deg, #0d2419, #1b4332 55%, #2d6a4f)" }}
          >
            {video?.muxPlaybackId ? (
              <iframe
                src={`https://stream.mux.com/${video.muxPlaybackId}`}
                allow="autoplay; fullscreen"
                className="absolute inset-0 h-full w-full rounded-3xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-cream/50">
                <Film className="h-20 w-20" aria-hidden strokeWidth={1} />
                <p className="text-sm">
                  {video ? "Video processing — play when ready" : "No video for this topic yet"}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button size="lg" onClick={() => setStage("react")}>
              Done watching <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // STAGE: REACT
  if (stage === "react") {
    const handleReaction = (r: Reaction) => {
      setReaction(r);
      if (quiz && quiz.questions.length > 0) {
        setStage("quiz");
      } else {
        goToWorksheet([], r);
      }
    };

    const OPTIONS: {
      key: Reaction;
      hands: string;
      label: string;
      Icon: typeof ThumbsUp;
      bg: string;
      ring: string;
      iconColor: string;
    }[] = [
      {
        key: "loved",
        hands: "Hands on heads",
        label: "Loved it",
        Icon: ThumbsUp,
        bg: "bg-forest-50",
        ring: "ring-forest-300",
        iconColor: "text-forest-600",
      },
      {
        key: "meh",
        hands: "Hands on shoulders",
        label: "Not for them",
        Icon: ThumbsDown,
        bg: "bg-clay-50",
        ring: "ring-clay-300",
        iconColor: "text-clay-500",
      },
      {
        key: "skip",
        hands: "Skip vote",
        label: "Move on",
        Icon: Minus,
        bg: "bg-sand",
        ring: "ring-sand-dark",
        iconColor: "text-charcoal-soft",
      },
    ];

    return (
      <div className="space-y-6">
        <StageBar />
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-forest-600">Class reaction</p>
            <h1 className="display mt-1 text-2xl font-bold text-forest-900 md:text-3xl">
              How did the class feel about it?
            </h1>
            <p className="mt-2 text-charcoal-soft">
              Ask the class to vote with their hands. Tap the majority read.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {OPTIONS.map(({ key, hands, label, Icon, bg, ring, iconColor }) => (
              <button
                key={key}
                onClick={() => handleReaction(key)}
                className={`card-lift rounded-3xl p-6 text-center ${bg} ring-1 ${ring}`}
              >
                <Icon className={`mx-auto h-10 w-10 ${iconColor}`} aria-hidden strokeWidth={1.5} />
                <p className="display mt-3 text-lg font-bold text-forest-900">{hands}</p>
                <p className="mt-0.5 text-sm text-charcoal-soft">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // STAGE: QUIZ
  if (stage === "quiz") {
    const q = currentQuestion;

    if (!q) {
      goToWorksheet(quizResults);
      return null;
    }

    const isShortResponse = q.type === "shortResponse";

    const handleShortReveal = () => {
      setQuizResults((prev) => [
        ...prev,
        { questionId: q.id, locked: "discussion", correct: true },
      ]);
      setRevealed(true);
    };

    return (
      <div className="space-y-6">
        <StageBar />
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-forest-600">
              Hands-up quiz · {quizIndex + 1} of {allQuestions.length}
            </p>
            <div className="flex gap-1">
              {allQuestions.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < quizIndex
                      ? "w-4 bg-forest-500"
                      : i === quizIndex
                      ? "w-6 bg-forest-700"
                      : "w-2 bg-sand-dark"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
            <p className="text-xl font-bold text-forest-900 md:text-2xl">{q.questionText}</p>
          </div>

          {/* Short response */}
          {isShortResponse && (
            <div className="space-y-3">
              <p className="text-sm text-charcoal-soft">
                Ask the class to discuss. Reveal the model answer when ready.
              </p>
              {!revealed ? (
                <Button onClick={handleShortReveal}>Reveal model answer</Button>
              ) : (
                <>
                  <div className="rounded-2xl bg-forest-50 p-5 ring-1 ring-forest-200">
                    <p className="text-xs font-bold uppercase tracking-wide text-forest-600">
                      Model answer
                    </p>
                    <p className="mt-1 text-charcoal">{q.correctAnswer}</p>
                    {q.explanation && (
                      <p className="mt-2 text-sm text-clay-600">{q.explanation}</p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={advanceQuiz}>
                      {quizIndex + 1 < allQuestions.length ? "Next question" : "See worksheet"}{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MCQ — two-step reveal */}
          {!isShortResponse && (
            <div className="space-y-3">
              {!lockedAnswer && (
                <p className="text-sm text-charcoal-soft">
                  Students raise their hand for their answer. Tap the option most hands chose.
                </p>
              )}
              {lockedAnswer && !revealed && (
                <p className="text-sm font-semibold text-forest-700">
                  Class chose:{" "}
                  <span className="rounded-lg bg-forest-600 px-2 py-0.5 text-cream">
                    {lockedAnswer}
                  </span>{" "}
                  — tap Reveal when ready.
                </p>
              )}

              <div className="grid gap-3">
                {q.options.map((opt, i) => {
                  const isLocked = lockedAnswer === opt;
                  const isDimmed = lockedAnswer !== null && !isLocked;
                  const isCorrect = revealed && opt === q.correctAnswer;
                  const isWrong = revealed && isLocked && opt !== q.correctAnswer;

                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (!lockedAnswer) setLockedAnswer(opt);
                      }}
                      disabled={!!lockedAnswer}
                      className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold transition-all ${
                        isCorrect
                          ? "border-forest-500 bg-forest-50 text-forest-900 shadow-lift"
                          : isWrong
                          ? "border-clay-400 bg-clay-50 text-clay-800"
                          : isLocked
                          ? "border-forest-700 bg-forest-700 text-white shadow-lift"
                          : isDimmed
                          ? "border-sand bg-white/50 text-charcoal/30"
                          : "border-sand bg-white text-charcoal hover:border-forest-400 hover:shadow-soft"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                          isCorrect
                            ? "bg-forest-600 text-white"
                            : isWrong
                            ? "bg-clay-400 text-white"
                            : isLocked
                            ? "bg-white/20 text-white"
                            : "bg-sand-dark text-charcoal"
                        }`}
                      >
                        {isCorrect ? (
                          <Check className="h-5 w-5" aria-hidden />
                        ) : isWrong ? (
                          <X className="h-5 w-5" aria-hidden />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {lockedAnswer && !revealed && (
                <div className="flex justify-end pt-1">
                  <Button size="lg" onClick={revealAnswer}>
                    Reveal answer
                  </Button>
                </div>
              )}

              {revealed && q.explanation && (
                <div className="rounded-2xl bg-gold-300/20 px-4 py-3 text-sm text-clay-700">
                  {q.explanation}
                </div>
              )}

              {revealed && (
                <div className="flex justify-end pt-1">
                  <Button onClick={advanceQuiz}>
                    {quizIndex + 1 < allQuestions.length ? "Next question" : "See worksheet"}{" "}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STAGE: WORKSHEET
  if (stage === "worksheet") {
    const DIFF_LABEL: Record<Difficulty, string> = {
      foundation: "Foundation",
      core: "Core",
      advanced: "Advanced",
    };
    const DIFF_STYLE: Record<Difficulty, string> = {
      foundation: "text-clay-700 bg-clay-50 ring-clay-200",
      core: "text-forest-700 bg-forest-50 ring-forest-200",
      advanced: "text-gold-700 bg-gold-100 ring-gold-300",
    };

    const mcqQs = allQuestions.filter((q) => q.type !== "shortResponse");
    const mcqCorrect = quizResults.filter((r) => {
      const q = allQuestions.find((q2) => q2.id === r.questionId);
      return q && q.type !== "shortResponse" && r.correct;
    }).length;
    const classPct =
      mcqQs.length > 0 ? Math.round((mcqCorrect / mcqQs.length) * 100) : null;

    return (
      <div className="space-y-6">
        <StageBar />
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-forest-600">
              Worksheet recommendations
            </p>
            <h1 className="display mt-1 text-2xl font-bold text-forest-900 md:text-3xl">
              Here's what the class should focus on
            </h1>
            {classPct !== null && (
              <p className="mt-2 text-charcoal-soft">
                Class quiz score:{" "}
                <span className="font-semibold text-forest-900">{classPct}%</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ring-1 ${DIFF_STYLE[classDifficulty]}`}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Class level: {DIFF_LABEL[classDifficulty]}
            </div>
            {reaction && reaction !== "skip" && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-sand px-4 py-2 text-sm font-semibold text-charcoal ring-1 ring-sand-dark">
                {reaction === "loved" ? (
                  <ThumbsUp className="h-4 w-4 text-forest-600" aria-hidden />
                ) : (
                  <ThumbsDown className="h-4 w-4 text-clay-500" aria-hidden />
                )}
                {reaction === "loved" ? "Class loved it" : "Low engagement"}
              </div>
            )}
          </div>

          {activity && recommendations ? (
            <div className="space-y-4">
              {recommendations.recommended.length > 0 && (
                <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
                  <p className="text-xs font-bold uppercase tracking-wide text-forest-600">
                    Start with these questions
                  </p>
                  <p className="mt-0.5 text-sm text-charcoal-soft">
                    Matched to today's class level.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recommendations.recommended.map((n) => (
                      <span
                        key={n}
                        className="grid h-11 w-11 place-items-center rounded-xl bg-forest-600 text-base font-bold text-cream shadow-soft"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.challenge.length > 0 && (
                <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
                  <p className="text-xs font-bold uppercase tracking-wide text-gold-700">
                    Challenge questions
                  </p>
                  <p className="mt-0.5 text-sm text-charcoal-soft">
                    For students who finish early or want to stretch further.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recommendations.challenge.map((n) => (
                      <span
                        key={n}
                        className="grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-base font-bold text-gold-800 ring-1 ring-gold-300"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-sand px-4 py-3 text-sm ring-1 ring-sand-dark">
                <span className="font-semibold text-charcoal">Remind the class: </span>
                <span className="text-charcoal-soft">
                  all questions are on the worksheet — anyone who wants to attempt others is welcome
                  to.
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-forest-50 px-4 py-3 ring-1 ring-forest-200">
                <p className="text-sm text-forest-800">Need to print worksheets?</p>
                <Link
                  href="/admin/resources"
                  className="text-sm font-semibold text-forest-700 hover:underline"
                >
                  Go to Resources →
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-black/5">
              <p className="text-charcoal-soft">
                No worksheet activity linked to this topic yet.
              </p>
              <Link
                href="/admin/resources"
                className="mt-3 inline-block text-sm font-semibold text-forest-700 hover:underline"
              >
                Go to Resources to add one →
              </Link>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {!sessionSaved ? (
              <button
                onClick={() => handleSaveSession(classPct)}
                disabled={saving}
                className="rounded-2xl bg-forest-700 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-forest-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save session results"}
              </button>
            ) : (
              <div className="rounded-2xl bg-forest-50 px-5 py-3 text-sm font-semibold text-forest-700 ring-1 ring-forest-200">
                Session saved
              </div>
            )}
            <Button variant="secondary" onClick={() => startTopic(topic.id)}>
              Run again
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTopicData(null);
                setStage("pick");
              }}
            >
              Pick another topic
            </Button>
            <Link href={`/teacher/classes/${cls.id}`}>
              <Button>Finish session</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
