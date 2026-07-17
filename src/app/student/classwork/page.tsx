"use client";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { SectionHeader, EmptyState } from "@/components/ui/primitives";
import { Leaf, PlayCircle } from "lucide-react";
import { mapVideo } from "@/lib/supabaseService";
import type { Video } from "@/types";

type RawAssignment = {
  id: string;
  class_id: string;
  unit_id: string;
  due_date: string | null;
  adaptive_tasks_enabled: boolean;
  explorer_points_enabled: boolean;
  delivery_mode: string;
  assignment_topics: { topic_id: string }[];
};

type RawTopic = { id: string; title: string; [k: string]: unknown };
type RawUnit = { id: string; title: string; [k: string]: unknown };
type RawProgress = {
  student_id: string;
  video_id: string;
  video_completion_percentage: number;
  [k: string]: unknown;
};

type EnrichedAssignment = RawAssignment & {
  unit: RawUnit | null;
  topicsWithVideos: { topic: RawTopic | null; videos: Video[] }[];
};

export default function ClassWork() {
  useApp();
  const [enriched, setEnriched] = useState<EnrichedAssignment[]>([]);
  const [progress, setProgress] = useState<RawProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/classwork")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        const assignments: RawAssignment[] = data.assignments ?? [];
        const units: Record<string, RawUnit> = data.units ?? {};
        const topics: Record<string, RawTopic> = data.topics ?? {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const videosByTopic: Record<string, any[]> = data.videosByTopic ?? {};

        const enrichedList = assignments.map((a) => ({
          ...a,
          unit: units[a.unit_id] ?? null,
          topicsWithVideos: a.assignment_topics.map((at) => ({
            topic: topics[at.topic_id] ?? null,
            videos: (videosByTopic[at.topic_id] ?? []).map(mapVideo),
          })),
        }));

        setEnriched(enrichedList);
        setProgress(data.progress ?? []);
      })
      .catch(() => setError("Failed to load class work."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn't load class work"
        message={error}
      />
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
                Due {a.due_date}
                {a.explorer_points_enabled && " · points enabled"}
                {a.adaptive_tasks_enabled && " · adaptive"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {a.topicsWithVideos.map(({ topic, videos }) => {
              if (!topic) return null;
              const topicProgress = videos.map((v) =>
                progress.find((p) => p.video_id === v.id)
              );
              // A reel counts as done once the student has a saved progress row
              // for it (written on every advance through the swipe feed), so a
              // finished lesson reads as complete instead of demanding a ≥90%
              // watch of every clip.
              const watchedCount = topicProgress.filter((p) => p != null).length;
              const totalMins = Math.round(
                videos.reduce((s, v) => s + v.durationSeconds, 0) / 60
              );
              const overallPct = videos.length
                ? Math.round((watchedCount / videos.length) * 100)
                : 0;

              return (
                <div
                  key={topic.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5"
                >
                  <div
                    className="relative flex items-center gap-4 p-5"
                    style={{ background: "linear-gradient(135deg, #2c5844 0%, #3d7a5e 100%)" }}
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                      <PlayCircle className="h-6 w-6 text-cream" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-forest-100/70">
                        Lesson
                      </p>
                      <h3 className="display text-base font-bold text-cream leading-snug">
                        {topic.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-forest-100/70">
                        {videos.length} reel{videos.length !== 1 ? "s" : ""} · {totalMins}m ·{" "}
                        {watchedCount}/{videos.length} done
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/student/lesson/${topic.id}`}>
                        <button
                          type="button"
                          className="rounded-full bg-cream px-5 py-2 text-sm font-bold text-forest-900 shadow-soft transition hover:bg-white"
                        >
                          {watchedCount === videos.length && videos.length > 0
                            ? "Review"
                            : watchedCount > 0
                            ? "Continue"
                            : "Start lesson"}
                        </button>
                      </Link>
                    </div>
                  </div>

                  <div className="h-1.5 bg-sand">
                    <div
                      className="h-full bg-forest-500 transition-all duration-500"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
