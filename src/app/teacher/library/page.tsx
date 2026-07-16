"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SectionHeader, EmptyState } from "@/components/ui/primitives";
import { LibraryUnitCard, LibraryLessonCard } from "@/components/cards/LibraryCards";
import {
  getPublishedUnits,
  getTopics,
  getUnitLessonLinks,
} from "@/lib/supabaseService";
import { Search, X, LibraryBig, SlidersHorizontal } from "lucide-react";
import type { Unit, Topic, Subject, Stage } from "@/types";
import { SUBJECTS } from "@/types";

type TypeFilter = "all" | "units" | "lessons";
type StageFilter = "all" | Stage;
type SubjectFilter = "all" | Subject;

type LibraryEntry =
  | { kind: "unit"; unit: Unit }
  | { kind: "lesson"; lesson: Topic };

const STAGE_OPTIONS: StageFilter[] = ["all", "Stage 3", "Stage 4", "Stage 5"];

function LibraryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Topic[]>([]);
  const [links, setLinks] = useState<Array<{ unitId: string; lessonId: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");

  // Old deep links (?unit=) now land on the unit detail page
  useEffect(() => {
    const unitParam = searchParams.get("unit");
    if (unitParam) router.replace(`/teacher/library/unit/${unitParam}`);
  }, [searchParams, router]);

  useEffect(() => {
    Promise.all([getPublishedUnits(), getTopics(), getUnitLessonLinks()]).then(
      ([u, t, l]) => {
        setUnits(u);
        setLessons(t);
        setLinks(l);
        setLoading(false);
      }
    );
  }, []);

  const unitByLesson = useMemo(() => {
    const m = new Map<string, string>();
    links.forEach(({ unitId, lessonId }) => {
      if (!m.has(lessonId)) m.set(lessonId, unitId);
    });
    return m;
  }, [links]);
  const unitTitleById = useMemo(
    () => new Map(units.map((u) => [u.id, u.title])),
    [units]
  );
  const lessonCountByUnit = useMemo(() => {
    const m = new Map<string, number>();
    links.forEach(({ unitId }) => m.set(unitId, (m.get(unitId) ?? 0) + 1));
    return m;
  }, [links]);

  const query = search.trim().toLowerCase();

  // Only surface subjects that actually have content, in curriculum order.
  const availableSubjects = useMemo(() => {
    const present = new Set<string>([
      ...units.map((u) => u.subject),
      ...lessons.map((l) => l.subject),
    ]);
    return SUBJECTS.filter((s) => present.has(s));
  }, [units, lessons]);

  const entryStage = (e: LibraryEntry) => (e.kind === "unit" ? e.unit.stage : e.lesson.stage);
  const entrySubject = (e: LibraryEntry) => (e.kind === "unit" ? e.unit.subject : e.lesson.subject);

  const entries: LibraryEntry[] = useMemo(() => {
    const all: LibraryEntry[] = [
      ...units.map((unit) => ({ kind: "unit" as const, unit })),
      ...lessons.map((lesson) => ({ kind: "lesson" as const, lesson })),
    ];
    return all
      .filter((e) => {
        if (filter === "units" && e.kind !== "unit") return false;
        if (filter === "lessons" && e.kind !== "lesson") return false;
        if (subjectFilter !== "all" && entrySubject(e) !== subjectFilter) return false;
        if (stageFilter !== "all" && entryStage(e) !== stageFilter) return false;
        if (!query) return true;
        const text = e.kind === "unit"
          ? `${e.unit.title} ${e.unit.description}`
          : `${e.lesson.title} ${e.lesson.description}`;
        return text.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const af = a.kind === "unit" ? a.unit.featured : a.lesson.featured;
        const bf = b.kind === "unit" ? b.unit.featured : b.lesson.featured;
        if (af !== bf) return af ? -1 : 1;
        const at = a.kind === "unit" ? a.unit.title : a.lesson.title;
        const bt = b.kind === "unit" ? b.unit.title : b.lesson.title;
        return at.localeCompare(bt);
      });
  }, [units, lessons, filter, subjectFilter, stageFilter, query]);

  const filtersActive =
    filter !== "all" || subjectFilter !== "all" || stageFilter !== "all" || query !== "";
  const clearAll = () => {
    setFilter("all");
    setSubjectFilter("all");
    setStageFilter("all");
    setSearch("");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-charcoal/8" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Library"
        subtitle="Explore Edventure units and lessons — assign them straight to your classes"
      />

      {/* Filter panel */}
      <div className="space-y-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft/50" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search units and lessons…"
            className="w-full rounded-full border border-sand bg-cream/40 py-2.5 pl-11 pr-10 text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-forest-400 focus:bg-white focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-charcoal-soft/50 hover:bg-sand hover:text-charcoal"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSelect
            label="Show"
            value={filter}
            onChange={(v) => setFilter(v as TypeFilter)}
          >
            <option value="all">All ({units.length + lessons.length})</option>
            <option value="units">Units ({units.length})</option>
            <option value="lessons">Lessons ({lessons.length})</option>
          </FilterSelect>

          <FilterSelect
            label="Learning area"
            value={subjectFilter}
            onChange={(v) => setSubjectFilter(v as SubjectFilter)}
          >
            <option value="all">All learning areas</option>
            {(availableSubjects.length ? availableSubjects : SUBJECTS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Stage"
            value={stageFilter}
            onChange={(v) => setStageFilter(v as StageFilter)}
          >
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All stages" : s}</option>
            ))}
          </FilterSelect>

          {filtersActive && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 self-center rounded-full px-3 py-2 text-xs font-semibold text-charcoal-soft hover:text-clay-600 sm:ml-auto"
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center gap-2 text-sm text-charcoal-soft">
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        <span>
          <span className="font-semibold text-forest-900">{entries.length}</span>{" "}
          {entries.length === 1 ? "result" : "results"}
          {subjectFilter !== "all" && ` in ${subjectFilter}`}
          {stageFilter !== "all" && ` · ${stageFilter}`}
        </span>
      </div>

      {/* Grid */}
      {entries.length === 0 ? (
        <EmptyState
          Icon={LibraryBig}
          title={filtersActive ? "No matches" : "Nothing here yet"}
          message={filtersActive ? "Try widening your filters." : "Content will appear here once it's published."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map((e) =>
            e.kind === "unit" ? (
              <LibraryUnitCard
                key={`u-${e.unit.id}`}
                unit={e.unit}
                lessonCount={lessonCountByUnit.get(e.unit.id) ?? 0}
              />
            ) : (
              <LibraryLessonCard
                key={`l-${e.lesson.id}`}
                lesson={e.lesson}
                unitTitle={
                  unitByLesson.has(e.lesson.id)
                    ? unitTitleById.get(unitByLesson.get(e.lesson.id)!)
                    : undefined
                }
                assignHref={
                  unitByLesson.has(e.lesson.id)
                    ? `/teacher/assign?unit=${unitByLesson.get(e.lesson.id)}&lesson=${e.lesson.id}`
                    : undefined
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-charcoal-soft/70">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[10rem] rounded-full border border-sand bg-cream/40 px-4 py-2 text-sm font-semibold text-forest-900 focus:border-forest-400 focus:bg-white focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

export default function TeacherLibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft">Loading library…</div>}>
      <LibraryInner />
    </Suspense>
  );
}
