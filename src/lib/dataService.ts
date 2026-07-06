/*
 * Data service layer, the ONLY module the UI talks to for data.
 *
 * Today it reads from in-memory mock arrays (imported from /src/data). Every
 * function is written so it can be swapped for a Firestore call with the same
 * signature. For example:
 *
 *   export async function getUnits() {
 *     const snap = await getDocs(collection(db, "units"));
 *     return snap.docs.map(d => d.data() as Unit);
 *   }
 *
 * Keeping this boundary means components never import raw data directly and the
 * migration to Firebase touches one file, not the whole app.
 *
 * Mutations write to module-level arrays so newly created content/classes/
 * assignments persist for the current browser session (see store.tsx for the
 * React state mirror that triggers re-renders).
 */
import {
  units as seedUnits,
  topics as seedTopics,
  videos as seedVideos,
  resources as seedResources,
  quizzes as seedQuizzes,
  adaptiveTasks,
  badges,
} from "@/data/content";
import {
  schools as seedSchools,
  users as seedUsers,
  classes as seedClasses,
  assignments as seedAssignments,
} from "@/data/people";
import { studentProgress as seedProgress } from "@/data/progress";
import type {
  Unit,
  Topic,
  Video,
  Resource,
  Quiz,
  ClassGroup,
  User,
  Assignment,
  StudentProgress,
  School,
} from "@/types";

// Mutable working copies (clone so we never mutate the seed source of truth).
export const db = {
  units: [...seedUnits] as Unit[],
  topics: [...seedTopics] as Topic[],
  videos: [...seedVideos] as Video[],
  resources: [...seedResources] as Resource[],
  quizzes: [...seedQuizzes] as Quiz[],
  schools: [...seedSchools] as School[],
  users: [...seedUsers] as User[],
  classes: [...seedClasses] as ClassGroup[],
  assignments: [...seedAssignments] as Assignment[],
  progress: [...seedProgress] as StudentProgress[],
};

let idCounter = 1000;
export const newId = (prefix: string) => `${prefix}-${idCounter++}`;

// ---- Reads ----
export const getUnits = () => db.units;
export const getPublishedUnits = () => db.units.filter((u) => u.published);
export const getUnit = (id: string) => db.units.find((u) => u.id === id);
export const getTopics = () => db.topics;
export const getTopic = (id: string) => db.topics.find((t) => t.id === id);
export const getTopicsByUnit = (unitId: string) =>
  db.topics.filter((t) => t.unitId === unitId);
export const getVideos = () => db.videos;
export const getVideo = (id: string) => db.videos.find((v) => v.id === id);
export const getVideosByTopic = (topicId: string) =>
  db.videos.filter((v) => v.topicId === topicId);
export const getResources = () => db.resources;
export const getResource = (id: string) => db.resources.find((r) => r.id === id);
export const getQuizzes = () => db.quizzes;
export const getQuiz = (id: string) => db.quizzes.find((q) => q.id === id);
export const getQuizByTopic = (topicId: string) =>
  db.quizzes.find((q) => q.topicId === topicId);
export const getAdaptiveTasks = () => adaptiveTasks;
export const getBadges = () => badges;

export const getSchools = () => db.schools;
export const getSchool = (id: string) => db.schools.find((s) => s.id === id);
export const getUsers = () => db.users;
export const getUser = (id: string) => db.users.find((u) => u.id === id);
export const getTeachers = () => db.users.filter((u) => u.role === "teacher");
export const getStudents = () => db.users.filter((u) => u.role === "student");

export const getClasses = () => db.classes;
export const getClass = (id: string) => db.classes.find((c) => c.id === id);
export const getClassesByTeacher = (teacherId: string) =>
  db.classes.filter((c) => c.teacherId === teacherId);
export const getStudentsByClass = (classId: string) => {
  const cls = getClass(classId);
  if (!cls) return [];
  return cls.studentIds
    .map((id) => getUser(id))
    .filter((u): u is User => Boolean(u));
};

export const getAssignments = () => db.assignments;
export const getAssignmentsByClass = (classId: string) =>
  db.assignments.filter((a) => a.classId === classId);

export const getProgress = () => db.progress;
export const getProgressByClass = (classId: string) =>
  db.progress.filter((p) => p.classId === classId);
export const getProgressByStudent = (studentId: string) =>
  db.progress.filter((p) => p.studentId === studentId);
export const getProgressForVideo = (videoId: string) =>
  db.progress.filter((p) => p.videoId === videoId);

// ---- Mutations ----
export function createVideo(video: Omit<Video, "id">): Video {
  const created: Video = { ...video, id: newId("vid") };
  db.videos.unshift(created);
  const topic = getTopic(created.topicId);
  if (topic) topic.videoIds.push(created.id);
  return created;
}

export function createResource(resource: Omit<Resource, "id" | "downloads">): Resource {
  const created: Resource = { ...resource, id: newId("res"), downloads: 0 };
  db.resources.unshift(created);
  const topic = getTopic(created.topicId);
  if (topic) topic.resourceIds.push(created.id);
  return created;
}

export function createUnit(unit: Omit<Unit, "id" | "createdAt">): Unit {
  const created: Unit = {
    ...unit,
    id: newId("unit"),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  db.units.unshift(created);
  return created;
}

export function createQuiz(quiz: Omit<Quiz, "id">): Quiz {
  const created: Quiz = { ...quiz, id: newId("quiz") };
  db.quizzes.unshift(created);
  const topic = getTopic(created.topicId);
  if (topic) topic.quizIds.push(created.id);
  return created;
}

export function createClass(
  input: Omit<ClassGroup, "id" | "classCode" | "studentIds" | "assignedUnitIds">
): ClassGroup {
  const created: ClassGroup = {
    ...input,
    id: newId("class"),
    classCode: generateClassCode(input.name),
    studentIds: [],
    assignedUnitIds: [],
  };
  db.classes.push(created);
  const teacher = getUser(input.teacherId);
  if (teacher) teacher.classIds.push(created.id);
  return created;
}

export function assignLessonToClass(input: Omit<Assignment, "id" | "assignedAt">): Assignment {
  const created: Assignment = {
    ...input,
    id: newId("assign"),
    assignedAt: new Date().toISOString().slice(0, 10),
  };
  db.assignments.push(created);
  const cls = getClass(input.classId);
  if (cls && !cls.assignedUnitIds.includes(input.unitId)) {
    cls.assignedUnitIds.push(input.unitId);
  }
  return created;
}

export function generateClassCode(name: string): string {
  const base = name.replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase() || "CLASS";
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}-${suffix}`;
}

/*
 * FIREBASE / ROLE-BASED ACCESS (future):
 * With Firebase Auth + Firestore Security Rules, these reads would be guarded:
 *  - admin: full read on all collections
 *  - teacher: read only classes where teacherId == request.auth.uid, and the
 *    students/progress linked to those classes
 *  - student: read only their own user doc + studentProgress where
 *    studentId == request.auth.uid
 * The service functions above already scope by teacherId / studentId / classId,
 * so the same filtering maps cleanly onto security rules.
 */
