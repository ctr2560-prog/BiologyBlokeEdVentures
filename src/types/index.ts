/*
 * BioBloke Edventures data model.
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

export interface Unit {
  id: string;
  title: string;
  stage: Stage;
  yearGroups: string[];
  description: string;
  durationLessons: number;
  outcomes: string[];
  topicIds: string[];
  coverImage: string;
  coverEmoji: string;
  published: boolean;
  program?: string;
  assessmentTask?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  unitId?: string;
  title: string;
  description: string;
  animalFocus: string[];
  ecosystemFocus: string[];
  difficulty: Difficulty;
  videoIds: string[];
  quizIds: string[];
  resourceIds: string[];
}

export type Difficulty = "foundation" | "core" | "advanced";

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
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  linkedConcept: string;
}

export interface Quiz {
  id: string;
  title: string;
  topicId: string;
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

export type LessonItemType = "video" | "quiz";

export interface LessonItem {
  id: string;
  lessonId: string;
  itemType: LessonItemType;
  itemId: string;
  orderIndex: number;
}

export type LessonItemWithContent =
  | (LessonItem & { itemType: "video"; video: Video })
  | (LessonItem & { itemType: "quiz"; quiz: Quiz });

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

export type ActivityBlock = QABlock | WritingBlock | ResearchBlock | DrawingBlock;
export type ActivityBlockType = ActivityBlock["type"];

export interface Activity {
  id: string;
  lessonId: string;
  title: string;
  difficulty: Difficulty;
  blocks: ActivityBlock[];
  createdAt: string;
}

// ---- Student activity responses (auto-saved, teacher-observable) ----

export type BlockResponse =
  | { blockId: string; type: "q_and_a"; answer: string }
  | { blockId: string; type: "writing"; text: string }
  | { blockId: string; type: "research"; fieldValues: Record<string, string> }
  | { blockId: string; type: "drawing_canvas"; dataUrl: string };

export interface StudentActivityResponse {
  id: string;
  activityId: string;
  studentId: string;
  classId: string;
  responses: BlockResponse[];
  submittedAt?: string;
  lastEditedAt: string;
}
