export interface ManagedVideo {
  id: string
  stage_id: string
  topic_id: string
  title: string
  description: string
  video_url: string
  thumbnail_emoji: string
  duration_seconds: number
  sequence_index: number
  curiosity_prompt: string
  curiosity_prompt_at_seconds: number
  check_in_question: string
  check_in_options: string[]
  correct_option: string
  check_in_at_seconds: number
  support_threshold_pct: number
  explore_threshold_pct: number
  adaptive_focus: string
  support_resource_url: string | null
  explore_resource_url: string | null
  is_published: boolean
}

export const VIDEO_SEED: ManagedVideo[] = [
  {
    id: 'seed-v1',
    stage_id: 'stage-3',
    topic_id: 'adaptations',
    title: 'Into the Jungle',
    description: 'Students enter the Sumatran rainforest and identify why survival there depends on noticing tiny clues.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_emoji: '🌿',
    duration_seconds: 165,
    sequence_index: 1,
    curiosity_prompt: 'Why do you think some animals are so hard to spot in the jungle?',
    curiosity_prompt_at_seconds: 90,
    check_in_question: 'What is camouflage?',
    check_in_options: [
      'A way to hide by blending in',
      'A type of animal movement',
      'A sound animals make',
      'A kind of food',
    ],
    correct_option: 'A way to hide by blending in',
    check_in_at_seconds: 135,
    support_threshold_pct: 40,
    explore_threshold_pct: 80,
    adaptive_focus: 'Camouflage and rainforest observation',
    support_resource_url: null,
    explore_resource_url: null,
    is_published: true,
  },
  {
    id: 'seed-v2',
    stage_id: 'stage-3',
    topic_id: 'adaptations',
    title: 'Masters of Camouflage',
    description: 'A tighter look at predator-prey strategy and how concealment works from both sides.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_emoji: '🦎',
    duration_seconds: 192,
    sequence_index: 2,
    curiosity_prompt: 'If you were an animal, what habitat would your camouflage suit best?',
    curiosity_prompt_at_seconds: 95,
    check_in_question: 'Which animal uses camouflage as a predator?',
    check_in_options: ['Leopard', 'Leaf insect', 'Stick bug', 'Flatfish'],
    correct_option: 'Leopard',
    check_in_at_seconds: 150,
    support_threshold_pct: 45,
    explore_threshold_pct: 82,
    adaptive_focus: 'Predator strategy and concealment',
    support_resource_url: null,
    explore_resource_url: null,
    is_published: true,
  },
  {
    id: 'seed-v3',
    stage_id: 'stage-3',
    topic_id: 'adaptations',
    title: 'Built to Survive',
    description: 'The final reel connects structure, behavior, and habitat into one survival story.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_emoji: '🐆',
    duration_seconds: 178,
    sequence_index: 3,
    curiosity_prompt: 'What physical adaptation would you want if you had to survive in the rainforest?',
    curiosity_prompt_at_seconds: 100,
    check_in_question: 'A structural adaptation is:',
    check_in_options: [
      'A body part that helps survival',
      'A behavior learned from parents',
      'A change in environment',
      'A type of migration',
    ],
    correct_option: 'A body part that helps survival',
    check_in_at_seconds: 145,
    support_threshold_pct: 50,
    explore_threshold_pct: 85,
    adaptive_focus: 'Structural adaptation and survival',
    support_resource_url: null,
    explore_resource_url: null,
    is_published: true,
  },
]

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export function getSeedVideosForTopic(stageId: string, topicId: string) {
  return VIDEO_SEED
    .filter((video) => video.stage_id === stageId && video.topic_id === topicId)
    .sort((a, b) => a.sequence_index - b.sequence_index)
}

export function getSeedVideoById(videoId: string) {
  return VIDEO_SEED.find((video) => video.id === videoId) ?? VIDEO_SEED[0]
}

export function getPlayableVideoUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl)

    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : videoUrl
    }

    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : videoUrl
    }

    return videoUrl
  } catch {
    return videoUrl
  }
}
