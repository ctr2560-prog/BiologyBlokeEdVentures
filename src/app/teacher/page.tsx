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
  getQuizResultsByClass,
  getTopics,
  getPublishedUnits,
  getUnitLessonLinks,
  getBanners,
  getPLSessions,
  type ClassQuizResult,
} from "@/lib/supabaseService";
import { LibraryUnitCard, LibraryLessonCard } from "@/components/cards/LibraryCards";
import { PromoBannerCarousel } from "@/components/ui/PromoBanner";
import { formatWatchTime, avgWatchPerStudent } from "@/lib/analytics";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { DEMO_TEACHER_ID } from "@/data/people";
import { GraduationCap, ArrowRight } from "lucide-react";
import type { ClassGroup, StudentProgress, User, Topic, Unit, SiteBanner, PLSession } from "@/types";

export default function TeacherDashboard() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const teacherName = currentUser?.name ?? "Teacher";

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [allProgress, setAllProgress] = useState<StudentProgress[]>([]);
  const [allQuizResults, setAllQuizResults] = useState<ClassQuizResult[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [topicMap, setTopicMap] = useState<Map<string, Topic>>(new Map());
  const [featuredUnits, setFeaturedUnits] = useState<Unit[]>([]);
  const [featuredLessons, setFeaturedLessons] = useState<Topic[]>([]);
  const [unitLinks, setUnitLinks] = useState<Array<{ unitId: string; lessonId: string }>>([]);
  const [unitTitles, setUnitTitles] = useState<Map<string, string>>(new Map());
  const [bannersList, setBannersList] = useState<SiteBanner[]>([]);
  const [nextPL, setNextPL] = useState<PLSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);

    async function load() {
      const cls = await getClassesByTeacher(teacherId);
      setClasses(cls);

      const [progressArrays, quizArrays, studentArrays, topics, units, links, bannerData, plSessions] = await Promise.all([
        Promise.all(cls.map((c) => getProgressByClass(c.id))),
        Promise.all(cls.map((c) => getQuizResultsByClass(c.id))),
        Promise.all(cls.map((c) => getStudentsByClass(c.id))),
        getTopics(),
        getPublishedUnits(),
        getUnitLessonLinks(),
        getBanners("teacher"),
        getPLSessions(),
      ]);

      setAllProgress(progressArrays.flat());
      setAllQuizResults(quizArrays.flat());
      setStudents(studentArrays.flat());
      setTopicMap(new Map(topics.map((t) => [t.id, t])));
      setFeaturedUnits(units.filter((u) => u.featured));
      setFeaturedLessons(topics.filter((t) => t.featured));
      setUnitLinks(links);
      setUnitTitles(new Map(units.map((u) => [u.id, u.title])));
      setBannersList(
        bannerData.filter((b) => b.active && (b.title || b.message || b.imageUrl))
      );
      const today = new Date().toISOString().slice(0, 10);
      setNextPL(
        plSessions.find((s) => s.published && s.sessionDate && s.sessionDate >= today) ?? null
      );
      setLoading(false);
    }

    load();
  }, [teacherId]);

  const unitByLesson = new Map<string, string>();
  unitLinks.forEach(({ unitId, lessonId }) => {
    if (!unitByLesson.has(lessonId)) unitByLesson.set(lessonId, unitId);
  });
  const lessonCountByUnit = new Map<string, number>();
  unitLinks.forEach(({ unitId }) =>
    lessonCountByUnit.set(unitId, (lessonCountByUnit.get(unitId) ?? 0) + 1)
  );

  const studentById = new Map(students.map((s) => [s.id, s]));

  const needSupport = allProgress.filter((p) => p.recommendedTaskType === "support");
  // Average watch time per student (total across their reels, averaged across
  // students) — "each student watched ~X on average".
  const avgWatch = avgWatchPerStudent(allProgress);
  // Quiz scores come from server-graded quiz_results, not the legacy progress column.
  const scores = allQuizResults.map((q) => q.score);
  const avgQuiz = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  // Average quiz score per student+lesson, for the recent-activity feed.
  const quizByStudentTopic = new Map<string, number[]>();
  allQuizResults.forEach((q) => {
    if (!q.topicId) return;
    const key = `${q.studentId}|${q.topicId}`;
    const arr = quizByStudentTopic.get(key) ?? [];
    arr.push(q.score);
    quizByStudentTopic.set(key, arr);
  });
  const studentTopicQuiz = (studentId: string, topicId: string): number | null => {
    const arr = quizByStudentTopic.get(`${studentId}|${topicId}`);
    return arr ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  };

  const recentActivity = [...allProgress]
    .sort((a, b) => b.lastActive.localeCompare(a.lastActive))
    .slice(0, 5);

  if (loading) {
    return <FullPageLoader />;
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

      {/* Admin-managed promo banners */}
      {bannersList.length > 0 && <PromoBannerCarousel banners={bannersList} />}

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

      {/* Featured Edventures */}
      {(featuredUnits.length > 0 || featuredLessons.length > 0) && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="display text-xl font-bold text-forest-900">Featured Edventures</h2>
            <Link href="/teacher/library" className="text-sm font-semibold text-forest-700 hover:underline">
              Browse library →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredUnits.slice(0, 4).map((u) => (
              <LibraryUnitCard
                key={u.id}
                unit={u}
                lessonCount={lessonCountByUnit.get(u.id) ?? 0}
              />
            ))}
            {featuredLessons
              .slice(0, Math.max(0, 4 - featuredUnits.length))
              .map((l) => (
                <LibraryLessonCard
                  key={l.id}
                  lesson={l}
                  unitTitle={
                    unitByLesson.has(l.id) ? unitTitles.get(unitByLesson.get(l.id)!) : undefined
                  }
                  assignHref={
                    unitByLesson.has(l.id)
                      ? `/teacher/assign?unit=${unitByLesson.get(l.id)}&lesson=${l.id}`
                      : undefined
                  }
                />
              ))}
          </div>
        </div>
      )}

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

      {/* Professional learning CTA */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-cream shadow-hero md:p-8"
        style={{ background: "linear-gradient(120deg, #204535 0%, #3d7a5e 70%, #4f9776 100%)" }}
      >
        <GraduationCap className="absolute -bottom-6 right-6 h-32 w-32 text-white/[0.07]" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">
              Professional learning
            </p>
            <h2 className="display mt-1 text-xl font-bold md:text-2xl">
              Level up your teaching with Edventra
            </h2>
            <p className="mt-1.5 text-sm text-forest-100/80">
              {nextPL
                ? `Next session: ${nextPL.title} — ${new Date(`${nextPL.sessionDate}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long" })}${nextPL.cost ? ` · ${nextPL.cost}` : ""}`
                : "Hands-on PL sessions on adaptive, nature-based teaching — in person and online."}
            </p>
          </div>
          <Link
            href="/teacher/pl"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-forest-950 transition-colors hover:bg-gold-300"
          >
            Explore PL sessions <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
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
                        {(() => {
                          const q = studentTopicQuiz(p.studentId, p.topicId);
                          return q !== null ? ` · ${q}% quiz` : " · no quiz yet";
                        })()}
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

      {/* Insights — derived from real data */}
      {classes.length > 0 && (
        <div>
          <h2 className="display mb-3 text-xl font-bold text-forest-900">Insights</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InsightCard title="Students needing support" tone="clay">
              {needSupport.length === 0
                ? "All students are on track — great work!"
                : `${[...new Set(needSupport.map((p) => p.studentId))].length} student${[...new Set(needSupport.map((p) => p.studentId))].length === 1 ? "" : "s"} flagged for support. Check Class Insights for details.`}
            </InsightCard>
            <InsightCard title="Quiz engagement" tone="gold">
              {scores.length === 0
                ? "No quiz results yet. Assign a lesson to get started."
                : avgQuiz >= 75
                ? `Class average is ${avgQuiz}% — strong performance across your classes.`
                : `Class average is ${avgQuiz}%. Consider revisiting topics with low scores.`}
            </InsightCard>
            <InsightCard title="Run a class session" tone="forest">
              Use Present mode to lead the class through a topic together — watch, vote, quiz and
              worksheet in one flow.{" "}
              <a href="/teacher/present" className="font-semibold underline">
                Start presenting →
              </a>
            </InsightCard>
          </div>
        </div>
      )}
    </div>
  );
}
