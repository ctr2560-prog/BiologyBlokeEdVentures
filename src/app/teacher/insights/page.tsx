"use client";
import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { SectionHeader, StatCard, Badge, Modal } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AliasChip } from "@/components/ui/AliasChip";
import { AnalyticsChartCard, BarChart } from "@/components/analytics/Charts";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getProgressByClass,
  getQuizResultsByClass,
  getResponsesByClass,
  getActivitiesByIds,
  getTopics,
  type ClassQuizResult,
} from "@/lib/supabaseService";
import { WorksheetReview } from "@/components/insights/WorksheetReview";
import { FileText } from "lucide-react";
import { formatWatchTime } from "@/lib/analytics";
import { DEMO_TEACHER_ID } from "@/data/people";
import type { ClassGroup, User, StudentProgress, Topic, StudentActivityResponse, Activity } from "@/types";

// Pure helpers (same logic as analytics.ts but operating on pre-fetched arrays)
const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

function computeAnalytics(
  progress: StudentProgress[],
  quizResults: ClassQuizResult[],
  topicNames: Map<string, string>
) {
  // Quiz performance now comes from server-graded quiz_results, grouped by lesson.
  const topicMap = new Map<string, number[]>();
  quizResults.forEach((q) => {
    if (!q.topicId) return;
    const arr = topicMap.get(q.topicId) ?? [];
    arr.push(q.score);
    topicMap.set(q.topicId, arr);
  });
  const topicPerformance = [...topicMap.entries()].map(([tid, scores]) => ({
    topic: topicNames.get(tid) ?? tid,
    avg: avg(scores),
  }));
  return {
    avgCompletion: avg(progress.map((p) => p.videoCompletionPercentage)),
    avgQuiz: avg(quizResults.map((q) => q.score)),
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
  const [quizResults, setQuizResults] = useState<ClassQuizResult[]>([]);
  const [responses, setResponses] = useState<StudentActivityResponse[]>([]);
  const [activityById, setActivityById] = useState<Map<string, Activity>>(new Map());
  const [topicNames, setTopicNames] = useState<Map<string, string>>(new Map());
  const [classLoading, setClassLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Load class list once
  useEffect(() => {
    getClassesByTeacher(teacherId).then((cls) => {
      setClasses(cls);
      if (!classId && cls.length) setClassId(cls[0].id);
      setClassLoading(false);
      if (!cls.length) setDataLoading(false);
    });
  }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load students + progress + topic names when classId changes
  const loadClass = useCallback(async () => {
    if (!classId) return;
    setDataLoading(true);
    setSelectedStudent(null);
    const [studentsData, progressData, quizData, responseData, topicsData] = await Promise.all([
      getStudentsByClass(classId),
      getProgressByClass(classId),
      getQuizResultsByClass(classId),
      getResponsesByClass(classId),
      getTopics(),
    ]);
    // Load the activities referenced by worksheet responses so we can show them.
    const activityIds = [...new Set(responseData.map((r) => r.activityId))];
    const activities = activityIds.length ? await getActivitiesByIds(activityIds) : [];
    setStudents(studentsData);
    setProgress(progressData);
    setQuizResults(quizData);
    setResponses(responseData);
    setActivityById(new Map(activities.map((a) => [a.id, a])));
    setTopicNames(new Map((topicsData as Topic[]).map((t) => [t.id, t.title])));
    setDataLoading(false);
  }, [classId]);

  useEffect(() => { loadClass(); }, [loadClass]);

  const analytics = useMemo(
    () => computeAnalytics(progress, quizResults, topicNames),
    [progress, quizResults, topicNames]
  );

  // Average server-graded quiz score per student (across all their quizzes).
  const quizByStudent = useMemo(() => {
    const scores = new Map<string, number[]>();
    quizResults.forEach((q) => {
      const arr = scores.get(q.studentId) ?? [];
      arr.push(q.score);
      scores.set(q.studentId, arr);
    });
    return new Map(
      [...scores.entries()].map(([sid, arr]) => [sid, Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)])
    );
  }, [quizResults]);

  // Worksheet responses grouped by student.
  const responsesByStudent = useMemo(() => {
    const m = new Map<string, StudentActivityResponse[]>();
    responses.forEach((r) => {
      const arr = m.get(r.studentId) ?? [];
      arr.push(r);
      m.set(r.studentId, arr);
    });
    return m;
  }, [responses]);

  // Per-student summary rows for the table. Completion and watch time are
  // aggregated across every video the student watched in the lesson — not a
  // single "latest" record, which was unstable (lastActive is date-only) and
  // could surface just the last, skipped video.
  const tableRows = useMemo(() =>
    students.map((s) => {
      const prog = progress
        .filter((p) => p.studentId === s.id)
        .sort((a, b) => b.lastActive.localeCompare(a.lastActive));
      const avgCompletion = prog.length
        ? Math.round(prog.reduce((a, p) => a + p.videoCompletionPercentage, 0) / prog.length)
        : undefined;
      const totalWatch = prog.reduce((a, p) => a + p.watchTimeSeconds, 0);
      return {
        student: s,
        latest: prog[0] as StudentProgress | undefined,
        count: prog.length,
        avgCompletion,
        totalWatch,
      };
    }),
    [students, progress]
  );

  const detailProg = selectedStudent
    ? progress
        .filter((p) => p.studentId === selectedStudent)
        .sort((a, b) => b.lastActive.localeCompare(a.lastActive))[0]
    : undefined;

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
        r.avgCompletion != null ? (
          <Badge
            tone={
              r.avgCompletion > 80
                ? "forest"
                : r.avgCompletion > 50
                  ? "gold"
                  : "clay"
            }
          >
            {r.avgCompletion}%
          </Badge>
        ) : (
          "-"
        ),
    },
    {
      key: "watch",
      header: "Watch time",
      align: "center",
      render: (r) => (r.count ? formatWatchTime(r.totalWatch) : "-"),
    },
    {
      key: "quiz",
      header: "Quiz",
      align: "center",
      render: (r) => {
        const q = quizByStudent.get(r.student.id);
        return q != null ? `${q}%` : "-";
      },
    },
    {
      key: "worksheet",
      header: "Adaptive worksheet",
      align: "center",
      render: (r) => {
        const resp = responsesByStudent.get(r.student.id) ?? [];
        if (resp.length === 0) {
          return <span className="text-xs text-charcoal-soft/60">Not started yet</span>;
        }
        const isOpen = selectedStudent === r.student.id;
        const submitted = resp.filter((x) => x.submittedAt).length;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(isOpen ? null : r.student.id);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              isOpen
                ? "bg-forest-800 text-cream"
                : "bg-forest-700 text-cream hover:bg-forest-800"
            }`}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {isOpen ? "Hide worksheet" : "View worksheet"}
            {submitted === 0 && <span className="rounded-full bg-gold-400 px-1.5 text-[10px] text-forest-950">draft</span>}
          </button>
        );
      },
    },
  ];

  const loading = classLoading || dataLoading;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Class Insights"
        subtitle="See who watched, quiz results, and what students did on their adaptive worksheet"
        action={
          classLoading ? (
            <div className="h-10 w-48 animate-pulse rounded-2xl bg-charcoal/8" />
          ) : classes.length ? (
            <select
              className="rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-forest-900"
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setSelectedStudent(null); }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : null
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
      ) : !classes.length ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft ring-1 ring-black/5">
          <p className="text-4xl">🌿</p>
          <h3 className="display mt-3 text-lg font-bold text-forest-900">No classes yet</h3>
          <p className="mt-1 text-sm text-charcoal-soft">
            Create your first class on the{" "}
            <a href="/teacher/classes" className="font-semibold text-forest-700 underline underline-offset-2">
              My Classes
            </a>{" "}
            page, then insights will appear here as students start exploring.
          </p>
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
              Click a student&apos;s <span className="font-semibold text-forest-700">View worksheet</span> button to see their answers.
            </p>
          </div>

          {/* Worksheet review modal */}
          <Modal
            open={!!selectedUser}
            onClose={() => setSelectedStudent(null)}
            title={selectedUser ? `${selectedUser.name}'s adaptive worksheet` : "Adaptive worksheet"}
            maxWidth="max-w-2xl"
          >
            {selectedUser && (
              <div className="space-y-4">
                {detailProg && (
                  <div className="flex items-center gap-3 rounded-2xl bg-forest-50 px-4 py-3">
                    <AliasChip user={selectedUser} size={36} />
                    <span className="text-sm text-charcoal-soft">
                      {tableRows.find((r) => r.student.id === selectedStudent)?.avgCompletion ?? detailProg.videoCompletionPercentage}% watched
                      {selectedStudent && quizByStudent.get(selectedStudent) != null
                        ? ` · ${quizByStudent.get(selectedStudent)}% quiz`
                        : ""}
                      {detailTopicName ? ` · ${detailTopicName}` : ""}
                    </span>
                  </div>
                )}
                <WorksheetReview
                  responses={selectedStudent ? responsesByStudent.get(selectedStudent) ?? [] : []}
                  activityById={activityById}
                />
              </div>
            )}
          </Modal>
        </>
      )}
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
