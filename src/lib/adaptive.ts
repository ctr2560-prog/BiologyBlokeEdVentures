/*
 * Adaptive learning engine.
 *
 * generateAdaptiveRecommendation() is the heart of BioBloke's personalisation.
 * It takes a student's engagement signals from a video + quiz and returns a
 * recommendation that both teachers and students see. Pure function — no side
 * effects — so it is trivial to unit-test and to run inside a Cloud Function.
 */
import type {
  AdaptiveRecommendation,
  EngagementLevel,
  TaskType,
} from "@/types";

export interface AdaptiveInput {
  watchTimeSeconds: number;
  durationSeconds: number;
  quizScore: number | null; // 0-100, or null if not attempted
  replayCount: number;
  clickedCurious: boolean;
  clickedHelp: boolean;
}

export function completionPercentage(
  watchTimeSeconds: number,
  durationSeconds: number
): number {
  if (durationSeconds <= 0) return 0;
  return Math.min(100, Math.round((watchTimeSeconds / durationSeconds) * 100));
}

export function generateAdaptiveRecommendation(
  input: AdaptiveInput
): AdaptiveRecommendation {
  const completion = completionPercentage(
    input.watchTimeSeconds,
    input.durationSeconds
  );
  const quiz = input.quizScore ?? 0;

  let engagementLevel: EngagementLevel;
  let comprehensionLevel: AdaptiveRecommendation["comprehensionLevel"];
  let adaptiveFocusArea: string;
  let recommendedTaskType: TaskType;
  let recommendedTaskMessage: string;

  // Core tiered logic (spec-defined thresholds).
  if (completion < 50) {
    engagementLevel = "low";
    comprehensionLevel = "emerging";
    adaptiveFocusArea = "Re-engagement";
    recommendedTaskType = "support";
    recommendedTaskMessage =
      "Try a shorter recap and a visual matching task to rebuild momentum.";
  } else if (completion >= 50 && quiz < 50) {
    engagementLevel = "medium";
    comprehensionLevel = "emerging";
    adaptiveFocusArea = "Concept understanding";
    recommendedTaskType = "support";
    recommendedTaskMessage =
      "Review the key concept with scaffolded, step-by-step questions.";
  } else if (completion >= 90 && quiz > 80) {
    engagementLevel = "high";
    comprehensionLevel = "extending";
    adaptiveFocusArea = "Extension";
    recommendedTaskType = "extension";
    recommendedTaskMessage =
      "Apply your learning to a real conservation challenge.";
  } else if (completion >= 80 && quiz >= 50 && quiz <= 80) {
    engagementLevel = "high";
    comprehensionLevel = "secure";
    adaptiveFocusArea = "Core consolidation";
    recommendedTaskType = "core";
    recommendedTaskMessage =
      "Complete the standard worksheet to strengthen your understanding.";
  } else {
    // Watched a good chunk with a solid quiz but not top-tier — consolidate.
    engagementLevel = "medium";
    comprehensionLevel = "developing";
    adaptiveFocusArea = "Core consolidation";
    recommendedTaskType = "core";
    recommendedTaskMessage =
      "Keep going with the core task to lock in what you have learned.";
  }

  const recommendation: AdaptiveRecommendation = {
    engagementLevel,
    comprehensionLevel,
    adaptiveFocusArea,
    recommendedTaskType,
    recommendedTaskMessage,
  };

  // Curiosity and help signals layer on top of the tiered result.
  if (input.clickedCurious) {
    recommendation.exploreSuggestion =
      "You were curious! Explore related wildlife stories to go deeper.";
  }
  if (input.clickedHelp) {
    recommendation.supportSuggestion =
      "You asked for help — we've prioritised a support resource for this topic.";
    // A help request always makes sure support is at least offered.
    if (recommendation.recommendedTaskType === "extension") {
      recommendation.recommendedTaskType = "core";
    }
  }

  return recommendation;
}

export function engagementColor(level: EngagementLevel): string {
  return level === "high"
    ? "#2d6a4f"
    : level === "medium"
    ? "#d4a373"
    : "#a47148";
}

export function taskTypeMeta(type: TaskType): { label: string; emoji: string; color: string } {
  switch (type) {
    case "support":
      return { label: "Support", emoji: "🪴", color: "#a47148" };
    case "core":
      return { label: "Core", emoji: "🌿", color: "#2d6a4f" };
    case "extension":
      return { label: "Extension", emoji: "🚀", color: "#5c8aa8" };
    case "challenge":
      return { label: "Challenge", emoji: "🏔️", color: "#8b5e3c" };
  }
}
