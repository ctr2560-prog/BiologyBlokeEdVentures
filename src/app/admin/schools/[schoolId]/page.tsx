"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  SectionHeader, StatCard, Badge, Modal,
} from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AliasChip } from "@/components/ui/AliasChip";
import { AnalyticsChartCard, BarChart } from "@/components/analytics/Charts";
import { WorksheetReview } from "@/components/insights/WorksheetReview";
import {
  getSchool, getClassesBySchool, getStudentsByClass,
  getProgressByClass, getQuizResultsByClass, getResponsesByClass,
  getActivitiesByIds, getTopics, getUser,
  type ClassQuizResult,
} from "@/lib/supabaseService";
import { formatWatchTime } from "@/lib/analytics";
import { ArrowLeft, Loader, Users, BookOpen, FileText } from "lucide-react";
import type {
  School, ClassGroup, User, StudentProgress, Topic, StudentActivityResponse, Activity,
} from "@/types";

const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

function computeAnalytics(
  progress: StudentProgress[],
  quizResults: ClassQuizResult[],
  topicNames: Map<string, string>
) {
  // Quiz performance comes from server-graded quiz_results, grouped by lesson.
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
    studentsNeedingSupport: [...new Set(
      progress.filter((p) => p.recommendedTaskType === "support").map((p) => p.studentId),
    )].length,
    studentsReadyExtension: [...new Set(
      progress.filter((p) => p.recommendedTaskType === "extension").map((p) => p.studentId),
    )].length,
    topicPerformance,
    gaps: topicPerformance.filter((t) => t.avg < 60),
    strengths: topicPerformance.filter((t) => t.avg >= 75),
  };
}

