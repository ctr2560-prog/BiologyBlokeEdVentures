/**
 * Biology Bloke Edventures — Adaptive Learning Engine
 *
 * Interprets student watch behaviour and assigns learning pathways.
 * Not just performance — this reads curiosity, engagement, and connection.
 */

export type Pathway = 'explore' | 'grow' | 'support'

export interface WatchSignal {
  watchPct: number          // 0–100
  rewatched: boolean
  checkInCorrect: boolean | null
  curiosityResponseLength: number  // chars typed in curiosity prompt
  dropOffPoint: number | null  // % where student stopped (null = completed)
}

export interface PathwayDecision {
  pathway: Pathway
  reason: string
  confidenceScore: number  // 0–100
}

/**
 * Interprets a single watch event and determines the signal type.
 */
export function interpretSignal(signal: WatchSignal): { type: 'curiosity' | 'engagement' | 'confusion' | 'disengagement'; score: number } {
  const { watchPct, rewatched, checkInCorrect, curiosityResponseLength } = signal

  let score = watchPct

  // Rewatch boosts curiosity signal strongly
  if (rewatched) score += 15

  // Thoughtful curiosity response
  if (curiosityResponseLength > 50) score += 10
  else if (curiosityResponseLength > 20) score += 5

  // Check-in performance
  if (checkInCorrect === true) score += 10
  else if (checkInCorrect === false) score -= 5

  score = Math.max(0, Math.min(100, score))

  if (score >= 85) return { type: 'curiosity', score }
  if (score >= 60) return { type: 'engagement', score }
  if (score >= 35) return { type: 'confusion', score }
  return { type: 'disengagement', score }
}

/**
 * Calculates pathway from multiple watch signals over time.
 * Uses a weighted average with recency bias.
 */
export function calculatePathway(signals: WatchSignal[]): PathwayDecision {
  if (signals.length === 0) {
    return { pathway: 'grow', reason: 'No data yet — starting on the core pathway.', confidenceScore: 0 }
  }

  // Recency-weighted average
  const weights = signals.map((_, i) => Math.pow(1.5, i))  // older = lower weight
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  let weightedScore = 0
  signals.forEach((s, i) => {
    const { score } = interpretSignal(s)
    weightedScore += score * weights[i]
  })
  const avgScore = weightedScore / totalWeight

  // Pathway thresholds
  if (avgScore >= 75) {
    return {
      pathway: 'explore',
      reason: `High curiosity and engagement (${Math.round(avgScore)}%). Ready for deeper challenges and extension Edventures.`,
      confidenceScore: Math.min(100, avgScore),
    }
  }

  if (avgScore >= 45) {
    return {
      pathway: 'grow',
      reason: `Solid engagement (${Math.round(avgScore)}%). On track with the core learning journey.`,
      confidenceScore: Math.min(100, avgScore),
    }
  }

  return {
    pathway: 'support',
    reason: `Lower engagement signals (${Math.round(avgScore)}%). Recommend simplified content and alternative examples to rebuild connection.`,
    confidenceScore: Math.min(100, 100 - avgScore + 20),
  }
}

/**
 * Generates a teacher insight from class-level pathway distribution.
 */
export function generateClassInsights(pathways: Pathway[], topicEngagement: Record<string, number>): string[] {
  const insights: string[] = []
  const total = pathways.length
  if (total === 0) return ['No data yet — insights will appear as students watch content.']

  const supportCount = pathways.filter((p) => p === 'support').length
  const exploreCount = pathways.filter((p) => p === 'explore').length

  if (supportCount > 0) {
    insights.push(`${supportCount} student${supportCount > 1 ? 's' : ''} showed low engagement — recommend the simplified pathway or a check-in conversation.`)
  }

  if (exploreCount >= 3) {
    insights.push(`${exploreCount} students are highly curious — assign an extension Edventure to keep them challenged.`)
  }

  // Find lowest-engagement topic
  const sorted = Object.entries(topicEngagement).sort((a, b) => a[1] - b[1])
  if (sorted.length > 0 && sorted[0][1] < 40) {
    insights.push(`Low engagement with "${sorted[0][0]}" — consider a different entry point or shorter content for this topic.`)
  }

  // Find highest-engagement topic
  if (sorted.length > 0 && sorted[sorted.length - 1][1] >= 70) {
    insights.push(`Strong interest in "${sorted[sorted.length - 1][0]}" — lean into this with a related Edventure.`)
  }

  return insights
}

/**
 * Selects the next recommended video for a student based on their pathway.
 */
export function recommendNextContent(pathway: Pathway, currentTopicId: string): {
  label: string
  recommendation: string
  icon: string
} {
  const recommendations: Record<Pathway, { label: string; recommendation: string; icon: string }> = {
    explore: {
      label: 'Extension Challenge',
      recommendation: 'Explore deeper concepts: real-world applications, open-ended research, or an extension Edventure.',
      icon: '🌿',
    },
    grow: {
      label: 'Next Experience',
      recommendation: 'Continue with the next video in the sequence to build on your understanding.',
      icon: '🌱',
    },
    support: {
      label: 'Let\'s Try Again',
      recommendation: 'A shorter, alternative version of this topic with more visual examples to build connection.',
      icon: '🌾',
    },
  }
  return recommendations[pathway]
}
