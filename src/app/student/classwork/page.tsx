"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { SectionHeader, Badge, ProgressBar, EmptyState } from "@/components/ui/primitives";
import { Leaf, Film, PlayCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  getAssignmentsByClass,
  getUnit,
  getTopic,
  getVideosByTopic,
  getProgressByStudent,
} from "@/lib/supabaseService";
import { DEMO_STUDENT_ID } from "@/data/people";
import type { Assignment, Unit, Topic, Video, StudentProgress } from "@/types";

type EnrichedAssignment = Assignment & {
  unit: Unit | null;
  topicsWithVideos: { topic: Topic | null; videos: Video[] }[];
};

export default function ClassWork() {
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const classId = currentUser?.classIds[0];

  const [enriched, setEnriched] = useState<EnrichedAssignment[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }
    Promise.all([
      getAssignmentsByClass(classId),
      getProgressByStudent(studentId),
    ]).then(async ([assignments, prog]) => {
      setProgress(prog);
      const enrichedList = await Promise.all(
        assignments.map(async (a) => {
          const [unit, topicsWithVideos] = await Promise.all([
            getUnit(a.unitId),
            Promise.all(
              a.topicIds.map(async (tid) => ({
                topic: await getTopic(tid),
                videos: await getVideosByTopic(tid),
              }))
            ),
          ]);
          return { ...a, unit, topicsWithVideos };
        })
      );
      setEnriched(enrichedList);
      setLoading(false);
    });
  }, [classId, studentId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-charcoal/8" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-10 w-64 animate-pulse rounded-2xl bg-charcoal/8" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-56 animate-pulse rounded-3xl bg-charcoal/8" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (enriched.length === 0) {
    return (
      <EmptyState
        title="No class work yet"
        message="Your teacher hasn't assigned any Edventures, check back soon!"
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Class Work" subtitle="Your assigned Edventures, watch, learn and earn points" />

      {enriched.map((a) => (
        <div key={a.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700">
              <Leaf className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="display text-lg font-bold text-forest-900">{a.unit?.title}</h2>
              <p className="text-xs text-charcoal-soft">
                Due {a.dueDate}
                {a.explorerPointsEnabled && " · points enabled"}
                {a.adaptiveTasksEnabled && " · adaptive"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {a.topicsWithVideos.map(({ topic, videos }) => {
              if (!topic) return null;
              const topicProgress = videos.map((v) => progress.find((p) => p.videoId === v.id));
              const watchedCount = topicProgress.filter((p) => (p?.videoCompletionPercentage ?? 0) >= 90).length;
              const totalMins = Math.round(videos.reduce((s, v) => s + v.durationSeconds, 0) / 60);
              const overallPct = videos.length ? Math.round((watchedCount / videos.length) * 100) : 0;
              const isExpanded = expanded[topic.id] ?? false;

              return (
                <div key={topic.id} className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
                  {/* Lesson header card */}
                  <div
                    className="relative flex items-center gap-4 p-5"
                    style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)" }}
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                      <PlayCircle className="h-6 w-6 text-cream" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-forest-100/70">Lesson</p>
                      <h3 className="display text-base font-bold text-cream leading-snug">{topic.title}</h3>
                      <p className="mt-0.5 text-xs text-forest-100/70">
                        {videos.length} reel{videos.length !== 1 ? "s" : ""} · {totalMins}m · {watchedCount}/{videos.length} done
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/student/lesson/${topic.id}`}>
                        <button
                          type="button"
                          className="rounded-full bg-cream px-5 py-2 text-sm font-bold text-forest-900 shadow-soft transition hover:bg-white"
                        >
                          {watchedCount === videos.length && videos.length > 0 ? "Review" : watchedCount > 0 ? "Continue" : "Start lesson"}
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-sand">
                    <div
                      className="h-full bg-forest-500 transition-all duration-500"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>

                  {/* Toggle individual reels */}
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [topic.id]: !isExpanded }))}
                    className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-charcoal-soft hover:text-forest-700 transition-colors"
                  >
                    <span>Individual reels</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                      {videos.map((v) => {
                        const prog = progress.find((p) => p.videoId === v.id);
                        const pct = prog?.videoCompletionPercentage ?? 0;
                        const done = pct >= 90;
                        return (
                          <Link
                            key={v.id}
                            href={`/student/watch/${v.id}`}
                            className="card-lift group overflow-hidden rounded-2xl bg-cream ring-1 ring-black/5"
                          >
                            <div
                              className="relative flex h-24 items-center justify-center"
                              style={{ background: "linear-gradient(135deg, #1b4332 0%, #40916c 100%)" }}
                            >
                              <Film className="h-8 w-8 text-cream/80 transition-transform group-hover:scale-110" aria-hidden strokeWidth={1.5} />
                              {done && (
                                <span className="absolute right-2 top-2">
                                  <Badge tone="forest">Done</Badge>
                                </span>
                              )}
                              <span className="glass-dark absolute bottom-1.5 right-2 rounded-full px-2 py-0.5 text-xs font-semibold text-cream">
                                {Math.round(v.durationSeconds / 60)}m
                              </span>
                            </div>
                            <div className="p-3">
                              <p className="text-xs font-bold leading-snug text-forest-900">{v.title}</p>
                              <div className="mt-2">
                                <ProgressBar value={pct} tone={done ? "forest" : "gold"} showLabel />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
