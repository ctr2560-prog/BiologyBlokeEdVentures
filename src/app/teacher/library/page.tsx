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
import { Search, X, LibraryBig } from "lucide-react";
import type { Unit, Topic } from "@/types";

type TypeFilter = "all" | "units" | "lessons";

type LibraryEntry =
  | { kind: "unit"; unit: Unit }
  | { kind: "lesson"; lesson: Topic };

function LibraryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Topic[]>([]);
  const [links, setLinks] = useState<Array<{ unitId: string; lessonId: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TypeFilter>("all");

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
  const entries: LibraryEntry[] = useMemo(() => {
    const all: LibraryEntry[] = [
      ...units.map((unit) => ({ kind: "unit" as const, unit })),
      ...lessons.map((lesson) => ({ kind: "lesson" as const, lesson })),
    ];
    return all
      .filter((e) => {
        if (filter === "units" && e.kind !== "unit") return false;
        if (filter === "lessons" && e.kind !== "lesson") return false;
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
  }, [units, lessons, filter, query]);

  const filterPills: Array<{ id: TypeFilter; label: string; count: number }> = [
    { id: "all",     label: "All",     count: units.length + lessons.length },
    { id: "units",   label: "Units",   count: units.length },
    { id: "lessons", label: "Lessons", count: lessons.length },
  ];

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

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft/50" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search units and lessons…"
            className="w-full rounded-full border border-sand bg-white py-2.5 pl-11 pr-10 text-sm text-charcoal placeholder:text-charcoal-soft/50 shadow-soft focus:border-forest-400 focus:outline-none"
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
        <div className="flex gap-1.5">
          {filterPills.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                filter === id
                  ? "bg-forest-700 text-cream"
                  : "bg-white text-charcoal-soft ring-1 ring-sand hover:bg-forest-50 hover:text-forest-700"
              }`}
            >
              {label} <span className="tabular-nums opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {entries.length === 0 ? (
        <EmptyState
          Icon={LibraryBig}
          title={query ? "No matches" : "Nothing here yet"}
          message={query ? `Nothing matches “${search}”.` : "Content will appear here once it's published."}
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

export default function TeacherLibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft">Loading library…</div>}>
      <LibraryInner />
    </Suspense>
  );
}
