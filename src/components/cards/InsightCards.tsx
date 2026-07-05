"use client";
import type { ReactNode } from "react";
import type { AdaptiveRecommendation } from "@/types";
import { taskTypeMeta } from "@/lib/adaptive";
import { Badge } from "@/components/ui/primitives";

/** A titled insight callout used across dashboards. */
export function InsightCard({
  title,
  children,
  emoji,
  tone = "forest",
}: {
  title: string;
  children: ReactNode;
  emoji?: string;
  tone?: "forest" | "gold" | "mist" | "clay";
}) {
  const tones = {
    forest: "bg-forest-50 ring-forest-100",
    gold: "bg-gold-300/20 ring-gold-300/40",
    mist: "bg-mist-100 ring-mist-400/40",
    clay: "bg-clay-400/10 ring-clay-400/25",
  };
  return (
    <div className={`rounded-3xl p-5 ring-1 ${tones[tone]}`}>
      <h3 className="display flex items-center gap-2 text-sm font-semibold text-forest-900">
        {emoji && <span>{emoji}</span>}
        {title}
      </h3>
      <div className="mt-2 text-sm text-charcoal-soft">{children}</div>
    </div>
  );
}

/**
 * AdaptiveRecommendationPanel — the visible output of the adaptive engine.
 * Shown to both teachers (as guidance) and students (as their next mission).
 */
export function AdaptiveRecommendationPanel({
  rec,
  audience = "student",
}: {
  rec: AdaptiveRecommendation;
  audience?: "student" | "teacher";
}) {
  const meta = taskTypeMeta(rec.recommendedTaskType);
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
      <div
        className="flex items-center gap-3 px-5 py-4 text-cream"
        style={{ background: `linear-gradient(120deg, ${meta.color}, #1b4332)` }}
      >
        <span className="text-2xl">{meta.emoji}</span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
            {audience === "student" ? "Your next mission" : "Recommended pathway"}
          </p>
          <p className="display text-lg font-bold">{meta.label} task</p>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-sm text-charcoal">{rec.recommendedTaskMessage}</p>
        <div className="flex flex-wrap gap-2">
          <Badge tone="forest">Focus: {rec.adaptiveFocusArea}</Badge>
          <Badge tone="sand">Engagement: {rec.engagementLevel}</Badge>
          <Badge tone="mist">Understanding: {rec.comprehensionLevel}</Badge>
        </div>
        {rec.exploreSuggestion && (
          <p className="rounded-2xl bg-mist-100 px-3 py-2 text-sm text-mist-600">
            🔭 {rec.exploreSuggestion}
          </p>
        )}
        {rec.supportSuggestion && (
          <p className="rounded-2xl bg-clay-400/10 px-3 py-2 text-sm text-clay-600">
            🤝 {rec.supportSuggestion}
          </p>
        )}
      </div>
    </div>
  );
}

/** Small engagement pill used in tables. */
export function EngagementPill({ level }: { level: "low" | "medium" | "high" }) {
  const map = {
    low: { tone: "clay" as const, label: "Low" },
    medium: { tone: "gold" as const, label: "Medium" },
    high: { tone: "forest" as const, label: "High" },
  };
  return <Badge tone={map[level].tone}>{map[level].label}</Badge>;
}
