"use client";
import { FullPageLoader } from "@/components/ui/BrandLoader";
/*
 * Teacher resources = printable worksheets for the lessons a teacher has been
 * assigned. Each lesson's linked adaptive activities become a printable
 * worksheet (via /teacher/print/activity/[id]). Teacher-led assignments are
 * flagged since those are the ones meant to be printed and handed out.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { SectionHeader, EmptyState, Badge } from "@/components/ui/primitives";
import {
  getClassesByTeacher,
  getAssignmentsByClass,
  getPublishedUnits,
  getTopicsByUnit,
  getActivitiesForLesson,
} from "@/lib/supabaseService";
import { DEMO_TEACHER_ID } from "@/data/people";
import {
  Printer, FileText, Layers, Sparkles, Users, UserCog, BookOpen,
} from "lucide-react";
import type { Unit, Topic, Activity, DeliveryMode } from "@/types";

type LessonWorksheets = { lesson: Topic; activities: Activity[] };
type UnitGroup = {
  unit: Unit;
  modes: Set<DeliveryMode>;
  classId: string | null; // a class this unit is assigned to (for the printout header)
  lessons: LessonWorksheets[];
};

type ModeFilter = "all" | "teacher-led" | "student-led";

const DIFF_TONE: Record<string, "clay" | "forest" | "mist"> = {
  foundation: "clay",
  core: "forest",
  advanced: "mist",
};

export default function TeacherResources() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;

  const [groups, setGroups] = useState<UnitGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");

  useEffect(() => {
    (async () => {
      const classes = teacherId ? await getClassesByTeacher(teacherId) : [];
      const assignmentArrays = await Promise.all(
        classes.map((c) => getAssignmentsByClass(c.id))
      );
      const assignments = assignmentArrays.flat();

      // Collect assigned units with the delivery modes + a class they belong to.
      const unitMeta = new Map<string, { modes: Set<DeliveryMode>; classId: string }>();
      assignments.forEach((a) => {
        const existing = unitMeta.get(a.unitId);
        if (existing) {
          existing.modes.add(a.deliveryMode);
        } else {
          unitMeta.set(a.unitId, { modes: new Set([a.deliveryMode]), classId: a.classId });
        }
      });

      const allUnits = await getPublishedUnits();
      const unitById = new Map(allUnits.map((u) => [u.id, u]));

      const built: UnitGroup[] = [];
      for (const [unitId, meta] of unitMeta) {
        const unit = unitById.get(unitId);
        if (!unit) continue;
        const lessons = await getTopicsByUnit(unitId);
        const lessonWorksheets: LessonWorksheets[] = [];
        for (const lesson of lessons) {
          const activities = await getActivitiesForLesson(lesson.id);
          if (activities.length > 0) lessonWorksheets.push({ lesson, activities });
        }
        if (lessonWorksheets.length > 0) {
          built.push({ unit, modes: meta.modes, classId: meta.classId, lessons: lessonWorksheets });
        }
      }

      built.sort((a, b) => a.unit.title.localeCompare(b.unit.title));
      setGroups(built);
      setLoading(false);
    })();
  }, [teacherId]);

  const filtered = useMemo(() => {
    if (modeFilter === "all") return groups;
    return groups.filter((g) => g.modes.has(modeFilter));
  }, [groups, modeFilter]);

  const totalWorksheets = useMemo(
    () => groups.reduce((n, g) => n + g.lessons.reduce((m, l) => m + l.activities.length, 0), 0),
    [groups]
  );

  if (loading) {
    return <FullPageLoader />;
  }

  const modePills: { id: ModeFilter; label: string; Icon: typeof Users }[] = [
    { id: "all", label: "All assigned", Icon: BookOpen },
    { id: "teacher-led", label: "Teacher-led", Icon: UserCog },
    { id: "student-led", label: "Student-led", Icon: Users },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Resources"
        subtitle="Printable worksheets for the lessons you've assigned — ready to hand out in class"
      />

      {groups.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {modePills.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setModeFilter(id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  modeFilter === id
                    ? "bg-forest-700 text-cream"
                    : "bg-white text-charcoal-soft ring-1 ring-sand hover:bg-forest-50 hover:text-forest-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
              </button>
            ))}
          </div>
          <span className="text-sm text-charcoal-soft">
            <span className="font-semibold text-forest-900">{totalWorksheets}</span> worksheet
            {totalWorksheets !== 1 ? "s" : ""} available
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          Icon={FileText}
          title={groups.length === 0 ? "No worksheets yet" : "Nothing in this filter"}
          message={
            groups.length === 0
              ? "Worksheets are generated from the activities in your assigned lessons. Assign a unit that has activities, then print its worksheets here."
              : "No assignments match this delivery mode."
          }
        />
      ) : (
        <div className="space-y-5">
          {filtered.map((group) => (
            <div
              key={group.unit.id}
              className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5"
            >
              {/* Unit header */}
              <div
                className="relative flex items-center gap-3 overflow-hidden px-5 py-4"
                style={{ background: "linear-gradient(120deg, #204535 0%, #3d7a5e 90%)" }}
              >
                {group.unit.coverImage?.startsWith("http") && (
                  <>
                    <Image src={group.unit.coverImage} alt="" fill className="object-cover" sizes="900px" />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/70 to-forest-950/40" aria-hidden />
                  </>
                )}
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15">
                  <Layers className="h-5 w-5 text-cream" aria-hidden />
                </span>
                <div className="relative min-w-0 flex-1">
                  <h2 className="display truncate text-lg font-bold text-cream">{group.unit.title}</h2>
                  <p className="text-xs text-forest-100/70">
                    {group.unit.subject} · {group.unit.stage}
                  </p>
                </div>
                {group.modes.has("teacher-led") && (
                  <span className="relative inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-forest-950">
                    <UserCog className="h-3 w-3" aria-hidden /> Teacher-led
                  </span>
                )}
              </div>

              {/* Lessons + worksheets */}
              <div className="divide-y divide-sand/70">
                {group.lessons.map(({ lesson, activities }) => (
                  <div key={lesson.id} className="px-5 py-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold text-forest-900">
                      <BookOpen className="h-4 w-4 text-forest-600" aria-hidden />
                      {lesson.title}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {activities.map((activity) => (
                        <Link
                          key={activity.id}
                          href={`/teacher/print/activity/${activity.id}${group.classId ? `?classId=${group.classId}` : ""}`}
                          className="card-lift flex items-center gap-3 rounded-2xl border border-sand bg-cream/40 px-4 py-3"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-100 text-forest-700">
                            <Sparkles className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-forest-900">
                              {activity.title}
                            </p>
                            <div className="mt-0.5">
                              <Badge tone={DIFF_TONE[activity.difficulty] ?? "forest"}>
                                {activity.difficulty}
                              </Badge>
                            </div>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest-700 px-3 py-1.5 text-xs font-bold text-cream">
                            <Printer className="h-3.5 w-3.5" aria-hidden /> Print
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
