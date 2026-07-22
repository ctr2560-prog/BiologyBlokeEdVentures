/*
 * Edventra data model.
 *
 * Structured to map 1:1 onto Firestore collections later:
 * users, schools, classes, units, topics, videos, resources, quizzes,
 * studentProgress, adaptiveTasks, analyticsEvents.
 *
 * Privacy note: student records deliberately hold minimal personal data -
 * a display name and school/class linkage only. Analytics focus on learning
 * engagement, never surveillance.
 */

export type Role = "admin" | "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolId?: string;
  classIds: string[];
  avatarUrl?: string;
  createdAt: string;
  /** For students: their animal alias id (no real name/PII is stored). */
  animalId?: string;
  /** For students: 4-digit sign-in PIN, printed on their explorer card. */
  pin?: string;
}

export interface School {
  id: string;
  name: string;
  location: string;
  active: boolean;
  teacherIds: string[];
  studentIds: string[];
  subscriptionStatus: "trial" | "active" | "lapsed";
  lastActive: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  yearGroup: string;
  teacherId: string;
  schoolId: string;
  studentIds: string[];
  assignedUnitIds: string[];
  classCode: string;
  /** When true, student devices play videos muted (captions only) — for
   *  noise-sensitive rooms without headphones. */
  silentMode: boolean;
  headphoneMode: boolean;
}

export type DeliveryMode = "student-led" | "teacher-led";

export interface Assignment {
  id: string;
  classId: string;
  unitId: string;
  topicIds: string[];
  dueDate: string;
  adaptiveTasksEnabled: boolean;
  explorerPointsEnabled: boolean;
  deliveryMode: DeliveryMode;
  assignedAt: string;
}

export type Stage = "Stage 3" | "Stage 4" | "Stage 5";

/** Curriculum learning area. Edventra launched in Science; the model is
 *  subject-agnostic so units/lessons can expand across the curriculum. */
export type Subject =
  | "Science"
  | "English"
  | "Mathematics"
  | "HSIE"
  | "Geography"
  | "History"
  | "PDHPE"
  | "Creative Arts"
  | "Technology";

export const SUBJECTS: Subject[] = [
  "Science",
  "English",
  "Mathematics",
  "HSIE",
  "Geography",
  "History",
  "PDHPE",
  "Creative Arts",
  "Technology",
];

export interface Unit {
  id: string;
  title: string;
  subject: Subject;
  stage: Stage;
  yearGroups: string[];
  description: string;
  durationLessons: number;
  outcomes: string[];
  topicIds: string[];
  coverImage: string;
  coverEmoji: string;
  published: boolean;
  featured: boolean;
  program?: string;
  assessmentTask?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  unitId?: string;
  title: string;
  description: string;
  subject: Subject;
  stage: Stage;
  animalFocus: string[];
  ecosystemFocus: string[];
  difficulty: Difficulty;
  featured: boolean;
  /** Canva / Google Slides link shown as the first step of the lesson. */
  slidesUrl: string;
  /** Cover image URL shown on teacher library/dashboard cards. */
  coverImage: string;
  videoIds: string[];
  quizIds: string[];
  resourceIds: string[];
}

export type Difficulty = "foundation" | "core" | "advanced";

/** "vertical" (9:16, fills a full-screen reel edge-to-edge) or "horizontal" (16:9, letterboxed). */
export type VideoAspectRatio = "vertical" | "horizontal";

export interface Video {
  id: string;
  title: string;
  description: string;
  topicId: string;
  unitId: string;
  videoUrl: string;
  thumbnailUrl: string;
  thumbEmoji: string;
  durationSeconds: number;
  muxUploadId?: string;
  muxAssetId?: string;
  muxPlaybackId?: string;
  aspectRatio: VideoAspectRatio;
  tags: string[];
  stage: Stage;
  yearGroups: string[];
  transcript: string;
  learningIntent: string;
  successCriteria: string[];
  published: boolean;
}

export type ResourceType =
  | "worksheet"
  | "powerpoint"
  | "teacherGuide"
  | "assessment"
  | "activity"
  | "extension"
  | "support";

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  fileUrl: string;
  topicId: string;
  unitId: string;
  stage: Stage;
  difficulty: Difficulty;
  tags: string[];
  teacherNotes?: string;
  published: boolean;
  downloads: number;
}

export type QuestionType = "multipleChoice" | "shortResponse" | "trueFalse";

export interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  options: string[];
  /** Undefined in student-facing quiz fetches — grading is server-side only. */
  correctAnswer?: string;
  explanation: string;
  difficulty: Difficulty;
  linkedConcept: string;
}

export interface Quiz {
  id: string;
  title: string;
  topicId: string;
  /** Topic tags this quiz assesses — feed strengths/gaps analytics. */
  tags: string[];
  questions: Question[];
}

export type EngagementLevel = "low" | "medium" | "high";
export type TaskType = "support" | "core" | "extension" | "challenge";

