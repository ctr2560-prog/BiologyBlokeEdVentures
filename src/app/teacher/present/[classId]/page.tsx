"use client";
/*
 * Teacher-led "Present" mode. The teacher runs a reel on the projector for the
 * whole class (no student devices), leads a discussion of the quick-check, taps
 * a quick class pulse, and gets support / core / extension groupings to run as
 * stations. No per-student data is captured; the pulse is the teacher's read.
 */
import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { SectionHeader, Button, Badge, EmptyState } from "@/components/ui/primitives";
import {
  getClass,
  getTopic,
  getTopicsByUnit,
  getVideosByTopic,
  getQuizByTopic,
  getResource,
} from "@/lib/dataService";
import { adaptiveTasks } from "@/data/content";
import { taskTypeMeta } from "@/lib/adaptive";
import type { TaskType } from "@/types";
import { Film, Play, Check, ArrowLeft, ArrowRight, Compass } from "lucide-react";

type Stage = "watch" | "discuss" | "pulse" | "groups";
const bandTypes: TaskType[] = ["support", "core", "extension"];
const bandLabel: Record<string, string> = {
  support: "Needs support",
  core: "On track",
  extension: "Ready to extend",
};

export default function PresentPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { version } = useApp();

  const cls = useMemo(() => {
    void version;
    return getClass(classId);
  }, [version, classId]);

  const topics = useMemo(() => {
    if (!cls) return [];
    return cls.assignedUnitIds
      .flatMap((u) => getTopicsByUnit(u))
      .filter((t) => getVideosByTopic(t.id).length > 0);
  }, [cls]);

  const [topicId, setTopicId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("watch");
  const [watched, setWatched] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pulse, setPulse] = useState<TaskType | null>(null);

  if (!cls) {
    return <EmptyState title="Class not found" message="This class may have been removed." />;
  }

  const topic = topicId ? getTopic(topicId) : null;
  const video = topic ? getVideosByTopic(topic.id)[0] : null;
  const quiz = topic ? getQuizByTopic(topic.id) : null;

  const startTopic = (id: string) => {
    setTopicId(id);
    setStage("watch");
    setWatched(false);
    setQIndex(0);
    setRevealed(false);
    setPulse(null);
  };

  const taskFor = (type: TaskType) =>
    adaptiveTasks.find((t) => t.topicId === topic?.id && t.type === type) ??
    adaptiveTasks.find((t) => t.type === type);

  // ---- Topic picker ----
  if (!topic) {
    return (
      <div className="space-y-6">
        <Link href={`/teacher/classes/${cls.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to class
        </Link>
        <SectionHeader
          title="Present to the class"
          subtitle={`${cls.name} · one screen, no devices needed. Pick a reel to run together.`}
        />
        {topics.length === 0 ? (
          <EmptyState title="Nothing to present yet" message="Assign a unit to this class first, then come back to run it on the projector." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => {
              const v = getVideosByTopic(t.id)[0];
              return (
                <button
                  key={t.id}
                  onClick={() => startTopic(t.id)}
                  className="card-lift overflow-hidden rounded-3xl bg-white text-left shadow-soft ring-1 ring-black/5"
                >
                  <div className="flex h-28 items-center justify-center" style={{ background: "linear-gradient(135deg, #1b4332, #40916c)" }}>
                    <Film className="h-10 w-10 text-cream/90" aria-hidden strokeWidth={1.5} />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-forest-600">{t.title}</p>
                    <h3 className="display font-bold text-forest-900">{v?.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-charcoal-soft">{v?.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const questions = quiz?.questions ?? [];
  const q = questions[qIndex];

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => setTopicId(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All reels
        </button>
        <div className="flex items-center gap-1.5">
          {(["watch", "discuss", "pulse", "groups"] as Stage[]).map((s, i) => (
            <span key={s} className={`h-1.5 rounded-full transition-all ${stage === s ? "w-8 bg-forest-600" : "w-2 bg-sand-dark"}`} title={s} />
          ))}
        </div>
      </div>

      {/* WATCH */}
      {stage === "watch" && video && (
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold text-forest-600">{topic.title}</p>
          <h1 className="display text-3xl font-bold text-forest-900 md:text-4xl">{video.title}</h1>
          <div className="relative mt-5 flex aspect-video items-center justify-center overflow-hidden rounded-3xl shadow-hero" style={{ background: "linear-gradient(160deg, #0d2419, #1b4332 55%, #2d6a4f)" }}>
            <Film className="h-24 w-24 text-cream/20" aria-hidden strokeWidth={1} />
            {!watched && (
              <button onClick={() => setWatched(true)} aria-label="Play reel" className="absolute grid h-24 w-24 place-items-center rounded-full glass text-forest-800 shadow-lift transition-transform hover:scale-105">
                <Play className="h-10 w-10" aria-hidden />
              </button>
            )}
            {watched && (
              <div className="glass-dark absolute inset-x-0 bottom-0 p-5 text-cream">
                <p className="text-sm font-semibold uppercase tracking-wide text-forest-100/80">Learning intention</p>
                <p className="text-lg">{video.learningIntent}</p>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <Button size="lg" disabled={!watched} onClick={() => { setStage("discuss"); }}>
              {watched ? "Discuss as a class" : "Play the reel first"} <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* DISCUSS (quiz, tap to reveal) */}
      {stage === "discuss" && (
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold text-forest-600">Quick check together</p>
          {q ? (
            <>
              <h1 className="display mt-1 text-2xl font-bold text-forest-900 md:text-3xl">
                {qIndex + 1}. {q.questionText}
              </h1>
              <div className="mt-5 space-y-3">
                {q.type === "shortResponse" ? (
                  <div className={`rounded-3xl p-5 text-lg ${revealed ? "bg-forest-50 text-forest-900" : "bg-white text-charcoal-soft ring-1 ring-sand"}`}>
                    {revealed ? q.correctAnswer : "Discuss with the class, then reveal the model answer."}
                  </div>
                ) : (
                  q.options.map((opt) => {
                    const correct = opt === q.correctAnswer;
                    return (
                      <div
                        key={opt}
                        className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-lg transition-colors ${
                          revealed && correct ? "border-forest-600 bg-forest-50 font-semibold text-forest-900" : "border-sand text-charcoal"
                        }`}
                      >
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${revealed && correct ? "bg-forest-600 text-white" : "border-2 border-sand-dark"}`}>
                          {revealed && correct && <Check className="h-4 w-4" aria-hidden />}
                        </span>
                        {opt}
                      </div>
                    );
                  })
                )}
              </div>
              {revealed && q.explanation && (
                <p className="mt-4 rounded-2xl bg-gold-300/20 px-4 py-3 text-sm text-clay-600">{q.explanation}</p>
              )}
              <div className="mt-6 flex justify-between">
                {!revealed ? (
                  <Button variant="secondary" onClick={() => setRevealed(true)}>Reveal answer</Button>
                ) : (
                  <span />
                )}
                <Button
                  onClick={() => {
                    if (qIndex + 1 < questions.length) { setQIndex(qIndex + 1); setRevealed(false); }
                    else setStage("pulse");
                  }}
                  disabled={!revealed}
                >
                  {qIndex + 1 < questions.length ? "Next question" : "How did the class go?"} <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <p className="text-charcoal-soft">No quick check for this reel, discuss the success criteria instead.</p>
              <ul className="mt-3 space-y-2">
                {video?.successCriteria.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-charcoal"><Check className="mt-1 h-4 w-4 text-forest-600" aria-hidden /> {c}</li>
                ))}
              </ul>
              <Button className="mt-6" onClick={() => setStage("pulse")}>How did the class go? <ArrowRight className="h-4 w-4" aria-hidden /></Button>
            </div>
          )}
        </div>
      )}

      {/* PULSE */}
      {stage === "pulse" && (
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="display text-2xl font-bold text-forest-900 md:text-3xl">How did the class go?</h1>
          <p className="mt-2 text-charcoal-soft">Your read of the room sets where to focus. Everyone still gets a task.</p>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { type: "support" as TaskType, label: "Most need support" },
              { type: "core" as TaskType, label: "A real mix" },
              { type: "extension" as TaskType, label: "Most are flying" },
            ].map((b) => {
              const meta = taskTypeMeta(b.type);
              return (
                <button
                  key={b.type}
                  onClick={() => { setPulse(b.type); setStage("groups"); }}
                  className="card-lift rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-black/5"
                >
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-cream" style={{ background: meta.color }}>
                    <meta.Icon className="h-7 w-7" aria-hidden strokeWidth={1.75} />
                  </span>
                  <p className="display mt-3 font-bold text-forest-900">{b.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* GROUPS */}
      {stage === "groups" && (
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold text-forest-600">Differentiate the class</p>
            <h1 className="display mt-1 text-2xl font-bold text-forest-900 md:text-3xl">Three groups, ready to run</h1>
            <p className="mt-2 text-charcoal-soft">Set these up as stations or hand out the linked resources.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {bandTypes.map((type) => {
              const meta = taskTypeMeta(type);
              const task = taskFor(type);
              const resource = task?.linkedResourceId ? getResource(task.linkedResourceId) : undefined;
              const focus = pulse === type;
              return (
                <div key={type} className={`rounded-3xl bg-white p-5 shadow-soft ring-1 transition-all ${focus ? "ring-2 ring-forest-500 shadow-lift" : "ring-black/5"}`}>
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl text-cream" style={{ background: meta.color }}>
                      <meta.Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                    </span>
                    {focus && <Badge tone="forest">Focus here</Badge>}
                  </div>
                  <p className="display mt-3 font-bold text-forest-900">{bandLabel[type]}</p>
                  {task ? (
                    <>
                      <p className="mt-1 text-sm font-semibold text-forest-700">{task.title}</p>
                      <p className="mt-1 text-sm text-charcoal-soft">{task.instructions}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone="sand">~{task.estimatedTimeMinutes} min</Badge>
                        {resource && <Badge tone="mist">{resource.title}</Badge>}
                      </div>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-charcoal-soft">Discuss and extend as a group.</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => { setStage("watch"); setWatched(false); }}>
              <Compass className="h-4 w-4" aria-hidden /> Run it again
            </Button>
            <Button onClick={() => setTopicId(null)}>Finish, back to reels</Button>
          </div>
        </div>
      )}
    </div>
  );
}
