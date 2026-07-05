"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { SectionHeader, StatCard, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EngagementPill, AdaptiveRecommendationPanel } from "@/components/cards/InsightCards";
import { AnalyticsChartCard, BarChart } from "@/components/analytics/Charts";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getProgressByStudent,
  getUser,
  getTopic,
  getVideo,
} from "@/lib/dataService";
import { getClassAnalytics, formatWatchTime } from "@/lib/analytics";
import { generateAdaptiveRecommendation } from "@/lib/adaptive";
import { DEMO_TEACHER_ID } from "@/data/people";
import type { StudentProgress } from "@/types";

function InsightsInner() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const classes = getClassesByTeacher(teacherId);
  const searchParams = useSearchParams();
  const initialClass = searchParams.get("class") ?? classes[0]?.id ?? "";
  const [classId, setClassId] = useState(initialClass);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const students = getStudentsByClass(classId);
  const analytics = getClassAnalytics(classId);

  // One representative progress row per student (their latest) for the table.
  const rows = students.map((s) => {
    const prog = getProgressByStudent(s.id);
    const latest = prog.sort((a, b) => b.lastActive.localeCompare(a.lastActive))[0];
    return { student: s, latest, count: prog.length };
  });

  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Student",
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-100 text-sm font-bold text-forest-800">
            {r.student.name.slice(0, 1)}
          </span>
          <span className="font-semibold text-forest-900">{r.student.name}</span>
        </div>
      ),
    },
    {
      key: "completion",
      header: "Completion",
      align: "center",
      render: (r) =>
        r.latest ? (
          <Badge tone={r.latest.videoCompletionPercentage > 80 ? "forest" : r.latest.videoCompletionPercentage > 50 ? "gold" : "clay"}>
            {r.latest.videoCompletionPercentage}%
          </Badge>
        ) : "—",
    },
    { key: "watch", header: "Watch time", align: "center", render: (r) => (r.latest ? formatWatchTime(r.latest.watchTimeSeconds) : "—") },
    { key: "quiz", header: "Quiz", align: "center", render: (r) => (r.latest?.quizScore != null ? `${r.latest.quizScore}%` : "—") },
    { key: "focus", header: "Adaptive focus", render: (r) => (r.latest ? <span className="text-charcoal-soft">{r.latest.adaptiveFocusArea}</span> : "—") },
    { key: "engagement", header: "Engagement", align: "center", render: (r) => (r.latest ? <EngagementPill level={r.latest.engagementLevel} /> : "—") },
    {
      key: "rec",
      header: "Recommendation",
      render: (r) =>
        r.latest ? (
          <Badge tone={r.latest.recommendedTaskType === "support" ? "clay" : r.latest.recommendedTaskType === "extension" ? "mist" : "forest"}>
            {r.latest.recommendedTaskType === "support" ? "🪴 Support" : r.latest.recommendedTaskType === "extension" ? "🚀 Extension" : "🌿 Core"}
          </Badge>
        ) : "—",
    },
  ];

  const detailProg: StudentProgress | undefined = selectedStudent
    ? getProgressByStudent(selectedStudent).sort((a, b) => b.lastActive.localeCompare(a.lastActive))[0]
    : undefined;
  const detailRec = detailProg
    ? generateAdaptiveRecommendation({
        watchTimeSeconds: detailProg.watchTimeSeconds,
        durationSeconds: getVideo(detailProg.videoId)?.durationSeconds ?? 100,
        quizScore: detailProg.quizScore,
        replayCount: detailProg.replayCount,
        clickedCurious: detailProg.clickedCurious,
        clickedHelp: detailProg.clickedHelp,
      })
    : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Class Insights"
        subtitle="See who watched, quiz results, adaptive focus areas and next-step recommendations"
        action={
          <select
            className="rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-forest-900"
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setSelectedStudent(null); }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Avg completion" value={`${analytics.avgCompletion}%`} icon={<span>📈</span>} />
        <StatCard label="Avg quiz score" value={`${analytics.avgQuiz}%`} icon={<span>✅</span>} tone="gold" />
        <StatCard label="Need support" value={analytics.studentsNeedingSupport} icon={<span>🪴</span>} tone="clay" />
        <StatCard label="Ready for extension" value={analytics.studentsReadyExtension} icon={<span>🚀</span>} tone="mist" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartCard title="Topic performance" subtitle="Average quiz score by topic">
          <BarChart data={analytics.topicPerformance.map((t) => ({ label: t.topic, value: t.avg }))} unit="%" />
        </AnalyticsChartCard>
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-3xl bg-forest-50 p-5 ring-1 ring-forest-100">
            <h3 className="display text-sm font-semibold text-forest-900">🌟 Topic strengths</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {analytics.strengths.length ? analytics.strengths.map((t) => <Badge key={t.topic} tone="forest">{t.topic} · {t.avg}%</Badge>) : <span className="text-sm text-charcoal-soft">Building up data…</span>}
            </div>
          </div>
          <div className="rounded-3xl bg-clay-400/10 p-5 ring-1 ring-clay-400/25">
            <h3 className="display text-sm font-semibold text-forest-900">🧩 Learning gaps</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {analytics.gaps.length ? analytics.gaps.map((t) => <Badge key={t.topic} tone="clay">{t.topic} · {t.avg}%</Badge>) : <span className="text-sm text-charcoal-soft">No major gaps 🎉</span>}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">Students</h2>
        <DataTable columns={columns} rows={rows} keyOf={(r) => r.student.id} onRowClick={(r) => setSelectedStudent(r.student.id === selectedStudent ? null : r.student.id)} />
        <p className="mt-2 text-xs text-charcoal-soft">Click a student to see their adaptive recommendation.</p>
      </div>

      {/* Adaptive detail drill-down */}
      {detailProg && detailRec && (
        <div className="rise-in grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
            <h3 className="display text-lg font-bold text-forest-900">{getUser(selectedStudent!)?.name}</h3>
            <p className="text-sm text-charcoal-soft">
              Latest: {getTopic(detailProg.topicId)?.title} · {getVideo(detailProg.videoId)?.title}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MiniStat label="Watched" value={`${detailProg.videoCompletionPercentage}%`} />
              <MiniStat label="Quiz" value={detailProg.quizScore != null ? `${detailProg.quizScore}%` : "—"} />
              <MiniStat label="Replays" value={detailProg.replayCount} />
              <MiniStat label="Worksheet" value={detailProg.worksheetCompleted ? "✓ Done" : "Pending"} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {detailProg.clickedCurious && <Badge tone="mist">🔭 Curious</Badge>}
              {detailProg.clickedHelp && <Badge tone="clay">🤝 Asked for help</Badge>}
            </div>
          </div>
          <AdaptiveRecommendationPanel rec={detailRec} audience="teacher" />
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

export default function InsightsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft">Loading insights…</div>}>
      <InsightsInner />
    </Suspense>
  );
}
