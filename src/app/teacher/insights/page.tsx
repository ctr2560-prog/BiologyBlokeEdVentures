"use client";
import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { SectionHeader, StatCard, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AliasChip } from "@/components/ui/AliasChip";
import { EngagementPill, AdaptiveRecommendationPanel } from "@/components/cards/InsightCards";
import { AnalyticsChartCard, BarChart } from "@/components/analytics/Charts";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getProgressByClass,
  getTopics,
  getVideo,
} from "@/lib/supabaseService";
import { formatWatchTime } from "@/lib/analytics";
import { generateAdaptiveRecommendation } from "@/lib/adaptive";
import { DEMO_TEACHER_ID } from "@/data/people";
import type { ClassGroup, User, StudentProgress, Video, Topic } from "@/types";

// Pure helpers (same logic as analytics.ts but operating on pre-fetched arrays)
const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
const quizScores = (rows: StudentProgress[]) =>
  rows.map((p) => p.quizScore).filter((s): s is number => s !== null);

function computeAnalytics(progress: StudentProgress[], topicNames: Map<string, string>) {
  const topicMap = new Map<string, number[]>();
  progress.forEach((p) => {
    if (p.quizScore === null) return;
    const arr = topicMap.get(p.topicId) ?? [];
    arr.push(p.quizScore);
    topicMap.set(p.topicId, arr);
  });
  const topicPerformance = [...topicMap.entries()].map(([tid, scores]) => ({
    topic: topicNames.get(tid) ?? tid,
    avg: avg(scores),
  }));
  return {
    avgCompletion: avg(progress.map((p) => p.videoCompletionPercentage)),
    avgQuiz: avg(quizScores(progress)),
    studentsNeedingSupport: [
      ...new Set(progress.filter((p) => p.recommendedTaskType === "support").map((p) => p.studentId)),
    ].length,
    studentsReadyExtension: [
      ...new Set(progress.filter((p) => p.recommendedTaskType === "extension").map((p) => p.studentId)),
    ].length,
    topicPerformance,
    gaps: topicPerformance.filter((t) => t.avg < 60),
    strengths: topicPerformance.filter((t) => t.avg >= 75),
  };
}

