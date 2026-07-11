"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { SectionHeader, Badge, ProgressBar, EmptyState } from "@/components/ui/primitives";
import { Leaf, Film } from "lucide-react";
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.topicsWithVideos.flatMap(({ topic, videos }) =>
              videos.map((v) => {
                const prog = progress.find((p) => p.videoId === v.id);
                const pct = prog?.videoCompletionPercentage ?? 0;
                const done = pct >= 90;
                return (
                  <Link
                    key={v.id}
                    href={`/student/watch/${v.id}`}
                    className="card-lift group overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5"
                  >
                    <div
                      className="relative flex h-36 items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #1b4332 0%, #40916c 100%)" }}
                    >
                      <Film
                        className="h-12 w-12 text-cream/90 drop-shadow-lg transition-transform group-hover:scale-110"
                        aria-hidden
                        strokeWidth={1.5}
                      />
                      <span className="absolute left-3 top-3">
                        <Badge tone="gold">+20 pts</Badge>
                      </span>
                      {done && (
                        <span className="absolute right-3 top-3">
                          <Badge tone="forest">Done</Badge>
                        </span>
                      )}
                      <span className="glass-dark absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold text-cream">
                        {Math.round(v.durationSeconds / 60)}m
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold text-forest-600">{topic?.title}</p>
                      <h3 className="display font-bold leading-snug text-forest-900">{v.title}</h3>
                      <div className="mt-3">
                        <ProgressBar value={pct} tone={done ? "forest" : "gold"} showLabel />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-forest-700">
                        {done ? "Review" : pct > 0 ? "Continue" : "Start mission"}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
