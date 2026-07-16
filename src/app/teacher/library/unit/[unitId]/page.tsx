"use client";
/*
 * Teacher unit detail (cool.org style): hero with the unit overview,
 * downloadable Word documents (unit program + assessment task), and the
 * individual lessons — each assignable on its own.
 */
import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, Badge, EmptyState } from "@/components/ui/primitives";
import { TypePill } from "@/components/cards/LibraryCards";
import {
  getUnit,
  getTopicsByUnit,
  unitDocFilename,
} from "@/lib/supabaseService";
import { toSlidesEmbedUrl } from "@/lib/slides";
import {
  ArrowLeft, ArrowRight, BookOpen, Film, CircleHelp, FileText,
  Download, Layers, Loader, Star, Check, Presentation,
} from "lucide-react";
import type { Unit, Topic } from "@/types";

export default function TeacherUnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = use(params);

  const [unit, setUnit] = useState<Unit | null>(null);
  const [lessons, setLessons] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUnit(unitId), getTopicsByUnit(unitId)]).then(([u, ls]) => {
      setUnit(u);
      setLessons(ls);
      setLoading(false);
    });
  }, [unitId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!unit) {
    return (
      <EmptyState
        title="Unit not found"
        message="This unit may have been removed or unpublished."
        action={
          <Link href="/teacher/library">
            <Button>Back to library</Button>
          </Link>
        }
      />
    );
  }

  const docs = [
    { label: "Unit program", url: unit.program ?? "" },
    { label: "Assessment task", url: unit.assessmentTask ?? "" },
  ].filter((d) => d.url.startsWith("http"));

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/library"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl shadow-hero"
        style={{ background: "linear-gradient(120deg, #14352a 0%, #2d6a4f 90%)" }}
      >
        {unit.coverImage?.startsWith("http") ? (
          <>
            <Image src={unit.coverImage} alt="" fill className="object-cover" sizes="1200px" priority />
            {/* Scrim so the hero copy stays legible over any photo */}
            <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/60 to-forest-950/30" />
          </>
        ) : (
          <Layers className="absolute -bottom-8 right-6 h-44 w-44 text-white/[0.06]" aria-hidden />
        )}
        <div className="relative px-6 py-8 md:px-9 md:py-10">
          <div className="flex items-center gap-2">
            <TypePill type="unit" />
            {unit.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-clay-600">
                <Star className="h-3 w-3 fill-gold-500 text-gold-500" aria-hidden /> Featured
              </span>
            )}
          </div>
          <h1 className="display mt-3 max-w-2xl text-3xl font-bold text-cream md:text-4xl">
            {unit.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-forest-100/80">
            {unit.stage && <Badge tone="gold">{unit.stage}</Badge>}
            {unit.yearGroups.length > 0 && <span>{unit.yearGroups.join(", ")}</span>}
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" aria-hidden />
              {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
            </span>
          </div>
          {unit.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/90">
              {unit.description}
            </p>
          )}
          <Link href={`/teacher/assign?unit=${unit.id}`} className="mt-6 inline-block">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-forest-950 transition-colors hover:bg-gold-300">
              Assign this unit <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem] lg:items-start">
        {/* ── Lessons ── */}
        <section className="space-y-3">
          <h2 className="display text-xl font-bold text-forest-900">Lessons in this unit</h2>
          {lessons.length === 0 ? (
            <p className="rounded-3xl bg-white p-6 text-sm text-charcoal-soft shadow-soft ring-1 ring-black/5">
              No lessons in this unit yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {lessons.map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-black/5 transition-all hover:shadow-lift"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest-50 text-sm font-bold text-forest-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-forest-900">{l.title}</p>
                      <TypePill type="lesson" />
                    </div>
                    {l.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-charcoal-soft">{l.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-charcoal-soft">
                      <span className="flex items-center gap-1">
                        <Film className="h-3.5 w-3.5" aria-hidden /> {l.videoIds.length} video{l.videoIds.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <CircleHelp className="h-3.5 w-3.5" aria-hidden /> {l.quizIds.length} quiz{l.quizIds.length !== 1 ? "zes" : ""}
                      </span>
                      <Badge
                        tone={
                          l.difficulty === "foundation" ? "clay"
                          : l.difficulty === "advanced" ? "mist"
                          : "forest"
                        }
                      >
                        {l.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {l.slidesUrl && toSlidesEmbedUrl(l.slidesUrl) && (
                      <Link
                        href={`/teacher/present/slides/${l.id}`}
                        title="Present the lesson slides to the class"
                        className="flex items-center gap-1.5 rounded-full border border-forest-400 bg-white px-3.5 py-2 text-xs font-bold text-forest-700 transition-colors hover:bg-forest-50"
                      >
                        <Presentation className="h-3.5 w-3.5" aria-hidden /> Present slides
                      </Link>
                    )}
                    <Link
                      href={`/teacher/assign?unit=${unit.id}&lesson=${l.id}`}
                      className="rounded-full bg-forest-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-forest-800"
                    >
                      Assign
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Sidebar: documents + outcomes ── */}
        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
            <h3 className="display text-base font-bold text-forest-900">Unit documents</h3>
            <p className="mt-0.5 text-xs text-charcoal-soft">
              Download and adapt for your school.
            </p>
            {docs.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-cream/60 px-4 py-3 text-xs text-charcoal-soft">
                No documents added to this unit yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {docs.map((d) => (
                  <a
                    key={d.label}
                    href={d.url}
                    download
                    className="group flex items-center gap-3 rounded-2xl bg-cream/60 p-3 ring-1 ring-sand transition-colors hover:bg-mist-100/40 hover:ring-mist-400/50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mist-100">
                      <FileText className="h-5 w-5 text-mist-600" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-forest-900">{d.label}</span>
                      <span className="block truncate text-[11px] text-charcoal-soft">
                        {unitDocFilename(d.url)}
                      </span>
                    </span>
                    <Download className="h-4 w-4 shrink-0 text-charcoal-soft transition-colors group-hover:text-forest-700" aria-hidden />
                  </a>
                ))}
              </div>
            )}
          </div>

          {unit.outcomes.length > 0 && (
            <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
              <h3 className="display text-base font-bold text-forest-900">Outcomes</h3>
              <ul className="mt-3 space-y-2">
                {unit.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-xs text-charcoal">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
