"use client";
/*
 * Adaptive worksheet: a virtual worksheet of 3-4 activities picked for this
 * student from the lesson's activity pool. Activity ids normally arrive via
 * the ?ids= query from the lesson player; without them the selection is
 * recomputed from stored progress. Each activity's blocks are then filtered
 * per student (block difficulty + top interest tag), answers autosave per
 * activity, and one submit completes the whole worksheet.
 */
import { use, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { filterBlocksForStudent } from "@/lib/activityRouting";
import {
  getTopic,
  getActivitiesByIds,
  getActivitiesForLesson,
  selectAdaptiveActivities,
  getVideosByIds,
  getProgressByStudent,
  getStudentActivityResponse,
  upsertStudentActivityResponse,
  logAnalyticsEvent,
  awardPoints,
} from "@/lib/supabaseService";
import { Button, EmptyState } from "@/components/ui/primitives";
import { DEMO_STUDENT_ID } from "@/data/people";
import { ArrowLeft, CheckCircle, Loader, Sparkles } from "lucide-react";
import { StudentBlockRenderer } from "../../activity/[activityId]/renderers";
import type { TaggedActivityBlock, BlockResponse, Activity } from "@/types";

type WorksheetSection = { activity: Activity; blocks: TaggedActivityBlock[] };

export default function StudentWorksheetPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  // Quiz average carried over from the lesson player session — fresher than
  // anything in student_progress, so it wins when present.
  const scoreParam = searchParams.get("score");
  const sessionScore = scoreParam !== null && !Number.isNaN(Number(scoreParam)) ? Number(scoreParam) : null;

  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const classId = currentUser?.classIds[0] ?? "";

  const [lessonTitle, setLessonTitle] = useState("");
  const [sections, setSections] = useState<WorksheetSection[]>([]);
  const [responses, setResponses] = useState<Record<string, BlockResponse[]>>({});
  const [feedback, setFeedback] = useState<{ activityTitle: string; feedback: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const topic = await getTopic(lessonId);
      setLessonTitle(topic?.title ?? "");

      // Interest signals from stored progress — the lesson player persists
      // watch data for each video before this step is reached.
      const allProgress = await getProgressByStudent(studentId);
      const watchTime: Record<string, number> = {};
      const completionPct: Record<string, number> = {};
      const reactions: Record<string, "like" | "dislike" | undefined> = {};
      if (allProgress.length > 0) {
        const videoIds = [...new Set(allProgress.map((p) => p.videoId))];
        const videos = await getVideosByIds(videoIds);
        const videoTagMap = new Map(videos.map((v) => [v.id, v.tags]));
        for (const prog of allProgress) {
          const tags = videoTagMap.get(prog.videoId) ?? [];
          for (const tag of tags) {
            watchTime[tag] = (watchTime[tag] ?? 0) + (prog.watchTimeSeconds ?? 0);
            completionPct[tag] = Math.max(completionPct[tag] ?? 0, prog.videoCompletionPercentage ?? 0);
            if (prog.videoReaction === "like") reactions[tag] = "like";
            else if (prog.videoReaction === "dislike" && reactions[tag] !== "like") reactions[tag] = "dislike";
          }
        }
      }

      const ids = idsParam ? idsParam.split(",").filter(Boolean) : [];
      let picked: Activity[];
      if (ids.length > 0) {
        picked = await getActivitiesByIds(ids);
      } else {
        const pool = await getActivitiesForLesson(lessonId);
        picked = selectAdaptiveActivities(pool, sessionScore, watchTime);
      }

      const quizScore = sessionScore ?? 50;
      const built = picked
        .map((activity) => ({
          activity,
          blocks: filterBlocksForStudent(
            activity.blocks, quizScore, watchTime, activity.topicTags ?? [], completionPct, reactions
          ) as TaggedActivityBlock[],
        }))
        .filter((s) => s.blocks.length > 0);
      setSections(built);

      // Resume saved answers; the worksheet counts as submitted only when
      // every activity on it has been submitted.
      const existing: Record<string, BlockResponse[]> = {};
      const feedbackList: { activityTitle: string; feedback: string }[] = [];
      let allSubmitted = built.length > 0 && Boolean(classId);
      await Promise.all(
        built.map(async (s) => {
          if (!classId) return;
          const resp = await getStudentActivityResponse(s.activity.id, studentId, classId);
          if (resp) {
            existing[s.activity.id] = resp.responses;
            if (!resp.submittedAt) allSubmitted = false;
            if (resp.teacherFeedback) {
              feedbackList.push({ activityTitle: s.activity.title, feedback: resp.teacherFeedback });
            }
          } else {
            allSubmitted = false;
          }
        })
      );
      setResponses(existing);
      setFeedback(feedbackList);
      setSubmitted(allSubmitted);
      setLoading(false);
    })();
  }, [lessonId, idsParam, sessionScore, studentId, classId]);

  const saveActivity = useCallback(
    async (activityId: string, rs: BlockResponse[], isSubmit = false) => {
      if (!classId) return;
      try {
        await upsertStudentActivityResponse({
          activityId,
          studentId,
          classId,
          responses: rs,
          submittedAt: isSubmit ? new Date().toISOString() : undefined,
        });
      } catch (e) {
        console.error(e);
      }
    },
    [classId, studentId]
  );

  const updateResponse = (activityId: string) => (r: BlockResponse) => {
    setResponses((prev) => {
      const next = [...(prev[activityId] ?? []).filter((x) => x.blockId !== r.blockId), r];
      saveActivity(activityId, next);
      return { ...prev, [activityId]: next };
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    for (const s of sections) {
      await saveActivity(s.activity.id, responses[s.activity.id] ?? [], true);
      await awardPoints(studentId, classId || null, "activity_completed", s.activity.id);
    }
    logAnalyticsEvent({
      userId: studentId,
      role: "student",
      eventType: "worksheet_submitted",
      classId,
      metadata: {
        lessonId,
        activityIds: sections.map((s) => s.activity.id).join(","),
      },
    });
    setSaving(false);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        title="No worksheet available"
        message="This lesson doesn't have any activities for you yet."
        action={
          <Link href="/student/classwork">
            <Button>Back to class work</Button>
          </Link>
        }
      />
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-20">
        <div
          className="overflow-hidden rounded-3xl text-cream shadow-hero"
          style={{ background: "linear-gradient(120deg, #204535, #3d7a5e)" }}
        >
          <div className="p-10 text-center">
            <p className="text-6xl">🎉</p>
            <h2 className="display mt-4 text-2xl font-bold">Worksheet complete!</h2>
            <p className="mt-2 text-forest-100/80">Your work has been saved. Your teacher can see it.</p>
          </div>
        </div>
        {feedback.length > 0 && (
          <div className="space-y-3">
            {feedback.map((f, i) => (
              <div key={i} className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
                <p className="text-xs font-bold uppercase tracking-widest text-forest-700">
                  Feedback from your teacher — {f.activityTitle}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-charcoal">{f.feedback}</p>
              </div>
            ))}
          </div>
        )}
        <Link href="/student/classwork">
          <Button className="w-full" size="lg">
            Back to class work
          </Button>
        </Link>
      </div>
    );
  }

  const totalTasks = sections.reduce(
    (sum, s) => sum + s.blocks.filter((b) => b.type !== "instruction" && b.type !== "image").length,
    0
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20">
      <Link
        href="/student/classwork"
        className="flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to class work
      </Link>

      {/* Header */}
      <div
        className="overflow-hidden rounded-3xl shadow-hero"
        style={{ background: "linear-gradient(120deg, #204535, #3d7a5e)" }}
      >
        <div className="px-6 py-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-400" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-widest text-forest-200/80">
              Your worksheet
            </p>
          </div>
          <h1 className="display mt-1 text-2xl font-bold text-cream">
            {lessonTitle || "Adaptive worksheet"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-forest-200/20 px-3 py-1 text-xs font-semibold text-cream">
              {sections.length} activit{sections.length !== 1 ? "ies" : "y"} · {totalTasks} task{totalTasks !== 1 ? "s" : ""}
            </span>
            <span className="rounded-full bg-gold-300/20 px-3 py-1 text-xs font-semibold text-gold-200">
              Personalised for you ✨
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
        <p className="text-sm font-bold uppercase tracking-wide text-charcoal-soft">Instructions</p>
        <ol className="mt-3 space-y-2 text-sm text-charcoal">
          {[
            "Work through each activity below in order.",
            "Your answers save automatically as you go.",
            "Press “Submit worksheet” at the bottom when you have finished everything.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-100 text-[10px] font-bold text-forest-700">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Activity sections */}
      {sections.map((section, si) => (
        <section key={section.activity.id} className="space-y-4">
          <div className="flex items-center gap-3 pt-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-forest-700 text-sm font-bold text-cream">
              {si + 1}
            </span>
            <div className="min-w-0">
              <h2 className="display truncate text-lg font-bold text-forest-900">
                {section.activity.title}
              </h2>
              <p className="text-xs text-charcoal-soft">
                Activity {si + 1} of {sections.length}
              </p>
            </div>
          </div>

          {section.blocks.map((block, bi) => (
            <StudentBlockRenderer
              key={block.id}
              block={block}
              index={bi}
              response={(responses[section.activity.id] ?? []).find((r) => r.blockId === block.id)}
              onChange={updateResponse(section.activity.id)}
              submitted={submitted}
            />
          ))}
        </section>
      ))}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-700 py-4 text-base font-bold text-cream shadow-lift transition hover:bg-forest-800 disabled:opacity-60"
      >
        {saving ? <Loader className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
        {saving ? "Saving…" : "Submit worksheet"}
      </button>
    </div>
  );
}
