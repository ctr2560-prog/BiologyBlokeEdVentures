"use client";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button, Badge, ProgressBar } from "@/components/ui/primitives";
import { VideoCard } from "@/components/cards/ContentCards";
import {
  getUser,
  getClass,
  getAssignmentsByClass,
  getTopicsByUnit,
  getVideosByTopic,
  getProgressByStudent,
  getBadges,
} from "@/lib/dataService";
import { explorerPoints, earnedBadges } from "@/data/progress";
import { conservationFacts, exploreEcosystems } from "@/data/content";
import { DEMO_STUDENT_ID } from "@/data/people";
import { getBadgeIcon, getEcoIcon } from "@/lib/icons";
import { Play, Star, Film, Award, Globe, type LucideIcon } from "lucide-react";

export default function StudentHome() {
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const student = getUser(studentId);
  const points = explorerPoints[studentId] ?? 0;
  const myBadges = (earnedBadges[studentId] ?? []).map((id) => getBadges().find((b) => b.id === id)).filter(Boolean);

  // Find the next unfinished assigned video.
  const classId = student?.classIds[0];
  const assignments = classId ? getAssignmentsByClass(classId) : [];
  const progress = getProgressByStudent(studentId);
  const watchedIds = new Set(progress.filter((p) => p.videoCompletionPercentage >= 90).map((p) => p.videoId));

  const assignedVideos = assignments.flatMap((a) =>
    a.topicIds.flatMap((tid) => getVideosByTopic(tid))
  );
  const continueVideo = assignedVideos.find((v) => !watchedIds.has(v.id)) ?? assignedVideos[0];
  const fact = conservationFacts[new Date().getDate() % conservationFacts.length];
  const featured = exploreEcosystems[new Date().getDate() % exploreEcosystems.length];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-cream shadow-hero"
        style={{ background: "linear-gradient(120deg, #14352a 0%, #2d6a4f 55%, #40916c 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-forest-100/80">Welcome back, Explorer</p>
            <h1 className="display mt-1 text-3xl font-bold md:text-4xl">Hi {student?.name?.split(" ")[0]}!</h1>
            <p className="mt-2 max-w-md text-forest-100/90">
              Continue your Edventure and unlock your next conservation challenge.
            </p>
            {continueVideo && (
              <Link href={`/student/watch/${continueVideo.id}`}>
                <Button size="lg" variant="secondary" className="mt-4">
                  <Play className="h-4 w-4" aria-hidden /> Continue learning: {continueVideo.title}
                </Button>
              </Link>
            )}
          </div>
          <div className="glass rounded-3xl p-5 text-center text-forest-900">
            <p className="text-xs font-semibold uppercase tracking-wide">Explorer points</p>
            <p className="display flex items-center justify-center gap-1.5 text-4xl font-bold">
              <Star className="h-7 w-7 fill-gold-400 text-gold-500" aria-hidden /> {points}
            </p>
            <div className="mt-2 flex justify-center gap-1.5">
              {myBadges.slice(0, 4).map((b) => {
                const I = getBadgeIcon(b!.id);
                return <I key={b!.id} className="h-5 w-5 text-forest-700" aria-hidden />;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Current class work */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="display text-xl font-bold text-forest-900">Your current class work</h2>
          <Link href="/student/classwork" className="text-sm font-semibold text-forest-700 hover:underline">See all </Link>
        </div>
        {assignedVideos.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedVideos.slice(0, 3).map((v) => {
              const prog = progress.find((p) => p.videoId === v.id);
              return (
                <VideoCard
                  key={v.id}
                  video={v}
                  href={`/student/watch/${v.id}`}
                  progress={prog?.videoCompletionPercentage ?? 0}
                  points={20}
                />
              );
            })}
          </div>
        ) : (
          <p className="rounded-3xl bg-white p-6 text-charcoal-soft shadow-soft">No lessons assigned yet, check back soon!</p>
        )}
      </div>

      {/* Featured ecosystem + daily fact */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Link
          href="/student/explore"
          className="card-lift relative overflow-hidden rounded-3xl p-8 text-cream"
          style={{ background: `linear-gradient(120deg, ${featured.color}, #0d2419)` }}
        >
          <Badge tone="gold">Featured ecosystem</Badge>
          <div className="mt-4 flex items-center gap-4">
            {(() => { const I = getEcoIcon(featured.id); return <I className="h-14 w-14 shrink-0" aria-hidden strokeWidth={1.5} />; })()}
            <div>
              <h3 className="display text-2xl font-bold">{featured.name}</h3>
              <p className="mt-1 max-w-sm text-forest-100/90">{featured.blurb}</p>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold">Explore this world</p>
        </Link>
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
          <Link href="/student/progress" className="text-sm font-semibold text-forest-700 hover:underline">View progress </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <JourneyStat label="Reels watched" value={progress.length} Icon={Film} />
          <JourneyStat label="Badges earned" value={myBadges.length} Icon={Award} />
          <div className="rounded-2xl bg-cream/60 p-4">
            <p className="text-sm text-charcoal-soft">Next badge</p>
            <p className="display mt-1 font-bold text-forest-900">Rainforest Ranger </p>
            <div className="mt-2"><ProgressBar value={Math.min(100, (points / 150) * 100)} tone="gold" /></div>
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
