"use client";
/*
 * Content cards: cohesive rounded, tactile cards with large emoji "imagery"
 * placeholders standing in for real wildlife thumbnails. Each is ready to swap
 * the gradient/emoji for a real <Image> once media is uploaded.
 */
import Link from "next/link";
import type { Unit, Video, Resource, Topic, ClassGroup } from "@/types";
import { Badge, ProgressBar } from "@/components/ui/primitives";
import { formatWatchTime } from "@/lib/analytics";

// Warm nature gradients keyed loosely by ecosystem/emoji.
function heroGradient(seed: string): string {
  const gradients = [
    "linear-gradient(135deg, #1b4332 0%, #2d6a4f 55%, #52b788 100%)",
    "linear-gradient(135deg, #8b5e3c 0%, #a47148 55%, #d4a373 100%)",
    "linear-gradient(135deg, #14352a 0%, #40916c 100%)",
    "linear-gradient(135deg, #5c8aa8 0%, #7fa8c9 55%, #a9c5d3 100%)",
    "linear-gradient(135deg, #40916c 0%, #74c69d 100%)",
  ];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % gradients.length;
  return gradients[h];
}

export function UnitCard({ unit, href }: { unit: Unit; href: string }) {
  return (
    <Link
      href={href}
      className="card-lift group block overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5"
    >
      <div
        className="relative flex h-36 items-center justify-center"
        style={{ background: heroGradient(unit.id) }}
      >
        <span className="text-6xl drop-shadow-lg transition-transform group-hover:scale-110">
          {unit.coverEmoji}
        </span>
        <span className="absolute left-3 top-3">
          <Badge tone="gold">{unit.stage}</Badge>
        </span>
        {!unit.published && (
          <span className="absolute right-3 top-3">
            <Badge tone="neutral">Draft</Badge>
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="display text-lg font-bold text-forest-900">{unit.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-charcoal-soft">{unit.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-charcoal-soft">
          <Badge tone="forest">{unit.topicIds.length} topics</Badge>
          <Badge tone="sand">{unit.durationLessons} lessons</Badge>
          <span>{unit.yearGroups.join(" & ")}</span>
        </div>
      </div>
    </Link>
  );
}

export function TopicCard({ topic, href }: { topic: Topic; href?: string }) {
  const inner = (
    <div className="card-lift h-full rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl"
          style={{ background: heroGradient(topic.id), color: "white" }}
        >
          {topic.animalFocus[0]?.[0] ?? "🌿"}
        </span>
        <div>
          <h3 className="display font-bold text-forest-900">{topic.title}</h3>
          <span className="text-xs capitalize text-charcoal-soft">{topic.difficulty}</span>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-charcoal-soft">{topic.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topic.ecosystemFocus.map((e) => (
          <Badge key={e} tone="mist">
            {e}
          </Badge>
        ))}
      </div>
      <div className="mt-3 flex gap-3 text-xs text-charcoal-soft">
        <span>🎬 {topic.videoIds.length}</span>
        <span>📝 {topic.resourceIds.length}</span>
        <span>❓ {topic.quizIds.length}</span>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

export function VideoCard({
  video,
  href,
  progress,
  points,
}: {
  video: Video;
  href?: string;
  progress?: number;
  points?: number;
}) {
  const inner = (
    <div className="card-lift group h-full overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
      <div
        className="relative flex h-40 items-center justify-center"
        style={{ background: heroGradient(video.thumbEmoji) }}
      >
        <span className="text-6xl drop-shadow-lg transition-transform group-hover:scale-110">
          {video.thumbEmoji}
        </span>
        <span className="glass-dark absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold text-cream">
          {formatWatchTime(video.durationSeconds)}
        </span>
        <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full glass text-forest-800 opacity-0 shadow-lift transition-opacity group-hover:opacity-100">
          ▶
        </span>
        {points !== undefined && (
          <span className="absolute left-2 top-2">
            <Badge tone="gold">+{points} pts</Badge>
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="display font-bold leading-snug text-forest-900">{video.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-charcoal-soft">{video.description}</p>
        {progress !== undefined && (
          <div className="mt-3">
            <ProgressBar value={progress} tone="forest" showLabel />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {video.tags.slice(0, 3).map((t) => (
            <Badge key={t} tone="sand">
              #{t}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

const resourceIcon: Record<Resource["type"], string> = {
  worksheet: "📄",
  powerpoint: "📊",
  teacherGuide: "📘",
  assessment: "✅",
  activity: "🎯",
  extension: "🚀",
  support: "🪴",
};

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="card-lift flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-black/5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest-50 text-2xl">
        {resourceIcon[resource.type]}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-forest-900">{resource.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-charcoal-soft">
          <Badge tone="forest">{resource.type}</Badge>
          <span>{resource.stage}</span>
          <span>· {resource.downloads} downloads</span>
        </div>
      </div>
      <a
        href={resource.fileUrl}
        onClick={(e) => e.preventDefault()}
        className="shrink-0 rounded-full bg-forest-50 px-4 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-100"
      >
        Download
      </a>
    </div>
  );
}

export function ClassCard({
  cls,
  studentCount,
  href,
}: {
  cls: ClassGroup;
  studentCount: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card-lift group block overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5"
    >
      <div
        className="flex h-24 items-end justify-between p-4"
        style={{ background: heroGradient(cls.id) }}
      >
        <span className="display text-lg font-bold text-cream drop-shadow">{cls.yearGroup}</span>
        <span className="glass rounded-full px-3 py-1 text-xs font-bold tracking-wider text-forest-800">
          {cls.classCode}
        </span>
      </div>
      <div className="p-5">
        <h3 className="display text-lg font-bold text-forest-900">{cls.name}</h3>
        <div className="mt-2 flex items-center gap-3 text-sm text-charcoal-soft">
          <span>👥 {studentCount} students</span>
          <span>📚 {cls.assignedUnitIds.length} units</span>
        </div>
      </div>
    </Link>
  );
}

export { heroGradient };