export interface StudentProgress {
  id: string;
  studentId: string;
  classId: string;
  unitId: string;
  topicId: string;
  videoId: string;
  watchTimeSeconds: number;
  videoCompletionPercentage: number;
  replayCount: number;
  skipped: boolean;
  clickedCurious: boolean;
  clickedHelp: boolean;
  quizScore: number | null;
  quizAttempts: number;
  worksheetCompleted: boolean;
  adaptiveFocusArea: string;
  engagementLevel: EngagementLevel;
  recommendedTaskId?: string;
  recommendedTaskType?: TaskType;
  videoReaction?: "like" | "dislike";
  lastActive: string;
}

export interface AdaptiveTask {
  id: string;
  title: string;
  type: TaskType;
  topicId: string;
  description: string;
  instructions: string;
  linkedResourceId?: string;
  triggerCondition: string;
  estimatedTimeMinutes: number;
}

export interface AnalyticsEvent {
  id: string;
  userId: string;
  role: Role;
  eventType: string;
  videoId?: string;
  topicId?: string;
  unitId?: string;
  classId?: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  pointsRequired: number;
}

export interface AdaptiveRecommendation {
  engagementLevel: EngagementLevel;
  comprehensionLevel: "emerging" | "developing" | "secure" | "extending";
  adaptiveFocusArea: string;
  recommendedTaskType: TaskType;
  recommendedTaskMessage: string;
  exploreSuggestion?: string;
  supportSuggestion?: string;
}

// ---- Lesson content sequencing ----

export type LessonItemType = "video" | "quiz" | "activity";

export interface LessonItem {
  id: string;
  lessonId: string;
  itemType: LessonItemType;
  itemId: string;
  orderIndex: number;
}

/*
 * An "activity" item is an adaptive slot, not a fixed piece of content: the
 * activity actually served is chosen per student at play time from the
 * lesson's linked activity pool (quiz scores → difficulty, watch signals ×
 * video tags → interest).
 */
export type LessonItemWithContent =
  | (LessonItem & { itemType: "video"; video: Video })
  | (LessonItem & { itemType: "quiz"; quiz: Quiz })
  | (LessonItem & { itemType: "activity" });

// ---- Adaptive activities (post-lesson, differentiated) ----

export interface QABlock {
  id: string;
  type: "q_and_a";
  question: string;
  hint?: string;
}

export interface WritingBlock {
  id: string;
  type: "writing";
  prompt: string;
  wordGuide?: number;
}

export interface ResearchBlock {
  id: string;
  type: "research";
  prompt: string;
  fields: string[];
}

export interface DrawingBlock {
  id: string;
  type: "drawing_canvas";
  prompt: string;
  backgroundImageUrl?: string;
}

export interface GraphBlock {
  id: string;
  type: "graph";
  prompt: string;
  chartType: "bar" | "line" | "scatter";
  xLabel: string;
  yLabel: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  caption?: string;
}

export interface InstructionBlock {
  id: string;
  type: "instruction";
  content: string;
}

export interface MultipleChoiceBlock {
  id: string;
  type: "multiple_choice";
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  allowMultiple?: boolean;
}

export interface FillBlanksBlock {
  id: string;
  type: "fill_blanks";
  instructions: string;
  text: string; // Use [blank] to mark gaps
}

export interface LabelDiagramBlock {
  id: string;
  type: "label_diagram";
  prompt: string;
  imageUrl: string;
  labels: string[]; // Correct answers — shown to teacher, hidden from student
}

export interface MatchingBlock {
  id: string;
  type: "matching";
  prompt: string;
  pairs: { left: string; right: string }[];
}

export interface TableBlock {
  id: string;
  type: "table";
  prompt: string;
  headers: string[];
  rows: number;
  prefilled?: string[][];
}

export interface WordBankBlock {
  id: string;
  type: "word_bank";
  instructions: string;
  text: string; // Use [blank] to mark gaps
  words: string[]; // All words including distractors
}

export interface SortingBlock {
  id: string;
  type: "sorting";
  prompt: string;
  categories: string[];
  items: string[];
}

export interface StemChallengeBlock {
  id: string;
  type: "stem_challenge";
  title: string;
  challenge: string;        // What students must do
  materials?: string[];     // Optional list of materials needed
  photoPrompt: string;      // What to photograph ("Take a photo of your completed…")
  textPrompt: string;       // Written reflection prompt
}

export interface FieldJournalBlock {
  id: string;
  type: "field_journal";
  context?: string;         // Optional scene-setting (location, topic)
  prompts: {
    observations: string;
    noticed: string;
    wondering: string;
  };
  includeSketch: boolean;
  includeWeather: boolean;
}

export interface StoryboardBlock {
  id: string;
  type: "storyboard";
  prompt: string;
  frameCount: number;       // 2–6 frames
  frameLabels: string[];    // Labels for each frame (e.g. "Introduction", "Rising action")
}

export interface ConceptMapBlock {
  id: string;
  type: "concept_map";
  prompt: string;
  starterNodes: string[];   // Pre-seeded concepts admin adds to get students started
}

