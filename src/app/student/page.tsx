"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button, Badge, ProgressBar } from "@/components/ui/primitives";
import Image from "next/image";
import { getEcosystems } from "@/lib/supabaseService";
import { conservationFacts } from "@/data/content";
import { getEcoIconByKey } from "@/lib/icons";
import { Play, Star, Film, Award, Globe, type LucideIcon } from "lucide-react";
import type { Ecosystem } from "@/types";

type RawProgress = {
  video_id: string;
  video_completion_percentage: number;
  [k: string]: unknown;
};

// A whole assigned lesson (the unit of work students engage with).
type AssignedLesson = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  videoIds: string[];
};

export default function StudentHome() {
  const { currentUser } = useApp();
  const [lessons, setLessons] = useState<AssignedLesson[]>([]);
  const [progress, setProgress] = useState<RawProgress[]>([]);
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/student/classwork")
        .then((r) => r.json())
        .then((data) => {
          if (data.error) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const assignments: any[] = data.assignments ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const topics: Record<string, any> = data.topics ?? {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const videosByTopic: Record<string, any[]> = data.videosByTopic ?? {};

          // Unique lessons across all assignments, in order.
          const seen = new Set<string>();
          const assigned: AssignedLesson[] = [];
          for (const a of assignments) {
            for (const at of a.assignment_topics ?? []) {
              const t = topics[at.topic_id];
              if (!t || seen.has(t.id)) continue;
              seen.add(t.id);
              assigned.push({
                id: t.id,
                title: t.title,
                description: t.description ?? "",
                coverImage: t.cover_image ?? "",
                videoIds: (videosByTopic[t.id] ?? []).map((v) => v.id as string),
              });
            }
          }
          setLessons(assigned);
          setProgress(data.progress ?? []);
        })
        .catch(() => {}),
      getEcosystems()
        .then((ecos) => setEcosystems(ecos.filter((e) => e.published)))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const watchedIds = new Set(
    progress.filter((p) => p.video_completion_percentage >= 90).map((p) => p.video_id)
  );
  const lessonProgress = (l: AssignedLesson) =>
    l.videoIds.length
      ? Math.round((l.videoIds.filter((id) => watchedIds.has(id)).length / l.videoIds.length) * 100)
      : 0;
  // The lesson to resume: first not fully done, else the first.
  const continueLesson = lessons.find((l) => lessonProgress(l) < 100) ?? lessons[0];
  const points = progress.length * 20;

  const fact = conservationFacts[new Date().getDate() % conservationFacts.length];
  // Admin-starred ecosystem wins; otherwise rotate daily through the list
  const featured =
    ecosystems.find((e) => e.featured) ??
    (ecosystems.length > 0 ? ecosystems[new Date().getDate() % ecosystems.length] : null);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-48 animate-pulse rounded-3xl bg-charcoal/8" />
        <div className="h-6 w-48 animate-pulse rounded-full bg-charcoal/8" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-cream shadow-hero"
        style={{ background: "linear-gradient(120deg, #14352a 0%, #2d6a4f 55%, #40916c 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-forest-100/80">Welcome back, Explorer</p>
            <h1 className="display mt-1 text-3xl font-bold md:text-4xl">
              Hi {currentUser?.name?.split(" ")[0] ?? "Explorer"}!
            </h1>
            <p className="mt-2 max-w-md text-forest-100/90">
              Continue your Edventure and unlock your next conservation challenge.
            </p>
            {continueLesson && (
              <Link href={`/student/lesson/${continueLesson.id}`}>
                <Button size="lg" variant="secondary" className="mt-4">
                  <Play className="h-4 w-4" aria-hidden /> Continue learning: {continueLesson.title}
                </Button>
              </Link>
            )}
          </div>
          <div className="glass rounded-3xl p-5 text-center text-forest-900">
            <p className="text-xs font-semibold uppercase tracking-wide">Explorer points</p>
            <p className="display flex items-center justify-center gap-1.5 text-4xl font-bold">
              <Star className="h-7 w-7 fill-gold-400 text-gold-500" aria-hidden /> {points}
            </p>
          </div>
        </div>
      </div>

      {/* Current class work */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="display text-xl font-bold text-forest-900">Your current class work</h2>
          <Link href="/student/classwork" className="text-sm font-semibold text-forest-700 hover:underline">
            See all
          </Link>
        </div>
        {lessons.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.slice(0, 3).map((l) => {
              const pct = lessonProgress(l);
              const done = pct >= 100;
              return (
                <Link
                  key={l.id}
                  href={`/student/lesson/${l.id}`}
                  className="card-lift group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5"
                >
                  <div
                    className="relative flex h-32 items-center justify-center overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #1b4332, #40916c)" }}
                  >
                    {l.coverImage?.startsWith("http") ? (
                      <Image src={l.coverImage} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="400px" />
                    ) : (
                      <Film className="h-10 w-10 text-cream/80" aria-hidden strokeWidth={1.5} />
                    )}
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/60 to-transparent" aria-hidden />
                    <span className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-semibold text-cream drop-shadow">
                      <span className="inline-flex items-center gap-1"><Film className="h-3.5 w-3.5" aria-hidden /> {l.videoIds.length}</span>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="display font-bold leading-snug text-forest-900">{l.title}</h3>
                    {l.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-charcoal-soft">{l.description}</p>
                    )}
                    <div className="mt-3">
                      <ProgressBar value={pct} tone={done ? "forest" : "gold"} showLabel />
                    </div>
                    <span className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-forest-700 py-2.5 text-sm font-bold text-cream transition-colors group-hover:bg-forest-800">
                      <Play className="h-4 w-4" aria-hidden />
                      {done ? "Review lesson" : pct > 0 ? "Continue lesson" : "Start lesson"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="rounded-3xl bg-white p-6 text-charcoal-soft shadow-soft">
            No lessons assigned yet, check back soon!
          </p>
        )}
      </div>

      {/* Featured ecosystem + daily fact */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {featured && (
          <Link
            href="/student/explore"
            className="card-lift relative overflow-hidden rounded-3xl p-8 text-cream"
            style={{ background: `linear-gradient(120deg, ${featured.color}, #0d2419)` }}
          >
            <Badge tone="gold">Featured ecosystem</Badge>
            <div className="mt-4 flex items-center gap-4">
              {(() => {
                const I = getEcoIconByKey(featured.icon, featured.id);
                return <I className="h-14 w-14 shrink-0" aria-hidden strokeWidth={1.5} />;
              })()}
              <div>
                <h3 className="display text-2xl font-bold">{featured.name}</h3>
                <p className="mt-1 max-w-sm text-forest-100/90">{featured.blurb}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold">Explore this world</p>
          </Link>
        )}
        <div className="rounded-3xl bg-gold-300/30 p-6 ring-1 ring-gold-300/50">
          <Globe className="h-8 w-8 text-forest-600" aria-hidden strokeWidth={1.75} />
          <h3 className="display mt-2 font-bold text-forest-900">Daily conservation fact</h3>
          <p className="mt-2 text-sm text-charcoal">{fact}</p>
        </div>
      </div>

      {/* Progress snapshot */}
      <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="display text-xl font-bold text-forest-900">Your journey</h2>
          <Link href="/student/progress" className="text-sm font-semibold text-forest-700 hover:underline">
            View progress
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <JourneyStat label="Reels watched" value={progress.length} Icon={Film} />
          <JourneyStat label="Badges earned" value={0} Icon={Award} />
          <div className="rounded-2xl bg-cream/60 p-4">
            <p className="text-sm text-charcoal-soft">Next badge</p>
            <p className="display mt-1 font-bold text-forest-900">Rainforest Ranger</p>
            <div className="mt-2">
              <ProgressBar value={Math.min(100, (points / 150) * 100)} tone="gold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyStat({ label, value, Icon }: { label: string; value: number; Icon: LucideIcon }) {
  return (
    <div className="rounded-2xl bg-cream/60 p-4">
      <Icon className="h-7 w-7 text-forest-600" aria-hidden strokeWidth={1.75} />
      <p className="display mt-1 text-2xl font-bold text-forest-900">{value}</p>
      <p className="text-sm text-charcoal-soft">{label}</p>
    </div>
  );
}
