"use client";
/*
 * cool.org-style browse cards for the teacher library and dashboard:
 * banner + type pill (Unit / Lesson) + featured star, title, meta row.
 */
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/primitives";
import { Layers, BookOpen, Film, CircleHelp, Star, ArrowRight } from "lucide-react";
import type { Unit, Topic } from "@/types";

export function TypePill({ type }: { type: "unit" | "lesson" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        type === "unit" ? "bg-gold-400 text-forest-950" : "bg-white/95 text-forest-800"
      }`}
    >
      {type}
    </span>
  );
}

function FeaturedStar() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/95" title="Featured">
      <Star className="h-4 w-4 fill-gold-500 text-gold-500" aria-hidden />
    </span>
  );
}

export function LibraryUnitCard({
  unit,
  lessonCount,
}: {
  unit: Unit;
  lessonCount: number;
}) {
  const href = `/teacher/library/unit/${unit.id}`;
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5 transition-all hover:shadow-lift hover:ring-forest-400/40">
      {/* Banner */}
      <Link href={href} className="relative block h-32 w-full" aria-label={`View unit ${unit.title}`}>
        {unit.coverImage?.startsWith("http") ? (
          <>
            <Image
              src={unit.coverImage}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 via-transparent to-transparent" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(120deg, #204535 0%, #3d7a5e 80%)" }}
            />
            <Layers className="absolute -bottom-3 right-4 h-16 w-16 text-white/10 transition-transform group-hover:scale-110" aria-hidden />
          </>
        )}
        <div className="absolute left-3 top-3">
          <TypePill type="unit" />
        </div>
        {unit.featured && (
          <div className="absolute right-3 top-3">
            <FeaturedStar />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={href}>
          <h3 className="display line-clamp-2 text-base font-bold leading-snug text-forest-900 hover:underline">
            {unit.title}
          </h3>
        </Link>
        {unit.description && (
          <p className="line-clamp-2 text-xs text-charcoal-soft">{unit.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-charcoal-soft">
          <Badge tone="forest">{unit.subject}</Badge>
          {unit.stage && <Badge tone="gold">{unit.stage}</Badge>}
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
          </span>
        </div>
        <Link
          href={href}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-forest-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-forest-800"
        >
          View unit <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function LibraryLessonCard({
  lesson,
  unitTitle,
  assignHref,
}: {
  lesson: Topic;
  unitTitle?: string;
  assignHref?: string;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5 transition-all hover:shadow-lift hover:ring-mist-400/60">
      {/* Banner */}
      <div className="relative h-32 w-full">
        {lesson.coverImage?.startsWith("http") ? (
          <>
            <Image
              src={lesson.coverImage}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 via-transparent to-transparent" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(120deg, #33566d 0%, #5c8aa8 80%)" }}
            />
            <BookOpen className="absolute -bottom-3 right-4 h-16 w-16 text-white/10 transition-transform group-hover:scale-110" aria-hidden />
          </>
        )}
        <div className="absolute left-3 top-3">
          <TypePill type="lesson" />
        </div>
        {lesson.featured && (
          <div className="absolute right-3 top-3">
            <FeaturedStar />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="display line-clamp-2 text-base font-bold leading-snug text-forest-900">
          {lesson.title}
        </h3>
        {lesson.description && (
          <p className="line-clamp-2 text-xs text-charcoal-soft">{lesson.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-charcoal-soft">
          <Badge tone="forest">{lesson.subject}</Badge>
          <Badge tone="gold">{lesson.stage}</Badge>
          <span className="flex items-center gap-1">
            <Film className="h-3.5 w-3.5" aria-hidden /> {lesson.videoIds.length}
          </span>
          <span className="flex items-center gap-1">
            <CircleHelp className="h-3.5 w-3.5" aria-hidden /> {lesson.quizIds.length}
          </span>
        </div>
        <p className="text-[11px] text-charcoal-soft/70">
          {unitTitle ? `Part of ${unitTitle}` : "Standalone lesson"}
        </p>
        {assignHref ? (
          <Link
            href={assignHref}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-full bg-forest-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-forest-800"
          >
            Assign <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : (
          <span className="mt-1 flex w-full items-center justify-center rounded-full bg-cream px-4 py-2 text-xs font-semibold text-charcoal-soft ring-1 ring-sand">
            Not in a unit yet
          </span>
        )}
      </div>
    </div>
  );
}
