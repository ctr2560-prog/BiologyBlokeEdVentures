"use client";
import { useApp } from "@/lib/store";
import { SectionHeader, Badge, ProgressBar } from "@/components/ui/primitives";
import { getBadges } from "@/lib/dataService";
import { explorerPoints, earnedBadges } from "@/data/progress";
import { DEMO_STUDENT_ID } from "@/data/people";
import { getBadgeIcon } from "@/lib/icons";
import { Star, Check, Film, HelpCircle, FileText, Sparkles, Compass, Trophy, type LucideIcon } from "lucide-react";

const earnRules: { label: string; pts: number; Icon: LucideIcon }[] = [
  { label: "Complete a video", pts: 20, Icon: Film },
  { label: "Complete a quiz", pts: 10, Icon: HelpCircle },
  { label: "Complete a worksheet", pts: 15, Icon: FileText },
  { label: "Score 80%+ on a quiz", pts: 20, Icon: Sparkles },
  { label: "Click “I’m curious”", pts: 5, Icon: Compass },
  { label: "Finish a conservation challenge", pts: 50, Icon: Trophy },
];

export default function ExplorerPoints() {
  const { currentUser, version } = useApp();
  void version;
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const points = explorerPoints[studentId] ?? 0;
  const owned = new Set(earnedBadges[studentId] ?? []);
  const allBadges = getBadges();

  return (
    <div className="space-y-6">
      <SectionHeader title="Explorer Points" subtitle="Earn points and unlock conservation badges" />

      {/* Points hero */}
      <div className="overflow-hidden rounded-3xl p-8 text-center text-cream shadow-hero" style={{ background: "linear-gradient(120deg, #2d6a4f, #14352a)" }}>
        <p className="text-sm font-medium text-forest-100/80">Your explorer points</p>
        <p className="display mt-1 flex items-center justify-center gap-2 text-5xl font-bold">
          <Star className="h-9 w-9 fill-gold-400 text-gold-500" aria-hidden /> {points}
        </p>
        <p className="mt-2 text-forest-100/90">{owned.size} of {allBadges.length} badges unlocked</p>
      </div>

      {/* Badge gallery */}
      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">Badge collection</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {allBadges.map((b) => {
            const unlocked = owned.has(b.id);
            return (
              <div
                key={b.id}
                className={`rounded-3xl p-5 text-center shadow-soft ring-1 ring-black/5 transition-all ${unlocked ? "bg-white" : "bg-cream/40"}`}
              >
                {(() => { const I = getBadgeIcon(b.id); return <I className={`mx-auto h-11 w-11 ${unlocked ? "text-forest-700" : "text-charcoal/25"}`} aria-hidden strokeWidth={1.5} />; })()}
                <h3 className="display mt-2 text-sm font-bold text-forest-900">{b.name}</h3>
                <p className="mt-0.5 text-xs text-charcoal-soft">{b.description}</p>
                <div className="mt-2">
                  {unlocked ? (
                    <Badge tone="forest"><Check className="h-3 w-3" aria-hidden /> Unlocked</Badge>
                  ) : (
                    <div>
                      <ProgressBar value={Math.min(100, (points / b.pointsRequired) * 100)} tone="gold" />
                      <p className="mt-1 text-xs text-charcoal-soft">{b.pointsRequired} pts</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to earn */}
      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">How to earn points</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {earnRules.map((r) => (
            <div key={r.label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700"><r.Icon className="h-4 w-4" aria-hidden /></span>
              <span className="flex-1 text-sm font-medium text-charcoal">{r.label}</span>
              <Badge tone="gold">+{r.pts}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