export type ActivityBlock =
  | QABlock
  | WritingBlock
  | ResearchBlock
  | DrawingBlock
  | GraphBlock
  | ImageBlock
  | InstructionBlock
  | MultipleChoiceBlock
  | FillBlanksBlock
  | LabelDiagramBlock
  | MatchingBlock
  | TableBlock
  | WordBankBlock
  | SortingBlock
  | StemChallengeBlock
  | FieldJournalBlock
  | StoryboardBlock
  | ConceptMapBlock;

export type ActivityBlockType = ActivityBlock["type"];

/** A block enriched with adaptive targeting metadata. */
export type TaggedActivityBlock = ActivityBlock & {
  /** Which difficulty tier this block targets. Undefined = shown to all tiers. */
  blockDifficulty?: Difficulty;
  /** Topic interest tags this block targets. Empty/undefined = shown to all interests. */
  topicTags?: string[];
  /** @deprecated Legacy single tag — superseded by topicTags. Read via getBlockTags(). */
  topicTag?: string;
};

/** Explore-section ecosystem tile (managed by admin, shown to students). */
export interface Ecosystem {
  id: string;
  name: string;
  blurb: string;
  color: string;
  /** Lucide icon key (see ECO_ICON_CHOICES); falls back to the legacy id map. */
  icon: string;
  /** Video tags that belong to this world — used to match reels. */
  tags: string[];
  featured: boolean;
  published: boolean;
  sortOrder: number;
}

/** Professional learning session posted by admin, browsed/booked by teachers. */
export type PLMode = "in-person" | "online" | "hybrid";

export interface PLSession {
  id: string;
  title: string;
  description: string;
  /** ISO date (yyyy-mm-dd) or empty when not yet scheduled. */
  sessionDate: string;
  /** Free-text time, e.g. "4:00–5:30pm AEST". */
  timeLabel: string;
  /** Free-text cost, e.g. "Free" or "$45 per teacher". */
  cost: string;
  mode: PLMode;
  location: string;
  linkUrl: string;
  imageUrl: string;
  published: boolean;
}

/** A teacher's booking for a PL session (name/email recorded for the organiser). */
export interface PLBooking {
  id: string;
  sessionId: string;
  teacherId: string;
  name: string;
  email: string;
  bookedAt: string;
}

/** Editable promo banner shown on a portal dashboard (managed by admin). */
export interface SiteBanner {
  id: string;
  /** Which portal surface this banner belongs to (e.g. "teacher"). */
  placement: string;
  eyebrow: string;
  title: string;
  message: string;
  imageUrl: string;
  /** Focal point of the background image, as CSS object-position percentages. */
  imagePosX: number;
  imagePosY: number;
  linkUrl: string;
  linkLabel: string;
  active: boolean;
  sortOrder: number;
}

export interface Activity {
  id: string;
  lessonId?: string;
  setId?: string;
  /** Topic interest tags defined for this activity (e.g. ["adaptations", "relationships"]) */
  topicTags?: string[];
  title: string;
  difficulty: Difficulty;
  blocks: TaggedActivityBlock[];
  /** Key concepts a teacher expects to see in a strong answer, set by admin at creation time. Used to draft heuristic feedback. */
  feedbackKeywords?: string[];
  createdAt: string;
}

// ---- Student activity responses (auto-saved, teacher-observable) ----

export type BlockResponse =
  | { blockId: string; type: "q_and_a"; answer: string }
  | { blockId: string; type: "writing"; text: string }
  | { blockId: string; type: "research"; fieldValues: Record<string, string> }
  | { blockId: string; type: "drawing_canvas"; dataUrl: string }
  | { blockId: string; type: "graph"; dataUrl: string; dataPoints: { x: string; y: number }[] }
  | { blockId: string; type: "image" }
  | { blockId: string; type: "instruction" }
  | { blockId: string; type: "multiple_choice"; selectedIndex: number | number[] }
  | { blockId: string; type: "fill_blanks"; answers: string[] }
  | { blockId: string; type: "label_diagram"; labels: string[] }
  | { blockId: string; type: "matching"; matches: number[] }
  | { blockId: string; type: "table"; cells: string[][] }
  | { blockId: string; type: "word_bank"; answers: string[] }
  | { blockId: string; type: "sorting"; sorted: Record<string, string[]> }
  | { blockId: string; type: "stem_challenge"; photoUrl: string; text: string }
  | { blockId: string; type: "field_journal"; location: string; weather: string; observations: string; noticed: string; wondering: string; sketchDataUrl?: string }
  | { blockId: string; type: "storyboard"; frames: { scene: string; onScreen: string; narration: string }[] }
  | { blockId: string; type: "concept_map"; nodes: { id: string; label: string }[]; edges: { from: string; to: string; label: string }[] };

export interface StudentActivityResponse {
  id: string;
  activityId: string;
  studentId: string;
  classId: string;
  responses: BlockResponse[];
  submittedAt?: string;
  lastEditedAt: string;
  teacherFeedback?: string;
  feedbackGivenAt?: string;
  feedbackSeenAt?: string;
}