function InsightsInner() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const searchParams = useSearchParams();

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [classId, setClassId] = useState(searchParams.get("class") ?? "");
  const [students, setStudents] = useState<User[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [topicNames, setTopicNames] = useState<Map<string, string>>(new Map());
  const [classLoading, setClassLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [detailVideo, setDetailVideo] = useState<Video | null>(null);

  // Load class list once
  useEffect(() => {
    getClassesByTeacher(teacherId).then((cls) => {
      setClasses(cls);
      if (!classId && cls.length) setClassId(cls[0].id);
      setClassLoading(false);
    });
  }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load students + progress + topic names when classId changes
  const loadClass = useCallback(async () => {
    if (!classId) return;
    setDataLoading(true);
    setSelectedStudent(null);
    const [studentsData, progressData, topicsData] = await Promise.all([
      getStudentsByClass(classId),
      getProgressByClass(classId),
      getTopics(),
    ]);
    setStudents(studentsData);
    setProgress(progressData);
    setTopicNames(new Map((topicsData as Topic[]).map((t) => [t.id, t.title])));
    setDataLoading(false);
  }, [classId]);

  useEffect(() => { loadClass(); }, [loadClass]);

  // Lazy-load video for the drill-down when a student is selected
  useEffect(() => {
    if (!selectedStudent) { setDetailVideo(null); return; }
    const latest = progress
      .filter((p) => p.studentId === selectedStudent)
      .sort((a, b) => b.lastActive.localeCompare(a.lastActive))[0];
    if (latest?.videoId) getVideo(latest.videoId).then(setDetailVideo);
  }, [selectedStudent, progress]);

  const analytics = useMemo(
    () => computeAnalytics(progress, topicNames),
    [progress, topicNames]
  );

  // Per-student summary rows for the table
  const tableRows = useMemo(() =>
    students.map((s) => {
      const prog = progress
        .filter((p) => p.studentId === s.id)
        .sort((a, b) => b.lastActive.localeCompare(a.lastActive));
      return { student: s, latest: prog[0] as StudentProgress | undefined, count: prog.length };
    }),
    [students, progress]
  );

  const detailProg = selectedStudent
    ? progress
        .filter((p) => p.studentId === selectedStudent)
        .sort((a, b) => b.lastActive.localeCompare(a.lastActive))[0]
    : undefined;

  const detailRec =
    detailProg && detailVideo
      ? generateAdaptiveRecommendation({
          watchTimeSeconds: detailProg.watchTimeSeconds,
          durationSeconds: detailVideo.durationSeconds,
          quizScore: detailProg.quizScore,
          replayCount: detailProg.replayCount,
          clickedCurious: detailProg.clickedCurious,
          clickedHelp: detailProg.clickedHelp,
        })
      : null;

  const selectedUser = students.find((s) => s.id === selectedStudent);
  const detailTopicName = detailProg ? (topicNames.get(detailProg.topicId) ?? "") : "";

  type TableRow = (typeof tableRows)[number];
  const columns: Column<TableRow>[] = [
    { key: "name", header: "Explorer", render: (r) => <AliasChip user={r.student} /> },
    {
      key: "completion",
      header: "Completion",
      align: "center",
      render: (r) =>
        r.latest ? (
          <Badge
            tone={
              r.latest.videoCompletionPercentage > 80
                ? "forest"
                : r.latest.videoCompletionPercentage > 50
                  ? "gold"
                  : "clay"
            }
          >
            {r.latest.videoCompletionPercentage}%
          </Badge>
        ) : (
          "-"
        ),
    },
    {
      key: "watch",
      header: "Watch time",
      align: "center",
      render: (r) => (r.latest ? formatWatchTime(r.latest.watchTimeSeconds) : "-"),
    },
    {
      key: "quiz",
      header: "Quiz",
      align: "center",
      render: (r) => (r.latest?.quizScore != null ? `${r.latest.quizScore}%` : "-"),
    },
    {
      key: "focus",
      header: "Adaptive focus",
      render: (r) =>
        r.latest ? (
          <span className="text-charcoal-soft">{r.latest.adaptiveFocusArea}</span>
        ) : (
          "-"
        ),
    },
    {
      key: "engagement",
      header: "Engagement",
      align: "center",
      render: (r) => (r.latest ? <EngagementPill level={r.latest.engagementLevel} /> : "-"),
    },
    {
      key: "rec",
      header: "Recommendation",
      render: (r) =>
        r.latest ? (
          <Badge
            tone={
              r.latest.recommendedTaskType === "support"
                ? "clay"
                : r.latest.recommendedTaskType === "extension"
                  ? "mist"
                  : "forest"
            }
          >
            {r.latest.recommendedTaskType === "support"
              ? "Support"
              : r.latest.recommendedTaskType === "extension"
                ? "Extension"
                : "Core"}
          </Badge>
        ) : (
          "-"
        ),
    },
  ];

  const loading = classLoading || dataLoading;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Class Insights"
        subtitle="See who watched, quiz results, adaptive focus areas and next-step recommendations"
        action={
          classLoading ? (
            <div className="h-10 w-48 animate-pulse rounded-2xl bg-charcoal/8" />
          ) : (
            <select
              className="rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-forest-900"
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setSelectedStudent(null); }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )
        }
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-charcoal/8" />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-3xl bg-charcoal/8" />
          <div className="h-64 animate-pulse rounded-3xl bg-charcoal/8" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Avg completion" value={`${analytics.avgCompletion}%`} />
            <StatCard label="Avg quiz score" value={`${analytics.avgQuiz}%`} tone="gold" />
            <StatCard label="Need support" value={analytics.studentsNeedingSupport} tone="clay" />
            <StatCard label="Ready for extension" value={analytics.studentsReadyExtension} tone="mist" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnalyticsChartCard title="Topic performance" subtitle="Average quiz score by topic">
              <BarChart
                data={analytics.topicPerformance.map((t) => ({ label: t.topic, value: t.avg }))}
                unit="%"
              />
            </AnalyticsChartCard>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-3xl bg-forest-50 p-5 ring-1 ring-forest-100">
                <h3 className="display text-sm font-semibold text-forest-900">Topic strengths</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {analytics.strengths.length ? (
                    analytics.strengths.map((t) => (
                      <Badge key={t.topic} tone="forest">{t.topic} · {t.avg}%</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-charcoal-soft">Building up data...</span>
                  )}
                </div>
              </div>
              <div className="rounded-3xl bg-clay-400/10 p-5 ring-1 ring-clay-400/25">
                <h3 className="display text-sm font-semibold text-forest-900">Learning gaps</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {analytics.gaps.length ? (
                    analytics.gaps.map((t) => (
                      <Badge key={t.topic} tone="clay">{t.topic} · {t.avg}%</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-charcoal-soft">No major gaps</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="display mb-3 text-xl font-bold text-forest-900">Students</h2>
            <DataTable
              columns={columns}
              rows={tableRows}
              keyOf={(r) => r.student.id}
              onRowClick={(r) =>
                setSelectedStudent(r.student.id === selectedStudent ? null : r.student.id)
              }
            />
            <p className="mt-2 text-xs text-charcoal-soft">
              Click a student to see their adaptive recommendation.
            </p>
          </div>

          {detailProg && detailRec && selectedUser && (
            <div className="rise-in grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
                <AliasChip user={selectedUser} size={40} />
                <p className="mt-2 text-sm text-charcoal-soft">
                  Latest: {detailTopicName}
                  {detailVideo ? ` · ${detailVideo.title}` : ""}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MiniStat label="Watched" value={`${detailProg.videoCompletionPercentage}%`} />
                  <MiniStat
                    label="Quiz"
                    value={detailProg.quizScore != null ? `${detailProg.quizScore}%` : "-"}
                  />
                  <MiniStat label="Replays" value={detailProg.replayCount} />
                  <MiniStat
                    label="Worksheet"
                    value={detailProg.worksheetCompleted ? "Done" : "Pending"}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detailProg.clickedCurious && <Badge tone="mist">Curious</Badge>}
                  {detailProg.clickedHelp && <Badge tone="clay">Asked for help</Badge>}
                </div>
              </div>
              <AdaptiveRecommendationPanel rec={detailRec} audience="teacher" />
            </div>
          )}
        </>
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

export default function InsightsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft">Loading insights...</div>}>
      <InsightsInner />
    </Suspense>
  );
}
