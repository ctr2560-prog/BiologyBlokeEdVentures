"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader, StatCard, Button, Badge } from "@/components/ui/primitives";
import { Film, FolderTree, School as SchoolIcon, BarChart3, Loader } from "lucide-react";
import { AnalyticsChartCard, BarChart, LineChart } from "@/components/analytics/Charts";
import { InsightCard } from "@/components/cards/InsightCards";
import { formatWatchTime } from "@/lib/analytics";
import {
  getProgress,
  getVideos,
  getTopics,
  getUnits,
  getSchools,
  getStudents,
  getTeachers,
} from "@/lib/supabaseService";
import type { StudentProgress, Video, Topic, Unit, School, User } from "@/types";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([
      getProgress(), getVideos(), getTopics(), getUnits(),
      getSchools(), getStudents(), getTeachers(),
    ]).then(([pr, vi, to, un, sc, st, te]) => {
      setProgress(pr); setVideos(vi); setTopics(to); setUnits(un);
      setSchools(sc); setStudents(st); setTeachers(te);
      setLoading(false);
    });
  }, []);

  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  const totalWatchTime = progress.reduce((a, p) => a + p.watchTimeSeconds, 0);
  const completions = progress.filter((p) => p.videoCompletionPercentage >= 90).length;
  const avgCompletion = avg(progress.map((p) => p.videoCompletionPercentage));
  const quizNums = progress.map((p) => p.quizScore).filter((s): s is number => s !== null);
  const avgQuiz = avg(quizNums);
  const avgWatch = progress.length ? Math.round(totalWatchTime / progress.length) : 0;

  const topicCounts = new Map<string, number>();
  progress.forEach((p) => topicCounts.set(p.topicId, (topicCounts.get(p.topicId) ?? 0) + 1));
  const popularTopicId = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const popularTopic = topics.find((t) => t.id === popularTopicId)?.title ?? "-";

  const watchByUnit = units.map((u) => {
    const unitTopicIds = new Set(topics.filter((t) => t.unitId === u.id).map((t) => t.id));
    const mins = Math.round(
      progress.filter((p) => unitTopicIds.has(p.topicId)).reduce((a, p) => a + p.watchTimeSeconds, 0) / 60
    );
    return { label: u.title.slice(0, 22), value: mins };
  }).filter((d) => d.value > 0);

  const quizByTopic = topics.map((t) => {
    const qs = progress.filter((p) => p.topicId === t.id).map((p) => p.quizScore).filter((s): s is number => s !== null);
    return { label: t.title.slice(0, 22), value: qs.length ? avg(qs) : 0 };
  }).filter((d) => d.value > 0).slice(0, 8);

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

  const videoViewMap = new Map<string, { views: number; avgCompletion: number; avgQuiz: number }>();
  progress.forEach((p) => {
    const e = videoViewMap.get(p.videoId) ?? { views: 0, avgCompletion: 0, avgQuiz: 0 };
    e.views++;
    videoViewMap.set(p.videoId, e);
  });
  const topVideos = videos
    .map((v) => ({ video: v, views: videoViewMap.get(v.id)?.views ?? 0, avgCompletion: videoViewMap.get(v.id)?.avgCompletion ?? 0, avgQuiz: videoViewMap.get(v.id)?.avgQuiz ?? 0 }))
    .filter((v) => v.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-charcoal/8" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-charcoal/8" />)}
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader className="h-8 w-8 animate-spin text-forest-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Platform Dashboard"
        subtitle="Your whole conservation-education ecosystem at a glance"
        action={
          <Link href="/admin/units">
            <Button>Add content</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Schools" value={schools.length} sublabel={`${schools.filter((s) => s.active).length} active`} />
        <StatCard label="Active teachers" value={teachers.length} tone="mist" />
        <StatCard label="Active students" value={students.length} tone="gold" />
        <StatCard label="Videos" value={videos.length} sublabel={`${units.length} units`} tone="clay" />
        <StatCard label="Avg watch time" value={formatWatchTime(avgWatch)} />
        <StatCard label="Avg quiz score" value={`${avgQuiz}%`} tone="mist" />
        <StatCard label="Completion rate" value={`${avgCompletion}%`} tone="gold" />
        <StatCard label="Most popular topic" value={popularTopic} tone="clay" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartCard title="Watch time by unit" subtitle="Total minutes watched">
          {watchByUnit.length ? <BarChart data={watchByUnit} unit="m" /> : <p className="py-6 text-center text-sm text-charcoal-soft">No watch data yet</p>}
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Active learners over time" subtitle="Monthly unique students">
          {activeOverTime.length ? <LineChart data={activeOverTime} /> : <p className="py-6 text-center text-sm text-charcoal-soft">No activity data yet</p>}
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Quiz results by topic" subtitle="Average score %">
          {quizByTopic.length ? <BarChart data={quizByTopic} unit="%" tone="#5c8aa8" /> : <p className="py-6 text-center text-sm text-charcoal-soft">No quiz data yet</p>}
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Most watched reels" subtitle="Views">
          {topVideos.length ? (
            <div className="space-y-3">
              {topVideos.map((v) => (
                <div key={v.video.id} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest-50 text-forest-700">
                    <Film className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-forest-900">{v.video.title}</p>
                    <p className="text-xs text-charcoal-soft">{v.views} view{v.views !== 1 ? "s" : ""}</p>
                  </div>
                  <Badge tone="forest">{v.views}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-charcoal-soft">No views yet</p>
          )}
        </AnalyticsChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightCard title="Completion opportunity" tone="mist">
          {avgCompletion < 70
            ? `Average completion is ${avgCompletion}%. Short hooks on low-completion reels can make a big difference.`
            : `Average completion is ${avgCompletion}% — students are watching through to the end.`}
        </InsightCard>
        <InsightCard title="Quiz performance" tone="gold">
          {avgQuiz === 0
            ? "No quiz results yet. Assign lessons to classes to start collecting data."
            : avgQuiz < 60
            ? `Class average is ${avgQuiz}%. Consider adding more scaffolding to low-scoring topics.`
            : `Class average is ${avgQuiz}% — solid engagement across the platform.`}
        </InsightCard>
        <InsightCard title="Platform growth" tone="forest">
          {schools.length === 0
            ? "No schools registered yet. Add a school to get started."
            : `${schools.length} school${schools.length > 1 ? "s" : ""} using the platform with ${students.length} active learner${students.length !== 1 ? "s" : ""}.`}
        </InsightCard>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { href: "/admin/units", label: "Units & Topics", Icon: FolderTree },
          { href: "/admin/videos", label: "Videos", Icon: Film },
          { href: "/admin/schools", label: "Schools", Icon: SchoolIcon },
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
