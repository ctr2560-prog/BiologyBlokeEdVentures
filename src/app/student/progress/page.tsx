"use client";
import { useApp } from "@/lib/store";
import { SectionHeader, StatCard, Badge, ProgressBar } from "@/components/ui/primitives";
import { AnalyticsChartCard, DonutChart } from "@/components/analytics/Charts";
import { getStudentAnalytics, formatWatchTime } from "@/lib/analytics";
import { getVideo, getTopic } from "@/lib/dataService";
import { DEMO_STUDENT_ID } from "@/data/people";
import { Film } from "lucide-react";

export default function StudentProgress() {
  const { currentUser, version } = useApp();
  void version;
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const a = getStudentAnalytics(studentId);

  return (
    <div className="space-y-6">
      <SectionHeader title="My Progress" subtitle="Look how far you've explored " />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Reels watched" value={a.videosWatched} />
        <StatCard label="Total watch time" value={formatWatchTime(a.totalWatchTime)} tone="mist" />
        <StatCard label="Avg quiz score" value={`${a.avgQuiz}%`} tone="gold" />
        <StatCard label="Worksheets done" value={a.worksheetsCompleted} tone="clay" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
        <AnalyticsChartCard title="Overall completion" subtitle="Across your reels">
          <DonutChart value={a.avgCompletion} label="Avg completion" />
        </AnalyticsChartCard>
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-3xl bg-forest-50 p-5 ring-1 ring-forest-100">
            <h3 className="display font-semibold text-forest-900"> Your strongest topics</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {a.strengths.length ? a.strengths.map((t) => <Badge key={t} tone="forest">{t}</Badge>) : <span className="text-sm text-charcoal-soft">Keep watching to build strengths!</span>}
            </div>
          </div>
          <div className="rounded-3xl bg-clay-400/10 p-5 ring-1 ring-clay-400/25">
            <h3 className="display font-semibold text-forest-900"> Areas to grow</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {a.gaps.length ? a.gaps.map((t) => <Badge key={t} tone="clay">{t}</Badge>) : <span className="text-sm text-charcoal-soft">Nothing to worry about, great job!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Recent achievements / history */}
      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">Recent achievements</h2>
        <div className="space-y-2">
          {a.rows.map((p) => {
            const strong = (p.quizScore ?? 0) >= 80;
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700"><Film className="h-5 w-5" aria-hidden /></span>
                <div className="flex-1">
                  <p className="font-semibold text-forest-900">{getVideo(p.videoId)?.title}</p>
                  <p className="text-xs text-charcoal-soft">{getTopic(p.topicId)?.title} · watched {p.videoCompletionPercentage}%</p>
                  <div className="mt-1.5 max-w-xs"><ProgressBar value={p.videoCompletionPercentage} tone={strong ? "forest" : "gold"} /></div>
                </div>
                {p.quizScore !== null && <Badge tone={strong ? "forest" : "gold"}>{p.quizScore}% quiz</Badge>}
                {p.clickedCurious && <span title="Curious explorer"></span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
