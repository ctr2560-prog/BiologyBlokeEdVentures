"use client";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { useEffect, useState } from "react";
import { SectionHeader, StatCard, Badge } from "@/components/ui/primitives";
import { Film, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  AnalyticsChartCard,
  BarChart,
  DonutChart,
} from "@/components/analytics/Charts";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatWatchTime } from "@/lib/analytics";
import {
  getProgress,
  getAllQuizResults,
  getVideoLessonMap,
  getVideos,
  getTopics,
  getUnits,
  getClasses,
  type ClassQuizResult,
} from "@/lib/supabaseService";
import type { StudentProgress, Video, Topic, Unit, ClassGroup } from "@/types";

interface VideoStat {
  video: Video;
  views: number;
  avgWatchTime: number;
  avgCompletion: number;
  replays: number;
  avgQuiz: number;
  likes: number;
  dislikes: number;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [quizResults, setQuizResults] = useState<ClassQuizResult[]>([]);
  const [videoLesson, setVideoLesson] = useState<Map<string, string>>(new Map());
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getProgress(), getAllQuizResults(), getVideoLessonMap(),
      getVideos(), getTopics(), getUnits(), getClasses(),
    ]).then(([pr, qr, vl, vi, to, un, cl]) => {
      setProgress(pr); setQuizResults(qr); setVideoLesson(vl);
      setVideos(vi); setTopics(to); setUnits(un); setClasses(cl);
      setLoading(false);
    });
  }, []);

  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  const totalWatchTime = progress.reduce((a, p) => a + p.watchTimeSeconds, 0);
  const completions = progress.filter((p) => p.videoCompletionPercentage >= 90).length;
  const avgCompletion = avg(progress.map((p) => p.videoCompletionPercentage));
  const avgQuizScore = avg(quizResults.map((q) => q.score));

  // Quiz average per lesson (topic) from server-graded quiz_results.
  const quizAvgByTopic = new Map<string, number>();
  {
    const byTopic = new Map<string, number[]>();
    quizResults.forEach((q) => {
      if (!q.topicId) return;
      const arr = byTopic.get(q.topicId) ?? [];
      arr.push(q.score);
      byTopic.set(q.topicId, arr);
    });
    byTopic.forEach((arr, tid) => quizAvgByTopic.set(tid, avg(arr)));
  }

  // Watch time by unit (progress rows carry the unit via backfilled unit_id)
  const watchByUnit = units.map((u) => {
    const mins = Math.round(
      progress.filter((p) => p.unitId === u.id).reduce((a, p) => a + p.watchTimeSeconds, 0) / 60
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

  // Quiz by topic (from quiz_results)
  const quizByTopic = topics
    .map((t) => ({ label: t.title.slice(0, 22), value: quizAvgByTopic.get(t.id) ?? 0 }))
    .filter((d) => d.value > 0)
    .slice(0, 8);

  // Engagement funnel — distinct students reaching each stage of the flow.
  const watchedStudents = new Set(progress.map((p) => p.studentId));
  const completedStudents = new Set(
    progress.filter((p) => p.videoCompletionPercentage >= 90).map((p) => p.studentId)
  );
  const quizzedStudents = new Set(quizResults.map((q) => q.studentId));
  const engagementFunnel = [
    { label: "Started", value: watchedStudents.size },
    { label: "Finished a video", value: completedStudents.size },
    { label: "Took a quiz", value: quizzedStudents.size },
  ];

  // Video stats
  const videoStats: VideoStat[] = videos.map((video) => {
    const rows = progress.filter((p) => p.videoId === video.id);
    const lessonId = videoLesson.get(video.id);
    return {
      video,
      views: rows.length,
      avgWatchTime: rows.length ? avg(rows.map((p) => p.watchTimeSeconds)) : 0,
      avgCompletion: rows.length ? avg(rows.map((p) => p.videoCompletionPercentage)) : 0,
      replays: 0,
      avgQuiz: lessonId ? quizAvgByTopic.get(lessonId) ?? 0 : 0,
      likes: rows.filter((p) => p.videoReaction === "like").length,
      dislikes: rows.filter((p) => p.videoReaction === "dislike").length,
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
    {
      key: "reactions",
      header: "Reactions",
      align: "center",
      render: (r) => {
        const total = r.likes + r.dislikes;
        if (total === 0) return <span className="text-xs text-charcoal-soft/60">—</span>;
        const ratio = Math.round((r.likes / total) * 100);
        return (
          <div className="inline-flex flex-col items-center gap-1">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="flex items-center gap-1 font-semibold text-forest-700">
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden /> {r.likes}
              </span>
              <span className="flex items-center gap-1 font-semibold text-clay-600">
                <ThumbsDown className="h-3.5 w-3.5" aria-hidden /> {r.dislikes}
              </span>
            </div>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-clay-400/30">
              <div className="h-full rounded-full bg-forest-500" style={{ width: `${ratio}%` }} />
            </div>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <FullPageLoader />;
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
          {quizByTopic.length ? <BarChart data={quizByTopic} unit="%" tone="#4f9776" /> : <p className="py-6 text-center text-sm text-charcoal-soft">No quiz data yet</p>}
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Learner engagement funnel" subtitle="Students reaching each stage">
          {watchedStudents.size ? <BarChart data={engagementFunnel} tone="#4f9776" /> : <p className="py-6 text-center text-sm text-charcoal-soft">No activity data yet</p>}
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
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <MiniStat label="Views" value={detail.views} />
                  <MiniStat label="Avg watch" value={formatWatchTime(detail.avgWatchTime)} />
                  <MiniStat label="Avg quiz" value={`${detail.avgQuiz}%`} />
                  <MiniStat label="Drop-off" value={`${100 - detail.avgCompletion}%`} />
                  <MiniStat label="Likes" value={detail.likes} />
                  <MiniStat label="Dislikes" value={detail.dislikes} />
                </div>
                <div className="mt-4 rounded-2xl bg-gold-300/20 px-4 py-3 text-sm text-clay-600">
                  {detail.avgCompletion >= 80
                    ? "Strong completion — students are watching all the way through."
                    : detail.avgCompletion >= 50
                    ? "Moderate completion. A stronger hook in the first 30 seconds could improve watch-through."
                    : "Low completion rate. Consider shortening the reel or adding an early curiosity moment."}
                  {detail.likes + detail.dislikes > 0 && (
                    <>
                      {" "}
                      {Math.round((detail.likes / (detail.likes + detail.dislikes)) * 100)}% of
                      reactions are likes.
                    </>
                  )}
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
