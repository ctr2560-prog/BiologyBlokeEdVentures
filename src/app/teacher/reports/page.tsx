"use client";
import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, Button, Badge } from "@/components/ui/primitives";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getProgressByClass,
  getQuizResultsByClass,
  getTopics,
  type ClassQuizResult,
} from "@/lib/supabaseService";
import { formatWatchTime, avgWatchPerStudent } from "@/lib/analytics";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { DEMO_TEACHER_ID } from "@/data/people";
import type { ClassGroup, User, StudentProgress, Topic } from "@/types";

const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

function computeReport(
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
    avgWatchTime: avgWatchPerStudent(progress),
    gaps: topicPerformance.filter((t) => t.avg < 60),
    strengths: topicPerformance.filter((t) => t.avg >= 75),
  };
}

function ReportsInner() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<User[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [quizResults, setQuizResults] = useState<ClassQuizResult[]>([]);
  const [topicNames, setTopicNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClassesByTeacher(teacherId).then((cls) => {
      setClasses(cls);
      if (cls.length) setClassId(cls[0].id);
      else setLoading(false);
    });
  }, [teacherId]);

  const loadClass = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    const [studentsData, progressData, quizData, topicsData] = await Promise.all([
      getStudentsByClass(classId),
      getProgressByClass(classId),
      getQuizResultsByClass(classId),
      getTopics(),
    ]);
    setStudents(studentsData);
    setProgress(progressData);
    setQuizResults(quizData);
    setTopicNames(new Map((topicsData as Topic[]).map((t) => [t.id, t.title])));
    setLoading(false);
  }, [classId]);

  useEffect(() => { loadClass(); }, [loadClass]);

  const report = useMemo(
    () => computeReport(progress, quizResults, topicNames),
    [progress, quizResults, topicNames]
  );

  const needSupport = useMemo(
    () => students.filter((s) => progress.some((p) => p.studentId === s.id && p.recommendedTaskType === "support")),
    [students, progress]
  );
  const readyExtension = useMemo(
    () => students.filter((s) => progress.some((p) => p.studentId === s.id && p.recommendedTaskType === "extension")),
    [students, progress]
  );

  const cls = classes.find((c) => c.id === classId);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        subtitle="A clean class summary you can share or print"
        action={
          classes.length ? (
            <div className="flex gap-2">
              <select
                className="rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-forest-900"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => window.print()}>
                Print / PDF
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <FullPageLoader />
      ) : !classes.length ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft ring-1 ring-black/5">
          <p className="text-4xl">📋</p>
          <h3 className="display mt-3 text-lg font-bold text-forest-900">No classes yet</h3>
          <p className="mt-1 text-sm text-charcoal-soft">
            Create your first class on the{" "}
            <a href="/teacher/classes" className="font-semibold text-forest-700 underline underline-offset-2">
              My Classes
            </a>{" "}
            page, then reports will appear here once students start learning.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-sand pb-4">
            <div>
              <h2 className="display text-2xl font-bold text-forest-900">{cls?.name}</h2>
              <p className="text-sm text-charcoal-soft">
                {cls?.yearGroup} · Class report · {new Date().toLocaleDateString()}
              </p>
            </div>
            <Badge tone="forest">Edventra</Badge>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <ReportStat label="Students" value={students.length} />
            <ReportStat label="Avg completion" value={`${report.avgCompletion}%`} />
            <ReportStat label="Avg quiz" value={`${report.avgQuiz}%`} />
            <ReportStat label="Avg watch" value={formatWatchTime(report.avgWatchTime)} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <ReportSection title="Topic strengths">
              {report.strengths.length ? (
                <ul className="space-y-1 text-sm text-charcoal">
                  {report.strengths.map((t) => (
                    <li key={t.topic}>- {t.topic}, {t.avg}% avg</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-charcoal-soft">Gathering data.</p>
              )}
            </ReportSection>

            <ReportSection title="Topic gaps">
              {report.gaps.length ? (
                <ul className="space-y-1 text-sm text-charcoal">
                  {report.gaps.map((t) => (
                    <li key={t.topic}>- {t.topic}, {t.avg}% avg</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-charcoal-soft">No major gaps.</p>
              )}
            </ReportSection>

            <ReportSection title="Students needing support">
              {needSupport.length ? (
                <ul className="space-y-1 text-sm text-charcoal">
                  {needSupport.map((s) => (
                    <li key={s.id}>- {s.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-charcoal-soft">Everyone on track.</p>
              )}
            </ReportSection>

            <ReportSection title="Ready for extension">
              {readyExtension.length ? (
                <ul className="space-y-1 text-sm text-charcoal">
                  {readyExtension.map((s) => (
                    <li key={s.id}>- {s.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-charcoal-soft">None yet.</p>
              )}
            </ReportSection>
          </div>

          <div className="mt-8 rounded-2xl bg-forest-50 p-5">
            <h3 className="display font-semibold text-forest-900">Suggested next lesson</h3>
            <p className="mt-1 text-sm text-charcoal">
              {report.gaps.length
                ? `Re-teach ${report.gaps[0].topic} with a scaffolded support task, then move the extension-ready students onto the Wildlife Corridor challenge.`
                : `The class is progressing well - introduce the next topic and enable extension tasks for high performers.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-cream/60 p-4 text-center">
      <p className="display text-2xl font-bold text-forest-900">{value}</p>
      <p className="text-xs text-charcoal-soft">{label}</p>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="display mb-2 font-semibold text-forest-900">{title}</h3>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft">Loading report...</div>}>
      <ReportsInner />
    </Suspense>
  );
}
