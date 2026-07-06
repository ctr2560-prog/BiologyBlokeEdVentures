"use client";
import Link from "next/link";
import { SectionHeader, StatCard, Button, Badge } from "@/components/ui/primitives";
import { Film, Library, FolderTree, School, BarChart3 } from "lucide-react";
import {
  AnalyticsChartCard,
  BarChart,
  LineChart,
} from "@/components/analytics/Charts";
import { InsightCard } from "@/components/cards/InsightCards";
import {
  getAdminAnalytics,
  watchTimeByUnit,
  activeUsersOverTime,
  quizResultsByTopic,
  formatWatchTime,
  videoCompletionRates,
} from "@/lib/analytics";

export default function AdminDashboard() {
  const a = getAdminAnalytics();
  const watchUnits = watchTimeByUnit().map((d) => ({
    label: d.label,
    value: Math.round(d.value / 60),
  }));
  const topVideos = videoCompletionRates()
    .sort((x, y) => y.views - x.views)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Platform Dashboard"
        subtitle="Your whole conservation-education ecosystem at a glance"
        action={
          <Link href="/admin/content">
            <Button> Add content</Button>
          </Link>
        }
      />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Schools" value={a.totalSchools} sublabel={`${a.activeSchools} active`} />
        <StatCard label="Active teachers" value={a.activeTeachers} tone="mist" />
        <StatCard label="Active students" value={a.activeStudents} tone="gold" />
        <StatCard label="Videos" value={a.totalVideos} sublabel={`${a.totalUnits} units`} tone="clay" />
        <StatCard label="Avg watch time" value={formatWatchTime(a.avgWatchTimeSeconds)} />
        <StatCard label="Avg quiz score" value={`${a.avgQuizScore}%`} tone="mist" />
        <StatCard label="Completion rate" value={`${a.avgCompletion}%`} tone="gold" />
        <StatCard label="Most popular topic" value={a.popularTopic} tone="clay" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartCard title="Watch time by unit" subtitle="Total minutes watched">
          <BarChart data={watchUnits} unit="m" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Active users over time" subtitle="Monthly active learners">
          <LineChart data={activeUsersOverTime()} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Quiz results by topic" subtitle="Average score %">
          <BarChart data={quizResultsByTopic()} unit="%" tone="#5c8aa8" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Most watched reels" subtitle="Views · completion">
          <div className="space-y-3">
            {topVideos.map((v) => (
              <div key={v.video.id} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest-50 text-forest-700">
                  <Film className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forest-900">{v.video.title}</p>
                  <p className="text-xs text-charcoal-soft">
                    {v.views} views · {v.avgCompletion}% completion
                  </p>
                </div>
                <Badge tone={v.avgCompletion > 80 ? "forest" : "gold"}>{v.avgQuiz}% quiz</Badge>
              </div>
            ))}
          </div>
        </AnalyticsChartCard>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightCard title="Wildlife stories driving curiosity" tone="mist">
          Koala & tiger reels are generating the most “I’m curious” clicks this week -
          consider featuring them on the student home.
        </InsightCard>
        <InsightCard title="Content to review" tone="gold">
          The wetlands reel has a higher drop-off. A shorter hook could lift completion.
        </InsightCard>
        <InsightCard title="Growing schools" tone="forest">
          Coastal Ridge (trial) has strong early engagement, a good candidate to convert.
        </InsightCard>
      </div>

      {/* Manage shortcuts */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { href: "/admin/content", label: "Content Library", Icon: Library },
          { href: "/admin/units", label: "Units & Topics", Icon: FolderTree },
          { href: "/admin/schools", label: "Schools", Icon: School },
          { href: "/admin/analytics", label: "Full Analytics", Icon: BarChart3 },
        ].map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="card-lift rounded-3xl bg-white p-5 text-center shadow-soft ring-1 ring-black/5"
          >
            <s.Icon className="mx-auto h-8 w-8 text-forest-600" aria-hidden strokeWidth={1.75} />
            <p className="mt-2 text-sm font-semibold text-forest-900">{s.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
