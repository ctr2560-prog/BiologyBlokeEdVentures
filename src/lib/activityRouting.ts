import type { TaggedActivityBlock, ActivityBlock, Difficulty } from "@/types";

export function getStudentDifficulty(quizScore: number): Difficulty {
  if (quizScore < 50) return "foundation";
  if (quizScore >= 80) return "advanced";
  return "core";
}

/**
 * Returns the tag the student is most interested in, or null if no tag
 * clears the engagement threshold (spammer fallback → show "All topics" blocks only).
 *
 * Rules:
 * 1. Only tags where completion >= completionThreshold (default 60%) qualify.
 * 2. Preference score = watchTime × reaction multiplier (like ×1.3, dislike ×0.7, neutral ×1.0).
 * 3. Top tag wins if its score is ≥ 30% ahead of second place (clear winner).
 * 4. If scores are close (all-rounder), highest score still wins — the small
 *    difference plus reaction weighting is enough signal.
 * 5. Returns null → caller shows only untagged "All topics" blocks.
 */
export function getTopInterest(
  watchTime: Record<string, number>,
  completionPct: Record<string, number>,
  reactions: Record<string, "like" | "dislike" | undefined>,
  tags: string[],
  completionThreshold = 60
): string | null {
  if (!tags.length) return null;

  const qualifying = tags.filter(
    (tag) => (completionPct[tag] ?? 0) >= completionThreshold
  );
  if (!qualifying.length) return null;

  const scored = qualifying
    .map((tag) => {
      const base = watchTime[tag] ?? 0;
      const reaction = reactions[tag];
      const multiplier =
        reaction === "like" ? 1.3 : reaction === "dislike" ? 0.7 : 1.0;
      return { tag, score: base * multiplier };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0].tag;
}

export function filterBlocksForStudent(
  blocks: TaggedActivityBlock[],
  quizScore: number,
  watchTime: Record<string, number>,
  topicTags: string[],
  completionPct: Record<string, number> = {},
  reactions: Record<string, "like" | "dislike" | undefined> = {}
): ActivityBlock[] {
  const difficulty = getStudentDifficulty(quizScore);
  const topTag = getTopInterest(watchTime, completionPct, reactions, topicTags);

  return blocks.filter((block) => {
    if (block.blockDifficulty && block.blockDifficulty !== difficulty) return false;
    // If no qualifying tag (spammer/equal watcher with no reactions), show only untagged blocks
    if (!topTag) return !block.topicTag;
    if (block.topicTag && block.topicTag !== topTag) return false;
    return true;
  });
}
