/*
 * Analytics layer, derives insight metrics from progress + content data.
 * All computation is pure and works off the dataService, so it can later run
 * against Firestore aggregation queries or a BigQuery export unchanged.
 */
import {
  getProgress,
  getProgressByClass,
  getProgressByStudent,
  getVideos,
  getVideo,
  getTopics,
  getTopic,
  getUnits,
  getUnit,
  getStudents,
  getSchools,
  getResources,
  getTeachers,
  getClasses,
} from "./dataService";
import type { StudentProgress } from "@/types";

const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

export const formatWatchTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

function quizScores(rows: StudentProgress[]): number[] {
  return rows
    .map((p) => p.quizScore)
    .filter((s): s is number => s !== null);
}

// ---- Admin / platform-wide ----
export function getAdminAnalytics() {
  const progress = getProgress();
  const videos = getVideos();
  const schools = getSchools();
  const students = getStudents();
  const teachers = getTeachers();
  const resources = getResources();

  const totalWatchTime = progress.reduce((a, p) => a + p.watchTimeSeconds, 0);
  const completions = progress.filter((p) => p.videoCompletionPercentage >= 90).length;
  const avgCompletion = avg(progress.map((p) => p.videoCompletionPercentage));
  const avgQuiz = avg(quizScores(progress));

  // Most popular topic by number of progress records.
  const topicCounts = new Map<string, number>();
  progress.forEach((p) => topicCounts.set(p.topicId, (topicCounts.get(p.topicId) ?? 0) + 1));
  const popularTopicId = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const popularTopic = popularTopicId ? getTopic(popularTopicId)?.title ?? "-" : "-";

  return {
    totalSchools: schools.length,
    activeSchools: schools.filter((s) => s.active).length,
    activeTeachers: teachers.length,
    activeStudents: students.length,
    totalVideos: videos.length,
    totalUnits: getUnits().length,
    totalResources: resources.length,
    avgWatchTimeSeconds: avg(progress.map((p) => p.watchTimeSeconds)),
    avgQuizScore: avgQuiz,
    avgCompletion,
    totalCompletions: completions,
    totalWatchTimeSeconds: totalWatchTime,
    popularTopic,
  };
}

// Watch time aggregated per unit (for the admin bar chart).
export function watchTimeByUnit() {
  const units = getUnits();
  const progress = getProgress();
  return units.map((u) => ({
    label: u.title,
    value: progress
      .filter((p) => p.unitId === u.id)
      .reduce((a, p) => a + p.watchTimeSeconds, 0),
  }));
}

