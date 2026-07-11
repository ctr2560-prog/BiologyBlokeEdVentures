"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { SectionHeader, StatCard, Button } from "@/components/ui/primitives";
import { InsightCard, EngagementPill } from "@/components/cards/InsightCards";
import { ClassCard } from "@/components/cards/ContentCards";
import { AliasAvatar } from "@/components/ui/AliasChip";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getProgressByClass,
  getTopics,
} from "@/lib/supabaseService";
import { formatWatchTime } from "@/lib/analytics";
import { DEMO_TEACHER_ID } from "@/data/people";
import type { ClassGroup, StudentProgress, User, Topic } from "@/types";

export default function TeacherDashboard() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const teacherName = currentUser?.name ?? "Teacher";

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [allProgress, setAllProgress] = useState<StudentProgress[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [topicMap, setTopicMap] = useState<Map<string, Topic>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);

    async function load() {
      const cls = await getClassesByTeacher(teacherId);
      setClasses(cls);

      const [progressArrays, studentArrays, topics] = await Promise.all([
        Promise.all(cls.map((c) => getProgressByClass(c.id))),
        Promise.all(cls.map((c) => getStudentsByClass(c.id))),
        getTopics(),
      ]);

      setAllProgress(progressArrays.flat());
      setStudents(studentArrays.flat());
      setTopicMap(new Map(topics.map((t) => [t.id, t])));
      setLoading(false);
    }

    load();
  }, [teacherId]);

  const studentById = new Map(students.map((s) => [s.id, s]));

  const needSupport = allProgress.filter((p) => p.recommendedTaskType === "support");
  const avgWatch = allProgress.length
    ? Math.round(allProgress.reduce((a, p) => a + p.watchTimeSeconds, 0) / allProgress.length)
    : 0;
  const scores = allProgress.map((p) => p.quizScore).filter((s): s is number => s !== null);
  const avgQuiz = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const recentActivity = [...allProgress]
    .sort((a, b) => b.lastActive.localeCompare(a.lastActive))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-charcoal/8" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title={`Welcome back, ${teacherName}`}
        subtitle="Your classes, activity and who needs a hand today"
        action={
          <Link href="/teacher/assign">
            <Button>Assign a lesson</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="My classes" value={classes.length} />
        <StatCard label="Avg watch time" value={formatWatchTime(avgWatch)} tone="mist" />
        <StatCard label="Avg quiz score" value={`${avgQuiz}%`} tone="gold" />
        <StatCard
          label="Need support"
          value={[...new Set(needSupport.map((p) => p.studentId))].length}
          tone="clay"
        />
      </div>

      {/* Classes */}
      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">My classes</h2>
        {classes.length === 0 ? (
          <p className="text-sm text-charcoal-soft">No classes yet. Create one from the Classes page.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <ClassCard
                key={c.id}
                cls={c}
                studentCount={c.studentIds.length}
                href={`/teacher/insights?class=${c.id}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Students needing support */}
        <div>
          <h2 className="display mb-3 text-xl font-bold text-forest-900">Students needing support</h2>
          <div className="space-y-2">
            {needSupport.length === 0 ? (
              <p className="rounded-3xl bg-white p-5 text-sm text-charcoal-soft shadow-soft">
                Everyone is on track right now.
              </p>
            ) : (
              needSupport.slice(0, 5).map((p) => {
                const student = studentById.get(p.studentId);
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-black/5">
                    {student && <AliasAvatar user={student} size={36} />}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-forest-900">{student?.name}</p>
                      <p className="text-xs text-charcoal-soft">
                        {topicMap.get(p.topicId)?.title} · {p.adaptiveFocusArea}
                      </p>
                    </div>
                    <EngagementPill level={p.engagementLevel} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="display mb-3 text-xl font-bold text-forest-900">Recent student activity</h2>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <p className="rounded-3xl bg-white p-5 text-sm text-charcoal-soft shadow-soft">
                No activity yet.
              </p>
            ) : (
              recentActivity.map((p) => {
                const student = studentById.get(p.studentId);
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-black/5">
                    <div className="flex-1">
                      <p className="text-sm text-charcoal">
                        <b className="text-forest-900">{student?.name ?? p.studentId}</b> watched{" "}
                        <b>{topicMap.get(p.topicId)?.title}</b>
                      </p>
                      <p className="text-xs text-charcoal-soft">
                        {p.videoCompletionPercentage}% watched
                        {p.quizScore !== null ? ` · ${p.quizScore}% quiz` : " · no quiz yet"}
                      </p>
                    </div>
                    <span className="text-xs text-charcoal-soft">{p.lastActive.slice(5, 10)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Suggested actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightCard title="Suggested follow-up" tone="forest">
          3 students in 5J are ready for the <b>Design a Wildlife Corridor</b> extension.
          Assign it from Class Insights.
        </InsightCard>
        <InsightCard title="Class learning gap" tone="gold">
          Food Webs quiz scores are trending low in 5J, consider re-teaching energy flow.
        </InsightCard>
        <InsightCard title="Curiosity spike" tone="mist">
          Several students clicked "I'm curious" on the tiger reel, great time for an Explore task.
        </InsightCard>
      </div>
    </div>
  );
}
