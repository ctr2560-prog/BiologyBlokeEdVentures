"use client";
import { useState } from "react";
import { SectionHeader, StatCard, Badge } from "@/components/ui/primitives";
import {
  AnalyticsChartCard,
  BarChart,
  LineChart,
  DonutChart,
} from "@/components/analytics/Charts";
import { DataTable, type Column } from "@/components/ui/DataTable";
import {
  getAdminAnalytics,
  watchTimeByUnit,
  engagementByYearGroup,
  quizResultsByTopic,
  resourceDownloads,
  activeUsersOverTime,
  schoolUsageComparison,
  videoCompletionRates,
  getVideoAnalytics,
  formatWatchTime,
} from "@/lib/analytics";

export default function AdminAnalytics() {
  const a = getAdminAnalytics();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const videoStats = videoCompletionRates().sort((x, y) => y.views - x.views);
  const detail = selectedVideo ? getVideoAnalytics(selectedVideo) : null;

  type Row = (typeof videoStats)[number];
  const videoCols: Column<Row>[] = [
    {
      key: "title",
      header: "Reel",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{r.video.thumbEmoji}</span>
          <span className="font-semibold text-forest-900">{r.video.title}</span>
        </div>
      ),
    },
    { key: "views", header: "Views", align: "center", render: (r) => r.views },
    { key: "watch", header: "Avg watch", align: "center", render: (r) => formatWatchTime(r.avgWatchTime) },
    {
      key: "completion",
      header: "Completion",
      align: "center",
      render: (r) => <Badge tone={r.avgCompletion > 80 ? "forest" : r.avgCompletion > 50 ? "gold" : "clay"}>{r.avgCompletion}%</Badge>,
    },
    { key: "replays", header: "Replays", align: "center", render: (r) => r.replays },
    { key: "quiz", header: "Quiz", align: "center", render: (r) => `${r.avgQuiz}%` },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="Platform Analytics" subtitle="Whole-platform learning engagement — not surveillance, just insight" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total watch time" value={formatWatchTime(a.totalWatchTimeSeconds)} icon={<span>⏱️</span>} />
        <StatCard label="Video completions" value={a.totalCompletions} icon={<span>🎬</span>} tone="mist" />
        <StatCard label="Avg completion" value={`${a.avgCompletion}%`} icon={<span>📈</span>} tone="gold" />
        <StatCard label="Avg quiz score" value={`${a.avgQuizScore}%`} icon={<span>✅</span>} tone="clay" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartCard title="Watch time by unit" subtitle="Total minutes">
          <BarChart data={watchTimeByUnit().map((d) => ({ label: d.label, value: Math.round(d.value / 60) }))} unit="m" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Engagement by year group" subtitle="Avg completion %">
          <BarChart data={engagementByYearGroup()} unit="%" tone="#5c8aa8" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Quiz results by topic" subtitle="Highest & lowest engagement topics">
          <BarChart data={quizResultsByTopic()} unit="%" tone="#40916c" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Active users over time" subtitle="Monthly active learners">
          <LineChart data={activeUsersOverTime()} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Resource downloads" subtitle="Most downloaded resources">
          <BarChart data={resourceDownloads().slice(0, 6)} tone="#a47148" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="School usage" subtitle="Watch time (seconds) by school">
          <BarChart data={schoolUsageComparison().map((s) => ({ label: s.label, value: s.value }))} unit="s" tone="#8b5e3c" />
        </AnalyticsChartCard>
      </div>

      {/* Video performance table */}
      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">Content performance</h2>
        <DataTable
          columns={videoCols}
          rows={videoStats}
          keyOf={(r) => r.video.id}
          onRowClick={(r) => setSelectedVideo(r.video.id === selectedVideo ? null : r.video.id)}
        />
      </div>

      {/* Video detail drill-down */}
      {detail && detail.video && (
        <div className="rise-in grid grid-cols-1 gap-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 md:grid-cols-[auto_1fr]">
          <DonutChart value={detail.avgCompletion} label="Avg completion" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{detail.video.thumbEmoji}</span>
              <h3 className="display text-lg font-bold text-forest-900">{detail.video.title}</h3>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Views" value={detail.views} />
              <MiniStat label="Avg watch" value={formatWatchTime(detail.avgWatchTime)} />
              <MiniStat label="Replays" value={detail.replayCount} />
              <MiniStat label="Drop-off" value={`${detail.dropOff}%`} />
            </div>
            <div className="mt-4 rounded-2xl bg-gold-300/20 px-4 py-3 text-sm text-clay-600">
              💡 {detail.improvementNote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-cream/60 p-3">
      <p className="text-xs text-charcoal-soft">{label}</p>
      <p className="display text-lg font-bold text-forest-900">{value}</p>
    </div>
  );
}