// Engagement (avg completion) by year group.
export function engagementByYearGroup() {
  const progress = getProgress();
  const students = getStudents();
  const classes = getClasses();
  const buckets = new Map<string, number[]>();
  progress.forEach((p) => {
    const cls = classes.find((c) => c.id === p.classId);
    const yg = cls?.yearGroup ?? "Unknown";
    if (!buckets.has(yg)) buckets.set(yg, []);
    buckets.get(yg)!.push(p.videoCompletionPercentage);
  });
  void students;
  return [...buckets.entries()]
    .map(([label, vals]) => ({ label, value: avg(vals) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Quiz results by topic.
export function quizResultsByTopic() {
  const topics = getTopics();
  const progress = getProgress();
  return topics
    .map((t) => {
      const rows = progress.filter((p) => p.topicId === t.id);
      const scores = quizScores(rows);
      return { label: t.title, value: avg(scores), count: scores.length };
    })
    .filter((r) => r.count > 0);
}

// Video completion rate leaderboard.
export function videoCompletionRates() {
  return getVideos().map((v) => {
    const rows = getProgress().filter((p) => p.videoId === v.id);
    return {
      video: v,
      views: rows.length,
      avgCompletion: avg(rows.map((p) => p.videoCompletionPercentage)),
      avgWatchTime: avg(rows.map((p) => p.watchTimeSeconds)),
      replays: rows.reduce((a, p) => a + p.replayCount, 0),
      avgQuiz: avg(quizScores(rows)),
    };
  });
}

// Per-video analytics detail.
export function getVideoAnalytics(videoId: string) {
  const video = getVideo(videoId);
  const rows = getProgress().filter((p) => p.videoId === videoId);
  const avgCompletion = avg(rows.map((p) => p.videoCompletionPercentage));
  const dropOff = 100 - avgCompletion;
  return {
    video,
    views: rows.length,
    avgWatchTime: avg(rows.map((p) => p.watchTimeSeconds)),
    avgCompletion,
    replayCount: rows.reduce((a, p) => a + p.replayCount, 0),
    dropOff,
    avgQuiz: avg(quizScores(rows)),
    improvementNote:
      dropOff > 40
        ? "High drop-off, consider a shorter intro or a stronger hook in the first 10 seconds."
        : avgCompletion > 85
        ? "Strong retention, a great candidate to feature."
        : "Solid performance, monitor quiz scores for comprehension gaps.",
  };
}

// Resource download leaderboard.
export function resourceDownloads() {
  return [...getResources()]
    .sort((a, b) => b.downloads - a.downloads)
    .map((r) => ({ label: r.title, value: r.downloads, type: r.type }));
}

// Active users over time (mocked trend for the line chart).
export function activeUsersOverTime() {
  return [
    { label: "Feb", value: 42 },
    { label: "Mar", value: 78 },
    { label: "Apr", value: 96 },
    { label: "May", value: 120 },
    { label: "Jun", value: 141 },
    { label: "Jul", value: 168 },
  ];
}

export function schoolUsageComparison() {
  const progress = getProgress();
  return getSchools().map((s) => {
    const rows = progress.filter((p) => {
      const student = getStudents().find((st) => st.id === p.studentId);
      return student?.schoolId === s.id;
    });
    return {
      label: s.name,
      value: rows.reduce((a, p) => a + p.watchTimeSeconds, 0),
      students: s.studentIds.length,
    };
  });
}

// ---- Teacher / class-level ----
export function getClassAnalytics(classId: string) {
  const rows = getProgressByClass(classId);
  const avgCompletion = avg(rows.map((p) => p.videoCompletionPercentage));
  const avgQuiz = avg(quizScores(rows));
  const needSupport = rows.filter((p) => p.recommendedTaskType === "support");
  const readyExtension = rows.filter((p) => p.recommendedTaskType === "extension");

  // Topic gaps: topics where avg quiz < 60.
  const topicMap = new Map<string, number[]>();
  rows.forEach((p) => {
    if (p.quizScore === null) return;
    if (!topicMap.has(p.topicId)) topicMap.set(p.topicId, []);
    topicMap.get(p.topicId)!.push(p.quizScore);
  });
  const topicPerformance = [...topicMap.entries()].map(([topicId, scores]) => ({
    topic: getTopic(topicId)?.title ?? topicId,
    avg: avg(scores),
  }));
  const gaps = topicPerformance.filter((t) => t.avg < 60);
  const strengths = topicPerformance.filter((t) => t.avg >= 75);

  return {
    avgCompletion,
    avgQuiz,
    avgWatchTime: avg(rows.map((p) => p.watchTimeSeconds)),
    studentsNeedingSupport: [...new Set(needSupport.map((p) => p.studentId))].length,
    studentsReadyExtension: [...new Set(readyExtension.map((p) => p.studentId))].length,
    topicPerformance,
    gaps,
    strengths,
    activeStudents: [...new Set(rows.map((p) => p.studentId))].length,
  };
}

// ---- Student-level ----
export function getStudentAnalytics(studentId: string) {
  const rows = getProgressByStudent(studentId);
  const scores = quizScores(rows);
  const strengths = rows
    .filter((p) => (p.quizScore ?? 0) >= 75)
    .map((p) => getTopic(p.topicId)?.title ?? p.topicId);
  const gaps = rows
    .filter((p) => p.quizScore !== null && p.quizScore < 60)
    .map((p) => getTopic(p.topicId)?.title ?? p.topicId);

  return {
    videosWatched: rows.length,
    totalWatchTime: rows.reduce((a, p) => a + p.watchTimeSeconds, 0),
    avgQuiz: avg(scores),
    worksheetsCompleted: rows.filter((p) => p.worksheetCompleted).length,
    avgCompletion: avg(rows.map((p) => p.videoCompletionPercentage)),
    strengths: [...new Set(strengths)],
    gaps: [...new Set(gaps)],
    rows,
  };
}

export { getUnit };
