"use client";
import { useEffect, useState } from "react";
import { SectionHeader, StatCard, Badge } from "@/components/ui/primitives";
import { Film, Loader } from "lucide-react";
import {
  AnalyticsChartCard,
  BarChart,
  LineChart,
  DonutChart,
} from "@/components/analytics/Charts";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatWatchTime } from "@/lib/analytics";
import {
  getProgress,
  getVideos,
  getTopics,
  getUnits,
  getClasses,
} from "@/lib/supabaseService";
import type { StudentProgress, Video, Topic, Unit, ClassGroup } from "@/types";

interface VideoStat {
  video: Video;
  views: number;
  avgWatchTime: number;
  avgCompletion: number;
  replays: number;
  avgQuiz: number;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getProgress(), getVideos(), getTopics(), getUnits(), getClasses()]).then(
      ([pr, vi, to, un, cl]) => {
        setProgress(pr); setVideos(vi); setTopics(to); setUnits(un); setClasses(cl);
        setLoading(false);
      }
    );
  }, []);

  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  const totalWatchTime = progress.reduce((a, p) => a + p.watchTimeSeconds, 0);
  const completions = progress.filter((p) => p.videoCompletionPercentage >= 90).length;
  const avgCompletion = avg(progress.map((p) => p.videoCompletionPercentage));
  const quizNums = progress.map((p) => p.quizScore).filter((s): s is number => s !== null);
  const avgQuizScore = avg(quizNums);

  // Watch time by unit
  const watchByUnit = units.map((u) => {
    const unitTopicIds = new Set(topics.filter((t) => t.unitId === u.id).map((t) => t.id));
    const mins = Math.round(
      progress.filter((p) => unitTopicIds.has(p.topicId)).reduce((a, p) => a + p.watchTimeSeconds, 0) / 60
    );
    return { label: u.title.slice(0, 22), value: mins };
  }).filter((d) => d.value > 0);

  // Engagement by year group
  const byYearGroup = new Map<string, number[]>();
  classes.forEach((c) => {
    const classProgress = progress.filter((p) => p.classId === c.id);
    if (!classProgress.length) return;
    const a = avg(classProgress.map((p) => p.videoCompletionPercentage));
    if (!byYearGroup.has(c.yearGroup)) byYearGroup.set(c.yearGroup, []);
    byYearGroup.get(c.yearGroup)!.push(a);
  });
  const engagementByYearGroup = [...byYearGroup.entries()]
    .map(([label, avgs]) => ({ label, value: avg(avgs) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Quiz by topic
  const quizByTopic = topics.map((t) => {
    const qs = progress.filter((p) => p.topicId === t.id).map((p) => p.quizScore).filter((s): s is number => s !== null);
    return { label: t.title.slice(0, 22), value: qs.length ? avg(qs) : 0 };
  }).filter((d) => d.value > 0).slice(0, 8);

  // Active users over time
  const monthCounts = new Map<string, Set<string>>();
  progress.forEach((p) => {
    const m = p.lastActive.slice(0, 7);
    if (!monthCounts.has(m)) monthCounts.set(m, new Set());
    monthCounts.get(m)!.add(p.studentId);
  });
  const activeOverTime = [...monthCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([label, set]) => ({ label: label.slice(5), value: set.size }));

  // Video stats
  const videoStats: VideoStat[] = videos.map((video) => {
    const rows = progress.filter((p) => p.videoId === video.id);
    const qs = rows.map((p) => p.quizScore).filter((s): s is number => s !== null);
    return {
      video,
      views: rows.length,
      avgWatchTime: rows.length ? avg(rows.map((p) => p.watchTimeSeconds)) : 0,
      avgCompletion: rows.length ? avg(rows.map((p) => p.videoCompletionPercentage)) : 0,
      replays: 0,
      avgQuiz: qs.length ? avg(qs) : 0,
    };
  }).filter((v) => v.views > 0).sort((a, b) => b.views - a.views);

  const detail = selectedVideo ? videoStats.find((v) => v.video.id === selectedVideo) ?? null : null;

  type Row = VideoStat;
  const videoCols: Column<Row>[] = [
    {
      key: "title",
      header: "Reel",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-forest-600" aria-hidden />
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
      render: (r) => (
        <Badge tone={r.avgCompletion > 80 ? "forest" : r.avgCompletion > 50 ? "gold" : "clay"}>
          {r.avgCompletion}%
        </Badge>
      ),
    },
    { key: "quiz", header: "Avg quiz", align: "center", render: (r) => `${r.avgQuiz}%` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Platform Analytics"
        subtitle="Whole-platform learning engagement — insight, not surveillance"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total watch time" value={formatWatchTime(totalWatchTime)} />
        <StatCard label="Video completions" value={completions} tone="mist" />
        <StatCard label="Avg completion" value={`${avgCompletion}%`} tone="gold" />
        <StatCard label="Avg quiz score" value={`${avgQuizScore}%`} tone="clay" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartCard title="Watch time by unit" subtitle="Total minutes">
          {watchByUnit.length ? <BarChart data={watchByUnit} unit="m" /> : <p className="py-6 text-center text-sm text-charcoal-soft">No watch data yet</p>}
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Engagement by year group" subtitle="Avg completion %">
          {engagementByYearGroup.length ? <BarChart data={engagementByYearGroup} unit="%" tone="#5c8aa8" /> : <p className="py-6 text-center text-sm text-charcoal-soft">No year group data yet</p>}
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Quiz results by topic" subtitle="Average score %">
          {quizByTopic.length ? <BarChart data={quizByTopic} unit="%" tone="#40916c" /> : <p className="py-6 text-center text-sm text-charcoal-soft">No quiz data yet</p>}
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Active learners over time" subtitle="Monthly unique students">
          {activeOverTime.length ? <LineChart data={activeOverTime} /> : <p className="py-6 text-center text-sm text-charcoal-soft">No activity data yet</p>}
        </AnalyticsChartCard>
      </div>

      {videoStats.length > 0 && (
        <>
          <div>
            <h2 className="display mb-3 text-xl font-bold text-forest-900">Content performance</h2>
            <DataTable
              columns={videoCols}
              rows={videoStats}
              keyOf={(r) => r.video.id}
              onRowClick={(r) => setSelectedVideo(r.video.id === selectedVideo ? null : r.video.id)}
            />
          </div>

          {detail && (
            <div className="rise-in grid grid-cols-1 gap-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 md:grid-cols-[auto_1fr]">
              <DonutChart value={detail.avgCompletion} label="Avg completion" />
              <div>
                <div className="flex items-center gap-2">
                  <Film className="h-6 w-6 text-forest-600" aria-hidden />
                  <h3 className="display text-lg font-bold text-forest-900">{detail.video.title}</h3>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat label="Views" value={detail.views} />
                  <MiniStat label="Avg watch" value={formatWatchTime(detail.avgWatchTime)} />
                  <MiniStat label="Avg quiz" value={`${detail.avgQuiz}%`} />
                  <MiniStat label="Drop-off" value={`${100 - detail.avgCompletion}%`} />
                </div>
                <div className="mt-4 rounded-2xl bg-gold-300/20 px-4 py-3 text-sm text-clay-600">
                  {detail.avgCompletion >= 80
                    ? "Strong completion — students are watching all the way through."
                    : detail.avgCompletion >= 50
                    ? "Moderate completion. A stronger hook in the first 30 seconds could improve watch-through."
                    : "Low completion rate. Consider shortening the reel or adding an early curiosity moment."}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {videoStats.length === 0 && (
        <div className="rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-black/5">
          <p className="text-charcoal-soft">No video engagement data yet. Students need to watch lessons for analytics to appear here.</p>
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
