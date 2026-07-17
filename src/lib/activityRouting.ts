import type { TaggedActivityBlock, ActivityBlock, Difficulty } from "@/types";

/** All topic tags on a block, folding in the legacy single-tag field. */
export function getBlockTags(block: TaggedActivityBlock): string[] {
  const tags = block.topicTags ?? [];
  if (block.topicTag && !tags.includes(block.topicTag)) return [...tags, block.topicTag];
  return tags;
}

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

  // Difficulty is a *preference*, not a hard gate. Prefer blocks at the
  // student's tier (plus tier-agnostic blocks with no blockDifficulty set), but
  // if the activity has none at that tier, fall back to the whole list rather
  // than handing back an empty worksheet — a foundation student must never be
  // left with nothing just because the author only wrote "core" blocks.
  const preferTier = (list: TaggedActivityBlock[]): TaggedActivityBlock[] => {
    const atTier = list.filter(
      (b) => !b.blockDifficulty || b.blockDifficulty === difficulty
    );
    return atTier.length > 0 ? atTier : list;
  };

  // Which blocks to include:
  // - Untagged blocks (instructions, general prompts) are always shown.
  // - If the student has a clear top interest, narrow the tagged tasks to that
  //   topic so the worksheet feels personalised.
  // - If there's no clear interest (e.g. low completion, or their videos don't
  //   share tags with this activity), fall back to a general worksheet across
  //   all topics rather than showing only the instruction with no actual tasks.
  const selected = blocks.filter((block) => {
    const blockTags = getBlockTags(block);
    if (blockTags.length === 0) return true;
    if (!topTag) return true;
    return blockTags.includes(topTag);
  });

  return preferTier(selected);
}
