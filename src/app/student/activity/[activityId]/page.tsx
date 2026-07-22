"use client";
import { use, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { filterBlocksForStudent } from "@/lib/activityRouting";
import {
  getActivity,
  getVideosByIds,
  getProgressByStudent,
  getStudentActivityResponse,
  upsertStudentActivityResponse,
  logAnalyticsEvent,
  awardPoints,
} from "@/lib/supabaseService";
import { Button, EmptyState } from "@/components/ui/primitives";
import { DEMO_STUDENT_ID } from "@/data/people";
import { ArrowLeft, CheckCircle, Loader } from "lucide-react";
import { StudentBlockRenderer } from "./renderers";
import type { TaggedActivityBlock, BlockResponse, Activity } from "@/types";

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function StudentActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId");
  // Quiz average carried over from the lesson player session — fresher than
  // anything in student_progress, so it wins when present.
  const scoreParam = searchParams.get("score");
  const sessionScore = scoreParam !== null && !Number.isNaN(Number(scoreParam)) ? Number(scoreParam) : null;

  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const classId = currentUser?.classIds[0] ?? "";

  const [activity, setActivity] = useState<Activity | null>(null);
  const [filteredBlocks, setFilteredBlocks] = useState<TaggedActivityBlock[]>([]);
  const [responses, setResponses] = useState<BlockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [teacherFeedback, setTeacherFeedback] = useState<string | null>(null);

  const saveResponses = useCallback(
    async (rs: BlockResponse[], isSubmit = false) => {
      if (!classId) return;
      setSaving(true);
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
      setSaving(false);
    },
    [activityId, studentId, classId]
  );

  useEffect(() => {
    (async () => {
      const act = await getActivity(activityId);
      if (!act) { setLoading(false); return; }

      let quizScore = sessionScore ?? 50;
      const watchTime: Record<string, number> = {};

      // Load all progress for this student, then batch-load the watched videos
      // to build a per-tag watch time map across their full history.
      const allProgress = await getProgressByStudent(studentId);
      const completionPct: Record<string, number> = {};
      const reactions: Record<string, "like" | "dislike" | undefined> = {};

      if (allProgress.length > 0) {
        const videoIds = [...new Set(allProgress.map((p) => p.videoId))];
        const videos = await getVideosByIds(videoIds);
        const videoTagMap = new Map(videos.map((v) => [v.id, v.tags]));

        for (const prog of allProgress) {
          if (sessionScore === null && videoId && prog.videoId === videoId && prog.quizScore !== null && prog.quizScore !== undefined) {
            quizScore = Number(prog.quizScore);
          }
          const tags = videoTagMap.get(prog.videoId) ?? [];
          for (const tag of tags) {
            watchTime[tag] = (watchTime[tag] ?? 0) + (prog.watchTimeSeconds ?? 0);
            // Use max completion across multiple watches of same-tagged videos
            completionPct[tag] = Math.max(completionPct[tag] ?? 0, prog.videoCompletionPercentage ?? 0);
            // Like beats dislike if student has reacted differently to same-tagged videos
            if (prog.videoReaction === "like") reactions[tag] = "like";
            else if (prog.videoReaction === "dislike" && reactions[tag] !== "like") reactions[tag] = "dislike";
          }
        }
      }

      const filtered = filterBlocksForStudent(act.blocks, quizScore, watchTime, act.topicTags ?? [], completionPct, reactions);
      setActivity(act);
      setFilteredBlocks(filtered);

      if (classId) {
        const existing = await getStudentActivityResponse(activityId, studentId, classId);
        if (existing) {
          setResponses(existing.responses);
          if (existing.submittedAt) setSubmitted(true);
          setTeacherFeedback(existing.teacherFeedback ?? null);
        } else {
          logAnalyticsEvent({
            userId: studentId,
            role: "student",
            eventType: "activity_started",
            classId,
            metadata: { activityId },
          });
        }
      }

      setLoading(false);
    })();
  }, [activityId, studentId, classId, videoId, sessionScore]);

  const updateResponse = useCallback(
    (r: BlockResponse) => {
      setResponses((prev) => {
        const next = prev.filter((x) => x.blockId !== r.blockId);
        next.push(r);
        saveResponses(next);
        return next;
      });
    },
    [saveResponses]
  );

  const handleSubmit = async () => {
    await saveResponses(responses, true);
    logAnalyticsEvent({
      userId: studentId,
      role: "student",
      eventType: "activity_submitted",
      classId,
      metadata: { activityId, blockCount: responses.length },
    });
    await awardPoints(studentId, classId ?? null, "activity_completed", activityId);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!activity) {
    return (
      <EmptyState
        title="Activity not found"
        message="This activity may have been removed."
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
            <h2 className="display mt-4 text-2xl font-bold">Activity complete!</h2>
            <p className="mt-2 text-forest-100/80">Your work has been saved. Your teacher can see it.</p>
          </div>
        </div>
        {teacherFeedback && (
          <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-700">Feedback from your teacher</p>
            <p className="mt-2 whitespace-pre-wrap text-charcoal">{teacherFeedback}</p>
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
          <p className="text-xs font-bold uppercase tracking-widest text-forest-200/80">Activity</p>
          <h1 className="display mt-1 text-2xl font-bold text-cream">{activity.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-forest-200/20 px-3 py-1 text-xs font-semibold text-cream">
              {filteredBlocks.length} task{filteredBlocks.length !== 1 ? "s" : ""} for you
            </span>
            {filteredBlocks.length < activity.blocks.length && (
              <span className="rounded-full bg-gold-300/20 px-3 py-1 text-xs font-semibold text-gold-200">
                Personalised for you ✨
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Blocks */}
      {filteredBlocks.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-black/5">
          <p className="text-charcoal-soft">No tasks to show — check back after watching the video and completing the quiz.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBlocks.map((block, i) => (
            <StudentBlockRenderer
              key={block.id}
              block={block}
              index={i}
              response={responses.find((r) => r.blockId === block.id)}
              onChange={updateResponse}
              submitted={submitted}
            />
          ))}
        </div>
      )}

      {/* Submit */}
      {filteredBlocks.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-700 py-4 text-base font-bold text-cream shadow-lift transition hover:bg-forest-800 disabled:opacity-60"
        >
          {saving ? <Loader className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
          {saving ? "Saving…" : "Submit activity"}
        </button>
      )}
    </div>
  );
}