export default function SchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();

  const [school, setSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [classId, setClassId] = useState("");
  const [teacher, setTeacher] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [quizResults, setQuizResults] = useState<ClassQuizResult[]>([]);
  const [responses, setResponses] = useState<StudentActivityResponse[]>([]);
  const [activityById, setActivityById] = useState<Map<string, Activity>>(new Map());
  const [topicNames, setTopicNames] = useState<Map<string, string>>(new Map());
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const [schoolLoading, setSchoolLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);

  // Load school + its classes
  useEffect(() => {
    Promise.all([getSchool(schoolId), getClassesBySchool(schoolId), getTopics()]).then(
      ([s, cls, topics]) => {
        setSchool(s);
        setClasses(cls);
        if (cls.length) setClassId(cls[0].id);
        setTopicNames(new Map((topics as Topic[]).map((t) => [t.id, t.title])));
        setSchoolLoading(false);
      },
    );
  }, [schoolId]);

  // Load class data when selection changes
  const loadClass = useCallback(async () => {
    if (!classId) return;
    setClassLoading(true);
    setSelectedStudent(null);

    const cls = classes.find((c) => c.id === classId);
    const [studentsData, progressData, quizData, responseData, teacherData] = await Promise.all([
      getStudentsByClass(classId),
      getProgressByClass(classId),
      getQuizResultsByClass(classId),
      getResponsesByClass(classId),
      cls?.teacherId ? getUser(cls.teacherId) : Promise.resolve(null),
    ]);
    const activityIds = [...new Set(responseData.map((r) => r.activityId))];
    const activities = activityIds.length ? await getActivitiesByIds(activityIds) : [];

    setStudents(studentsData);
    setProgress(progressData);
    setQuizResults(quizData);
    setResponses(responseData);
    setActivityById(new Map(activities.map((a) => [a.id, a])));
    setTeacher(teacherData);
    setClassLoading(false);
  }, [classId, classes]);

  useEffect(() => { loadClass(); }, [loadClass]);

  const analytics = useMemo(
    () => computeAnalytics(progress, quizResults, topicNames),
    [progress, quizResults, topicNames]
  );

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

  const responsesByStudent = useMemo(() => {
    const m = new Map<string, StudentActivityResponse[]>();
    responses.forEach((r) => {
      const arr = m.get(r.studentId) ?? [];
      arr.push(r);
      m.set(r.studentId, arr);
    });
    return m;
  }, [responses]);

  const tableRows = useMemo(() =>
    students.map((s) => {
      const prog = progress
        .filter((p) => p.studentId === s.id)
        .sort((a, b) => b.lastActive.localeCompare(a.lastActive));
      return { student: s, latest: prog[0] as StudentProgress | undefined, count: prog.length };
    }),
    [students, progress],
  );

  const detailProg = selectedStudent
    ? progress
        .filter((p) => p.studentId === selectedStudent)
        .sort((a, b) => b.lastActive.localeCompare(a.lastActive))[0]
    : undefined;

  const selectedUser = students.find((s) => s.id === selectedStudent);
  const detailTopicName = detailProg ? (topicNames.get(detailProg.topicId) ?? "") : "";
  const currentClass = classes.find((c) => c.id === classId);

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
              r.latest.videoCompletionPercentage > 80 ? "forest"
              : r.latest.videoCompletionPercentage > 50 ? "gold"
              : "clay"
            }
          >
            {r.latest.videoCompletionPercentage}%
          </Badge>
        ) : "-",
    },
    {
      key: "watch",
      header: "Watch time",
      align: "center",
      render: (r) => r.latest ? formatWatchTime(r.latest.watchTimeSeconds) : "-",
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
              isOpen ? "bg-forest-800 text-cream" : "bg-forest-700 text-cream hover:bg-forest-800"
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

  if (schoolLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="space-y-6">
        <Link href="/admin/schools" className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-forest-900">
          <ArrowLeft className="h-4 w-4" /> Back to Schools
        </Link>
        <p className="text-charcoal-soft">School not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/schools"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-forest-900"
        >
          <ArrowLeft className="h-4 w-4" /> All Schools
        </Link>
        <SectionHeader
          title={school.name}
          subtitle={school.location}
          action={
            <div className="flex items-center gap-2">
              <Badge tone={school.active ? "forest" : "neutral"}>
                {school.active ? "Active" : "Inactive"}
              </Badge>
              <Badge tone={school.subscriptionStatus === "active" ? "forest" : school.subscriptionStatus === "trial" ? "gold" : "clay"}>
                {school.subscriptionStatus}
              </Badge>
            </div>
          }
        />
      </div>

      {/* School-level stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Classes" value={classes.length} />
        <StatCard label="Teachers" value={school.teacherIds.length} tone="gold" />
        <StatCard label="Students" value={school.studentIds.length} tone="mist" />
        <StatCard label="Last active" value={school.lastActive || "—"} />
      </div>

      {/* No classes state */}
      {classes.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft ring-1 ring-black/5">
          <BookOpen className="mx-auto h-10 w-10 text-charcoal-soft/40" />
          <h3 className="display mt-3 text-lg font-bold text-forest-900">No classes yet</h3>
          <p className="mt-1 text-sm text-charcoal-soft">
            Classes will appear here once a teacher at this school creates them.
          </p>
        </div>
      ) : (
        <>
          {/* Class selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-forest-900">Class:</span>
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setClassId(c.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  classId === c.id
                    ? "bg-forest-700 text-white"
                    : "bg-white text-charcoal ring-1 ring-sand hover:bg-forest-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Class teacher */}
          {teacher && (
            <p className="text-sm text-charcoal-soft">
              Teacher: <span className="font-semibold text-forest-900">{teacher.name}</span>
              {teacher.email && (
                <span className="ml-1 text-charcoal-soft">({teacher.email})</span>
              )}
            </p>
          )}

          {classLoading ? (
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
              {/* Class analytics */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Avg completion" value={`${analytics.avgCompletion}%`} />
                <StatCard label="Avg quiz score" value={`${analytics.avgQuiz}%`} tone="gold" />
                <StatCard label="Need support" value={analytics.studentsNeedingSupport} tone="clay" />
                <StatCard label="Ready for extension" value={analytics.studentsReadyExtension} tone="mist" />
              </div>

              {/* Charts */}
              {analytics.topicPerformance.length > 0 && (
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
                          <span className="text-sm text-charcoal-soft">Building up data…</span>
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
              )}

              {/* Students table */}
              <div>
                <h2 className="display mb-3 text-xl font-bold text-forest-900">
                  Students
                  <span className="ml-2 text-base font-normal text-charcoal-soft">
                    {currentClass?.name}
                  </span>
                </h2>

                {students.length === 0 ? (
                  <div className="rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-black/5">
                    <Users className="mx-auto h-8 w-8 text-charcoal-soft/40" />
                    <p className="mt-2 text-sm text-charcoal-soft">No students in this class yet.</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
                          {detailProg.videoCompletionPercentage}% watched
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
        </>
      )}
    </div>
  );
}
