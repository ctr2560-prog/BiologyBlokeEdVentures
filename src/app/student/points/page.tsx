"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, Badge, ProgressBar } from "@/components/ui/primitives";
import { getBadges } from "@/lib/dataService";
import { getPointsTotal, getPointsHistory } from "@/lib/supabaseService";
import { DEMO_STUDENT_ID } from "@/data/people";
import { getBadgeIcon } from "@/lib/icons";
import {
  Star,
  Check,
  Film,
  FileText,
  Sparkles,
  Compass,
  Loader,
  type LucideIcon,
} from "lucide-react";

const earnRules: { label: string; pts: number; Icon: LucideIcon }[] = [
  { label: "Complete a video", pts: 20, Icon: Film },
  { label: "Score 80%+ on a quiz", pts: 20, Icon: Sparkles },
  { label: "Complete a worksheet", pts: 15, Icon: FileText },
  { label: "Complete an activity", pts: 15, Icon: FileText },
  { label: "Click \"I'm curious\"", pts: 5, Icon: Compass },
];

const EVENT_LABEL: Record<string, string> = {
  video_completed: "Watched a video",
  quiz_ace: "Aced a quiz (80%+)",
  worksheet_completed: "Completed a worksheet",
  activity_completed: "Completed an activity",
  curious_click: "Clicked curious",
};

export default function ExplorerPoints() {
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<
    { eventType: string; points: number; referenceId: string | null; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPointsTotal(studentId), getPointsHistory(studentId)]).then(
      ([total, hist]) => {
        setPoints(total);
        setHistory(hist);
        setLoading(false);
      }
    );
  }, [studentId]);

  const allBadges = getBadges();
  const owned = new Set(allBadges.filter((b) => points >= b.pointsRequired).map((b) => b.id));

  return (
    <div className="space-y-6">
      <SectionHeader title="Explorer Points" subtitle="Earn points and unlock conservation badges" />

      {/* Points hero */}
      <div
        className="overflow-hidden rounded-3xl p-8 text-center text-cream shadow-hero"
        style={{ background: "linear-gradient(120deg, #2d6a4f, #14352a)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader className="h-8 w-8 animate-spin text-cream/60" />
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-forest-100/80">Your explorer points</p>
            <p className="display mt-1 flex items-center justify-center gap-2 text-5xl font-bold">
              <Star className="h-9 w-9 fill-gold-400 text-gold-500" aria-hidden /> {points}
            </p>
            <p className="mt-2 text-forest-100/90">
              {owned.size} of {allBadges.length} badges unlocked
            </p>
          </>
        )}
      </div>

      {/* Badge gallery */}
      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">Badge collection</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {allBadges.map((b) => {
            const unlocked = owned.has(b.id);
            const I = getBadgeIcon(b.id);
            return (
              <div
                key={b.id}
                className={`rounded-3xl p-5 text-center shadow-soft ring-1 ring-black/5 transition-all ${
                  unlocked ? "bg-white" : "bg-cream/40"
                }`}
              >
                <I
                  className={`mx-auto h-11 w-11 ${unlocked ? "text-forest-700" : "text-charcoal/25"}`}
                  aria-hidden
                  strokeWidth={1.5}
                />
                <h3 className="display mt-2 text-sm font-bold text-forest-900">{b.name}</h3>
                <p className="mt-0.5 text-xs text-charcoal-soft">{b.description}</p>
                <div className="mt-2">
                  {unlocked ? (
                    <Badge tone="forest">
                      <Check className="h-3 w-3" aria-hidden /> Unlocked
                    </Badge>
                  ) : (
                    <div>
                      <ProgressBar
                        value={Math.min(100, (points / b.pointsRequired) * 100)}
                        tone="gold"
                      />
                      <p className="mt-1 text-xs text-charcoal-soft">{b.pointsRequired} pts needed</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent earnings history */}
      {history.length > 0 && (
        <div>
          <h2 className="display mb-3 text-xl font-bold text-forest-900">Recent earnings</h2>
          <div className="space-y-2">
            {history.slice(0, 10).map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700">
                  <Star className="h-4 w-4" aria-hidden />
                </span>
                <span className="flex-1 text-sm text-charcoal">
                  {EVENT_LABEL[e.eventType] ?? e.eventType}
                </span>
                <Badge tone="gold">+{e.points}</Badge>
                <span className="text-xs text-charcoal-soft">
                  {e.createdAt.slice(5, 10).replace("-", "/")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How to earn */}
      <div>
        <h2 className="display mb-3 text-xl font-bold text-forest-900">How to earn points</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {earnRules.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700">
                <r.Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-medium text-charcoal">{r.label}</span>
              <Badge tone="gold">+{r.pts}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
