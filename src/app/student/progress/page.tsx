"use client";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, StatCard, Badge, ProgressBar } from "@/components/ui/primitives";
import { AnalyticsChartCard, DonutChart } from "@/components/analytics/Charts";
import { getProgressByStudent, getVideo, getTopic } from "@/lib/supabaseService";
import { formatWatchTime } from "@/lib/analytics";
import { DEMO_STUDENT_ID } from "@/data/people";
import type { StudentProgress } from "@/types";
import { Film } from "lucide-react";

export default function StudentProgress() {
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;

  const [rows, setRows] = useState<StudentProgress[]>([]);
  const [videoTitles, setVideoTitles] = useState<Map<string, string>>(new Map());
  const [topicTitles, setTopicTitles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const progress = await getProgressByStudent(studentId);
      setRows(progress);

      const uniqueVideoIds = [...new Set(progress.map((p) => p.videoId))];
      const uniqueTopicIds = [...new Set(progress.map((p) => p.topicId))];

      const [videos, topics] = await Promise.all([
        Promise.all(uniqueVideoIds.map((id) => getVideo(id))),
        Promise.all(uniqueTopicIds.map((id) => getTopic(id))),
      ]);

      const vMap = new Map<string, string>();
      uniqueVideoIds.forEach((id, i) => {
        if (videos[i]) vMap.set(id, videos[i]!.title);
      });
      const tMap = new Map<string, string>();
      uniqueTopicIds.forEach((id, i) => {
        if (topics[i]) tMap.set(id, topics[i]!.title);
      });

      setVideoTitles(vMap);
      setTopicTitles(tMap);
      setLoading(false);
    }
    load();
  }, [studentId]);

  const scores = rows.map((p) => p.quizScore).filter((s): s is number => s !== null);
  const avgQuiz = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalWatchTime = rows.reduce((a, p) => a + p.watchTimeSeconds, 0);
  const worksheetsCompleted = rows.filter((p) => p.worksheetCompleted).length;
  const avgCompletion = rows.length
    ? Math.round(rows.reduce((a, p) => a + p.videoCompletionPercentage, 0) / rows.length)
    : 0;

  const strengthTopicIds = [
    ...new Set(rows.filter((p) => (p.quizScore ?? 0) >= 80).map((p) => p.topicId)),
  ];
  const gapTopicIds = [
    ...new Set(rows.filter((p) => p.quizScore !== null && p.quizScore < 50).map((p) => p.topicId)),
  ];

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="My Progress" subtitle="Look how far you've explored" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Reels watched" value={rows.length} />
        <StatCard label="Total watch time" value={formatWatchTime(totalWatchTime)} tone="mist" />
        <StatCard label="Avg quiz score" value={`${avgQuiz}%`} tone="gold" />
        <StatCard label="Worksheets done" value={worksheetsCompleted} tone="clay" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
        <AnalyticsChartCard title="Overall completion" subtitle="Across your reels">
          <DonutChart value={avgCompletion} label="Avg completion" />
        </AnalyticsChartCard>
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-3xl bg-forest-50 p-5 ring-1 ring-forest-100">
            <h3 className="display font-semibold text-forest-900">Your strongest topics</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {strengthTopicIds.length ? (
                strengthTopicIds.map((id) => (
                  <Badge key={id} tone="forest">{topicTitles.get(id) ?? id}</Badge>
                ))
              ) : (
                <span className="text-sm text-charcoal-soft">Keep watching to build strengths!</span>
              )}
            </div>
          </div>
          <div className="rounded-3xl bg-clay-400/10 p-5 ring-1 ring-clay-400/25">
            <h3 className="display font-semibold text-forest-900">Areas to grow</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {gapTopicIds.length ? (
                gapTopicIds.map((id) => (
                  <Badge key={id} tone="clay">{topicTitles.get(id) ?? id}</Badge>
                ))
              ) : (
                <span className="text-sm text-charcoal-soft">Nothing to worry about, great job!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">Recent achievements</h2>
        {rows.length === 0 ? (
          <p className="rounded-3xl bg-white p-5 text-sm text-charcoal-soft shadow-soft">
            No activity yet. Start watching reels in Class Work!
          </p>
        ) : (
          <div className="space-y-2">
            {[...rows]
              .sort((a, b) => b.lastActive.localeCompare(a.lastActive))
              .map((p) => {
                const strong = (p.quizScore ?? 0) >= 80;
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700">
                      <Film className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-forest-900">
                        {videoTitles.get(p.videoId) ?? "Video"}
                      </p>
                      <p className="text-xs text-charcoal-soft">
                        {topicTitles.get(p.topicId) ?? "Topic"} · watched {p.videoCompletionPercentage}%
                      </p>
                      <div className="mt-1.5 max-w-xs">
                        <ProgressBar value={p.videoCompletionPercentage} tone={strong ? "forest" : "gold"} />
                      </div>
                    </div>
                    {p.quizScore !== null && (
                      <Badge tone={strong ? "forest" : "gold"}>{p.quizScore}% quiz</Badge>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
