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

export interface Assignment {
  id: string;
  classId: string;
  unitId: string;
  topicIds: string[];
  dueDate: string;
  adaptiveTasksEnabled: boolean;
  explorerPointsEnabled: boolean;
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
  createdAt: string;
}

export interface Topic {
  id: string;
  unitId: string;
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
