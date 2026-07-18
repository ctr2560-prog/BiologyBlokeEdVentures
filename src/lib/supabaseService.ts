"use client";

/*
 * Async service layer — mirrors dataService.ts with identical signatures but
 * talks to Supabase instead of the in-memory mock.
 *
 * MIGRATION GUIDE (when ready to switch a page):
 *  1. Replace `import { ... } from "@/lib/dataService"` with supabaseService.
 *  2. Make the component async (Server Component) or wrap reads in useEffect/SWR.
 *  3. Replace bump() calls with router.refresh() or real-time subscriptions.
 *
 * This file uses the browser client — for Server Components swap
 * getSupabaseClient() with createSupabaseServerClient() from ./supabase/server.
 */

import { getSupabaseClient } from "./supabase/client";
import { getBlockTags } from "./activityRouting";
import { animals, getAnimal } from "@/data/animals";
import type {
  Unit,
  Topic,
  Video,
  Resource,
  Quiz,
  Question,
  ClassGroup,
  User,
  Assignment,
  StudentProgress,
  School,
  AdaptiveTask,
  AnalyticsEvent,
} from "@/types";

// ---- ID generation ----

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Stable id derived from natural-key parts — same inputs always yield the same
 *  id, so concurrent upserts collapse onto one row instead of racing. */
function deterministicId(prefix: string, ...parts: string[]): string {
  const key = parts.join("|");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return `${prefix}-${(h >>> 0).toString(16).padStart(8, "0")}`;
}

// ---- Row mappers (snake_case DB → camelCase TypeScript) ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function mapUnit(r: Row): Unit {
  return {
    id: r.id,
    title: r.title,
    subject: r.subject ?? "Science",
    stage: r.stage,
    yearGroups: r.year_groups ?? [],
    description: r.description ?? "",
    durationLessons: r.duration_lessons ?? 1,
    outcomes: r.outcomes ?? [],
    topicIds: (r.topics ?? []).map((t: Row) => t.id),
    coverImage: r.cover_image ?? "",
    coverEmoji: "",
    published: Boolean(r.published),
    featured: Boolean(r.featured),
    program: r.program ?? "",
    assessmentTask: r.assessment_task ?? "",
    createdAt: r.created_at ?? "",
  };
}

function mapTopic(r: Row): Topic {
  // Content links to a lesson two ways: the legacy videos.topic_id / quizzes.topic_id
  // columns, and the lesson_items sequence. New uploads use lesson_items only,
  // so the counts must union both sources (deduped) or cards read "0 videos".
  const items = (r.lesson_items ?? []) as Row[];
  const seqOf = (type: string) => items.filter((i) => i.item_type === type).map((i) => i.item_id as string);
  const merge = (a: string[], b: string[]) => [...new Set([...a, ...b])];

  return {
    id: r.id,
    unitId: r.unit_id,
    title: r.title,
    description: r.description ?? "",
    subject: r.subject ?? "Science",
    stage: r.stage ?? "Stage 3",
    animalFocus: r.animal_focus ?? [],
    ecosystemFocus: r.ecosystem_focus ?? [],
    difficulty: r.difficulty,
    featured: Boolean(r.featured),
    slidesUrl: r.slides_url ?? "",
    coverImage: r.cover_image ?? "",
    videoIds: merge((r.videos ?? []).map((v: Row) => v.id as string), seqOf("video")),
    quizIds: merge((r.quizzes ?? []).map((q: Row) => q.id as string), seqOf("quiz")),
    resourceIds: merge((r.resources ?? []).map((res: Row) => res.id as string), seqOf("resource")),
  };
}

export function mapVideo(r: Row): Video {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    topicId: r.topic_id,
    unitId: r.unit_id,
    videoUrl: r.video_url ?? "",
    thumbnailUrl: r.thumbnail_url ?? "",
    thumbEmoji: "",
    durationSeconds: r.duration_seconds ?? 0,
    tags: r.tags ?? [],
    stage: r.stage,
    yearGroups: r.year_groups ?? [],
    transcript: r.transcript ?? "",
    learningIntent: r.learning_intent ?? "",
    successCriteria: r.success_criteria ?? [],
    published: Boolean(r.published),
    muxUploadId: r.mux_upload_id ?? undefined,
    muxAssetId: r.mux_asset_id ?? undefined,
    muxPlaybackId: r.mux_playback_id ?? undefined,
  };
}

function mapResource(r: Row): Resource {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    fileUrl: r.file_url ?? "#",
    topicId: r.topic_id,
    unitId: r.unit_id,
    stage: r.stage,
    difficulty: r.difficulty,
    tags: r.tags ?? [],
    teacherNotes: r.teacher_notes ?? undefined,
    published: Boolean(r.published),
    downloads: r.downloads ?? 0,
  };
}

function mapQuestion(r: Row): Question {
  return {
    id: r.id,
    questionText: r.question_text,
    type: r.type,
    options: r.options ?? [],
    // correct_answer is omitted from student-facing queries — only present for admin/teacher
    ...(r.correct_answer !== undefined && { correctAnswer: r.correct_answer }),
    explanation: r.explanation ?? "",
    difficulty: r.difficulty,
    linkedConcept: r.linked_concept ?? "",
  };
}

function mapQuiz(r: Row): Quiz {
  return {
    id: r.id,
    title: r.title,
    topicId: r.topic_id ?? "",
    tags: r.tags ?? [],
    questions: (r.questions ?? [])
      .sort((a: Row, b: Row) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(mapQuestion),
  };
}

function mapSchool(r: Row): School {
  return {
    id: r.id,
    name: r.name,
    location: r.location ?? "",
    active: Boolean(r.active),
    teacherIds: (r.teachers ?? []).map((t: Row) => t.id),
    studentIds: (r.students ?? []).map((s: Row) => s.id),
    subscriptionStatus: r.subscription_status,
    lastActive: r.last_active ?? "",
  };
}

function mapUser(r: Row, classIds: string[] = []): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? "",
    role: r.role,
    schoolId: r.school_id ?? undefined,
    classIds,
    avatarUrl: r.avatar_url ?? "",
    createdAt: r.created_at ?? "",
    animalId: r.animal_id ?? undefined,
    pin: r.pin ?? undefined,
  };
}

/** 4-digit student sign-in PIN (no leading zero, easy to read off a card). */
function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function mapClass(r: Row): ClassGroup {
  const studentIds = (r.class_students ?? []).map((cs: Row) => cs.student_id);
  const assignedUnitIds = [
    ...new Set<string>((r.assignments ?? []).map((a: Row) => String(a.unit_id))),
  ];
  return {
    id: r.id,
    name: r.name,
    yearGroup: r.year_group,
    teacherId: r.teacher_id,
    schoolId: r.school_id,
    studentIds,
    assignedUnitIds,
    classCode: r.class_code,
    silentMode: Boolean(r.silent_mode),
    headphoneMode: Boolean(r.headphone_mode),
  };
}

function mapAssignment(r: Row): Assignment {
  return {
    id: r.id,
    classId: r.class_id,
    unitId: r.unit_id,
    topicIds: (r.assignment_topics ?? []).map((at: Row) => at.topic_id),
    dueDate: r.due_date ?? "",
    adaptiveTasksEnabled: Boolean(r.adaptive_tasks_enabled),
    explorerPointsEnabled: Boolean(r.explorer_points_enabled),
    deliveryMode: r.delivery_mode ?? "student-led",
    assignedAt: r.assigned_at ?? "",
  };
}

function mapProgress(r: Row): StudentProgress {
  return {
    id: r.id,
    studentId: r.student_id,
    classId: r.class_id,
    unitId: r.unit_id ?? "",
    topicId: r.topic_id ?? "",
    videoId: r.video_id,
    watchTimeSeconds: r.watch_time_seconds ?? 0,
    videoCompletionPercentage: Number(r.video_completion_percentage ?? 0),
    replayCount: r.replay_count ?? 0,
    skipped: Boolean(r.skipped),
    clickedCurious: Boolean(r.clicked_curious),
    clickedHelp: Boolean(r.clicked_help),
    quizScore: r.quiz_score !== null ? Number(r.quiz_score) : null,
    quizAttempts: r.quiz_attempts ?? 0,
    worksheetCompleted: Boolean(r.worksheet_completed),
    adaptiveFocusArea: r.adaptive_focus_area ?? "",
    engagementLevel: r.engagement_level ?? "medium",
    recommendedTaskType: r.recommended_task_type ?? undefined,
    videoReaction: r.video_reaction ?? undefined,
    lastActive: r.last_active ?? "",
  };
}

function mapAdaptiveTask(r: Row): AdaptiveTask {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    topicId: r.topic_id,
    description: r.description ?? "",
    instructions: r.instructions ?? "",
    linkedResourceId: r.linked_resource_id ?? undefined,
    triggerCondition: r.trigger_condition ?? "",
    estimatedTimeMinutes: r.estimated_time_minutes ?? 10,
  };
}

// ---- Units ----

export async function getUnits(): Promise<Unit[]> {
  const { data } = await getSupabaseClient()
    .from("units")
    .select("*, topics(id)")
    .order("created_at");
  return (data ?? []).map(mapUnit);
}

export async function getPublishedUnits(): Promise<Unit[]> {
  const { data } = await getSupabaseClient()
    .from("units")
    .select("*, topics(id)")
    .eq("published", true)
    .order("created_at");
  return (data ?? []).map(mapUnit);
}

export async function getUnit(id: string): Promise<Unit | null> {
  const { data } = await getSupabaseClient()
    .from("units")
    .select("*, topics(id)")
    .eq("id", id)
    .single();
  return data ? mapUnit(data) : null;
}

// ---- Topics ----

export async function getTopics(): Promise<Topic[]> {
  const { data } = await getSupabaseClient()
    .from("topics")
    .select("*, videos(id), quizzes(id), resources(id), lesson_items(item_type, item_id)");
  return (data ?? []).map(mapTopic);
}

export async function getTopic(id: string): Promise<Topic | null> {
  const { data } = await getSupabaseClient()
    .from("topics")
    .select("*, videos(id), quizzes(id), resources(id), lesson_items(item_type, item_id)")
    .eq("id", id)
    .single();
  return data ? mapTopic(data) : null;
}

export async function getTopicsByUnit(unitId: string): Promise<Topic[]> {
  const supabase = getSupabaseClient();
  const { data: links } = await supabase
    .from("unit_lessons")
    .select("lesson_id")
    .eq("unit_id", unitId)
    .order("order_index");
  if (!links || links.length === 0) return [];
  const ids = (links as Row[]).map((l) => l.lesson_id as string);
  const { data } = await supabase
    .from("topics")
    .select("*, videos(id), quizzes(id), resources(id), lesson_items(item_type, item_id)")
    .in("id", ids);
  const topicMap = new Map((data ?? []).map((t: Row) => [t.id as string, mapTopic(t)]));
  return ids.map((id) => topicMap.get(id)).filter((t): t is Topic => !!t);
}

export async function addLessonToUnit(
  unitId: string,
  lessonId: string,
  orderIndex: number
): Promise<void> {
  const id = newId("ul");
  await getSupabaseClient().from("unit_lessons").insert({ id, unit_id: unitId, lesson_id: lessonId, order_index: orderIndex });
}

export async function removeLessonFromUnit(unitId: string, lessonId: string): Promise<void> {
  await getSupabaseClient()
    .from("unit_lessons")
    .delete()
    .eq("unit_id", unitId)
    .eq("lesson_id", lessonId);
}

/** All unit↔lesson links, for building "part of unit X" lookups in one query. */
export async function getUnitLessonLinks(): Promise<Array<{ unitId: string; lessonId: string }>> {
  const { data } = await getSupabaseClient()
    .from("unit_lessons")
    .select("unit_id, lesson_id")
    .order("order_index");
  return (data ?? []).map((r: Row) => ({ unitId: r.unit_id as string, lessonId: r.lesson_id as string }));
}

// ---- Explore ecosystems ----

import type { Ecosystem } from "@/types";

function mapEcosystem(r: Row): Ecosystem {
  return {
    id: r.id,
    name: r.name,
    blurb: r.blurb ?? "",
    color: r.color ?? "#3d7a5e",
    icon: r.icon ?? "",
    tags: r.tags ?? [],
    featured: Boolean(r.featured),
    published: Boolean(r.published),
    sortOrder: r.sort_order ?? 0,
  };
}

/** All ecosystems in display order (callers filter on published as needed). */
export async function getEcosystems(): Promise<Ecosystem[]> {
  const { data } = await getSupabaseClient()
    .from("ecosystems")
    .select("*")
    .order("sort_order");
  return (data ?? []).map(mapEcosystem);
}

export async function upsertEcosystem(eco: Ecosystem): Promise<void> {
  const { error } = await getSupabaseClient().from("ecosystems").upsert({
    id: eco.id,
    name: eco.name,
    blurb: eco.blurb,
    color: eco.color,
    icon: eco.icon,
    tags: eco.tags,
    featured: eco.featured,
    published: eco.published,
    sort_order: eco.sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function deleteEcosystem(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("ecosystems").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Professional learning sessions ----

import type { PLSession } from "@/types";

function mapPLSession(r: Row): PLSession {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    sessionDate: r.session_date ?? "",
    timeLabel: r.time_label ?? "",
    cost: r.cost ?? "",
    mode: r.mode ?? "in-person",
    location: r.location ?? "",
    linkUrl: r.link_url ?? "",
    imageUrl: r.image_url ?? "",
    published: Boolean(r.published),
  };
}

/** All PL sessions, soonest first (callers filter on published/date). */
export async function getPLSessions(): Promise<PLSession[]> {
  const { data } = await getSupabaseClient()
    .from("pl_sessions")
    .select("*")
    .order("session_date", { ascending: true, nullsFirst: false });
  return (data ?? []).map(mapPLSession);
}

export async function upsertPLSession(session: PLSession): Promise<void> {
  const { error } = await getSupabaseClient().from("pl_sessions").upsert({
    id: session.id,
    title: session.title,
    description: session.description,
    session_date: session.sessionDate || null,
    time_label: session.timeLabel,
    cost: session.cost,
    mode: session.mode,
    location: session.location,
    link_url: session.linkUrl,
    image_url: session.imageUrl,
    published: session.published,
  });
  if (error) throw new Error(error.message);
}

export async function deletePLSession(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("pl_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- PL bookings ----

import type { PLBooking } from "@/types";

function mapPLBooking(r: Row): PLBooking {
  return {
    id: r.id,
    sessionId: r.session_id,
    teacherId: r.teacher_id,
    name: r.name ?? "",
    email: r.email ?? "",
    bookedAt: r.booked_at ?? "",
  };
}

export async function bookPLSession(input: {
  sessionId: string;
  teacherId: string;
  name: string;
  email: string;
}): Promise<void> {
  const { error } = await getSupabaseClient().from("pl_bookings").insert({
    id: newId("plb"),
    session_id: input.sessionId,
    teacher_id: input.teacherId,
    name: input.name,
    email: input.email,
  });
  if (error) {
    if (error.code === "23505") throw new Error("You've already booked this session.");
    throw new Error(error.message);
  }
}

export async function cancelPLBooking(sessionId: string, teacherId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("pl_bookings")
    .delete()
    .eq("session_id", sessionId)
    .eq("teacher_id", teacherId);
  if (error) throw new Error(error.message);
}

/** Session ids the teacher has booked (RLS limits rows to their own). */
export async function getMyPLBookings(teacherId: string): Promise<string[]> {
  const { data } = await getSupabaseClient()
    .from("pl_bookings")
    .select("session_id")
    .eq("teacher_id", teacherId);
  return (data ?? []).map((r: Row) => r.session_id as string);
}

/** All bookings across sessions — admin only (RLS enforced). */
export async function getAllPLBookings(): Promise<PLBooking[]> {
  const { data } = await getSupabaseClient()
    .from("pl_bookings")
    .select("*")
    .order("booked_at");
  return (data ?? []).map(mapPLBooking);
}

/** Uploads a PL session image to the public bucket and returns its URL. */
export async function uploadPLImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `pl-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("pl-images").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("pl-images").getPublicUrl(path).data.publicUrl;
}

// ---- Site banners ----

import type { SiteBanner } from "@/types";

function mapBanner(r: Row): SiteBanner {
  return {
    id: r.id,
    placement: r.placement ?? "teacher",
    eyebrow: r.eyebrow ?? "",
    title: r.title ?? "",
    message: r.message ?? "",
    imageUrl: r.image_url ?? "",
    imagePosX: r.image_pos_x ?? 50,
    imagePosY: r.image_pos_y ?? 50,
    linkUrl: r.link_url ?? "",
    linkLabel: r.link_label ?? "",
    active: Boolean(r.active),
    sortOrder: r.sort_order ?? 0,
  };
}

/** All banners for a placement, in display order. */
export async function getBanners(placement: string): Promise<SiteBanner[]> {
  const { data } = await getSupabaseClient()
    .from("site_banners")
    .select("*")
    .eq("placement", placement)
    .order("sort_order");
  return (data ?? []).map(mapBanner);
}

export async function saveBanner(banner: SiteBanner): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("site_banners")
    .upsert({
      id: banner.id,
      placement: banner.placement,
      eyebrow: banner.eyebrow,
      title: banner.title,
      message: banner.message,
      image_url: banner.imageUrl,
      image_pos_x: Math.round(banner.imagePosX),
      image_pos_y: Math.round(banner.imagePosY),
      link_url: banner.linkUrl,
      link_label: banner.linkLabel,
      active: banner.active,
      sort_order: banner.sortOrder,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("site_banners").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Uploads a banner image to the public bucket and returns its public URL. */
export async function uploadBannerImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `banner-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("banners").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("banners").getPublicUrl(path).data.publicUrl;
}

// ---- Unit documents (Word downloads for teachers) ----

export type UnitDocKind = "program" | "assessment";

/** Uploads a unit document (Word) and returns its public URL. */
export async function uploadUnitDocument(
  unitId: string,
  kind: UnitDocKind,
  file: File
): Promise<string> {
  const supabase = getSupabaseClient();
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "");
  const path = `${unitId}/${kind}-${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("unit-docs").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("unit-docs").getPublicUrl(path).data.publicUrl;
}

export async function setUnitDocument(
  unitId: string,
  kind: UnitDocKind,
  url: string
): Promise<void> {
  const column = kind === "program" ? "program" : "assessment_task";
  const { error } = await getSupabaseClient()
    .from("units")
    .update({ [column]: url })
    .eq("id", unitId);
  if (error) throw new Error(error.message);
}

/** Original filename from an uploaded unit-doc URL (strips the kind-timestamp prefix). */
export function unitDocFilename(url: string): string {
  const last = decodeURIComponent(url.split("/").pop() ?? "");
  const match = last.match(/^(?:program|assessment)-\d+-(.+)$/);
  return match ? match[1] : last || "document";
}

// ---- Cover images (unit & lesson cards) ----

export async function uploadCoverImage(
  kind: "unit" | "lesson",
  id: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseClient();
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "");
  const path = `${kind}/${id}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("covers").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

export async function setUnitCover(id: string, url: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("units").update({ cover_image: url }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setLessonCover(id: string, url: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("topics").update({ cover_image: url }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Featured content ----

export async function setUnitFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await getSupabaseClient().from("units").update({ featured }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setLessonFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await getSupabaseClient().from("topics").update({ featured }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Attaches (or clears) the slide deck link shown at the start of a lesson. */
export async function setLessonSlides(id: string, slidesUrl: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("topics")
    .update({ slides_url: slidesUrl })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Videos ----

export async function getVideos(): Promise<Video[]> {
  const { data } = await getSupabaseClient().from("videos").select("*").order("title");
  return (data ?? []).map(mapVideo);
}

export async function getVideo(id: string): Promise<Video | null> {
  const { data } = await getSupabaseClient()
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapVideo(data) : null;
}

export async function getVideosByIds(ids: string[]): Promise<Video[]> {
  if (!ids.length) return [];
  const { data } = await getSupabaseClient()
    .from("videos")
    .select("*")
    .in("id", ids);
  return (data ?? []).map(mapVideo);
}

export async function getVideosByTopic(topicId: string): Promise<Video[]> {
  const { data } = await getSupabaseClient()
    .from("videos")
    .select("*")
    .eq("topic_id", topicId);
  return (data ?? []).map(mapVideo);
}

// ---- Resources ----

export async function getResources(): Promise<Resource[]> {
  const { data } = await getSupabaseClient().from("resources").select("*").order("title");
  return (data ?? []).map(mapResource);
}

export async function getResource(id: string): Promise<Resource | null> {
  const { data } = await getSupabaseClient()
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapResource(data) : null;
}

// ---- Quizzes ----

export async function getQuizzes(): Promise<Quiz[]> {
  const { data } = await getSupabaseClient()
    .from("quizzes")
    .select("*, questions(*)");
  return (data ?? []).map(mapQuiz);
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  const { data } = await getSupabaseClient()
    .from("quizzes")
    .select("*, questions(*)")
    .eq("id", id)
    .single();
  return data ? mapQuiz(data) : null;
}

export async function getQuizByTopic(topicId: string, studentMode = false): Promise<Quiz | null> {
  const questionsSelect = studentMode
    ? "questions(id,question_text,type,options,explanation,difficulty,linked_concept,sort_order)"
    : "questions(*)";
  const { data } = await getSupabaseClient()
    .from("quizzes")
    .select(`*, ${questionsSelect}`)
    .eq("topic_id", topicId)
    .limit(1)
    .maybeSingle();
  return data ? mapQuiz(data) : null;
}

// ---- Schools ----

export async function getSchools(): Promise<School[]> {
  const { data } = await getSupabaseClient().rpc("get_school_stats");
  if (!data) return [];
  return (data as Row[]).map((r) =>
    mapSchool({
      ...r,
      teachers: (r.teacher_ids ?? []).map((id: string) => ({ id, role: "teacher" })),
      students: (r.student_ids ?? []).map((id: string) => ({ id, role: "student" })),
    })
  );
}

export async function getSchool(id: string): Promise<School | null> {
  const { data } = await getSupabaseClient()
    .from("schools")
    .select("*, users(id, role)")
    .eq("id", id)
    .single();
  if (!data) return null;
  const users: Row[] = data.users ?? [];
  return mapSchool({
    ...data,
    teachers: users.filter((u) => u.role === "teacher"),
    students: users.filter((u) => u.role === "student"),
  });
}

// ---- Users ----

export async function getUsers(): Promise<User[]> {
  const { data } = await getSupabaseClient().from("users").select("*");
  return (data ?? []).map((r: Row) => mapUser(r));
}

export async function getUser(id: string): Promise<User | null> {
  const { data } = await getSupabaseClient()
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapUser(data) : null;
}

export async function getTeachers(): Promise<User[]> {
  const { data } = await getSupabaseClient()
    .from("users")
    .select("*")
    .eq("role", "teacher");
  return (data ?? []).map((r: Row) => mapUser(r));
}

export async function getStudents(): Promise<User[]> {
  const { data } = await getSupabaseClient()
    .from("users")
    .select("*")
    .eq("role", "student");
  return (data ?? []).map((r: Row) => mapUser(r));
}

// ---- Classes ----

const CLASS_SELECT = "*, class_students(student_id), assignments(unit_id)";

export async function getClasses(): Promise<ClassGroup[]> {
  const { data } = await getSupabaseClient().from("classes").select(CLASS_SELECT);
  return (data ?? []).map(mapClass);
}

export async function getClass(id: string): Promise<ClassGroup | null> {
  const { data } = await getSupabaseClient()
    .from("classes")
    .select(CLASS_SELECT)
    .eq("id", id)
    .single();
  return data ? mapClass(data) : null;
}

export async function getClassesByTeacher(teacherId: string): Promise<ClassGroup[]> {
  const { data } = await getSupabaseClient()
    .from("classes")
    .select(CLASS_SELECT)
    .eq("teacher_id", teacherId);
  return (data ?? []).map(mapClass);
}

export async function getClassesBySchool(schoolId: string): Promise<ClassGroup[]> {
  const { data } = await getSupabaseClient()
    .from("classes")
    .select(CLASS_SELECT)
    .eq("school_id", schoolId);
  return (data ?? []).map(mapClass);
}

export async function getClassByCode(code: string): Promise<ClassGroup | null> {
  const { data } = await getSupabaseClient()
    .from("classes")
    .select(CLASS_SELECT)
    .eq("class_code", code.toUpperCase())
    .maybeSingle();
  return data ? mapClass(data) : null;
}

export async function getStudentsByClass(classId: string): Promise<User[]> {
  const { data } = await getSupabaseClient()
    .from("users")
    .select("*, class_students!inner(class_id)")
    .eq("class_students.class_id", classId)
    .eq("role", "student");
  return (data ?? []).map((r: Row) => mapUser(r, [classId]));
}

// ---- Quiz results (server-graded quiz scores from the lesson feed) ----

export interface QuizAnswerDetail {
  answer: string;
  correct: boolean;
  correctAnswer: string;
}

export interface ClassQuizResult {
  quizId: string;
  studentId: string;
  topicId: string | null;
  score: number;
  attempts: number;
  submittedAt: string;
  /** Per-question detail (by question id). Empty for attempts before this was recorded. */
  details: Record<string, QuizAnswerDetail>;
}

function mapQuizResult(r: Row): ClassQuizResult {
  return {
    quizId: r.quiz_id as string,
    studentId: r.student_id as string,
    topicId: (r.lesson_id as string) ?? null,
    score: Number(r.score),
    attempts: (r.attempts as number) ?? 1,
    submittedAt: (r.submitted_at as string) ?? "",
    details: (r.details as Record<string, QuizAnswerDetail>) ?? {},
  };
}

export async function getQuizResultsByClass(classId: string): Promise<ClassQuizResult[]> {
  const { data } = await getSupabaseClient()
    .from("quiz_results")
    .select("quiz_id, student_id, lesson_id, score, attempts, submitted_at, details")
    .eq("class_id", classId);
  return (data ?? []).map(mapQuizResult);
}

/** Every quiz result platform-wide (admin analytics). */
export async function getAllQuizResults(): Promise<ClassQuizResult[]> {
  const { data } = await getSupabaseClient()
    .from("quiz_results")
    .select("quiz_id, student_id, lesson_id, score, attempts, submitted_at");
  return (data ?? []).map(mapQuizResult);
}

/** Map each video to the lesson(s) it appears in, via the sequence. */
export async function getVideoLessonMap(): Promise<Map<string, string>> {
  const { data } = await getSupabaseClient()
    .from("lesson_items")
    .select("lesson_id, item_id")
    .eq("item_type", "video");
  const map = new Map<string, string>();
  (data ?? []).forEach((r: Row) => {
    if (!map.has(r.item_id as string)) map.set(r.item_id as string, r.lesson_id as string);
  });
  return map;
}

// ---- Assignments ----

const ASSIGN_SELECT = "*, assignment_topics(topic_id)";

export async function getAssignments(): Promise<Assignment[]> {
  const { data } = await getSupabaseClient().from("assignments").select(ASSIGN_SELECT);
  return (data ?? []).map(mapAssignment);
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  const { data } = await getSupabaseClient()
    .from("assignments")
    .select(ASSIGN_SELECT)
    .eq("class_id", classId);
  return (data ?? []).map(mapAssignment);
}

// ---- Student Progress ----

export async function getProgress(): Promise<StudentProgress[]> {
  const { data } = await getSupabaseClient().from("student_progress").select("*");
  return (data ?? []).map(mapProgress);
}

export async function getProgressByClass(classId: string): Promise<StudentProgress[]> {
  const { data } = await getSupabaseClient()
    .from("student_progress")
    .select("*")
    .eq("class_id", classId);
  return (data ?? []).map(mapProgress);
}

export async function getProgressByStudent(studentId: string): Promise<StudentProgress[]> {
  const { data } = await getSupabaseClient()
    .from("student_progress")
    .select("*")
    .eq("student_id", studentId)
    .order("last_active", { ascending: false });
  return (data ?? []).map(mapProgress);
}

export async function getProgressForStudentVideo(studentId: string, videoId: string): Promise<StudentProgress | null> {
  const { data } = await getSupabaseClient()
    .from("student_progress")
    .select("*")
    .eq("student_id", studentId)
    .eq("video_id", videoId)
    .maybeSingle();
  return data ? mapProgress(data) : null;
}

export async function getProgressForVideo(videoId: string): Promise<StudentProgress[]> {
  const { data } = await getSupabaseClient()
    .from("student_progress")
    .select("*")
    .eq("video_id", videoId);
  return (data ?? []).map(mapProgress);
}

// ---- Adaptive Tasks ----

export async function getAdaptiveTasks(): Promise<AdaptiveTask[]> {
  const { data } = await getSupabaseClient().from("adaptive_tasks").select("*");
  return (data ?? []).map(mapAdaptiveTask);
}

// ---- Mutations: Topics ----

export async function createTopic(data: {
  unitId?: string;
  title: string;
  description: string;
  difficulty: "foundation" | "core" | "advanced";
  subject?: string;
  stage?: string;
}): Promise<Topic> {
  const id = newId("topic");
  const { data: row, error } = await getSupabaseClient()
    .from("topics")
    .insert({
      id,
      unit_id: data.unitId ?? null,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      subject: data.subject ?? "Science",
      stage: data.stage ?? "Stage 3",
    })
    .select("*, videos(id), quizzes(id), resources(id), lesson_items(item_type, item_id)")
    .single();
  if (error) throw new Error(error.message);
  return mapTopic(row);
}

/** Update a lesson's learning area / stage (used by the lesson builder). */
export async function setTopicMeta(
  id: string,
  fields: { subject?: string; stage?: string }
): Promise<void> {
  const { error } = await getSupabaseClient().from("topics").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Update a unit's learning area / stage. */
export async function setUnitMeta(
  id: string,
  fields: { subject?: string; stage?: string }
): Promise<void> {
  const { error } = await getSupabaseClient().from("units").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Mutations: Quizzes ----

export async function createQuiz(quiz: Omit<Quiz, "id">): Promise<Quiz> {
  const supabase = getSupabaseClient();
  const id = newId("quiz");

  const { error } = await supabase.from("quizzes").insert({
    id,
    title: quiz.title,
    topic_id: quiz.topicId || null,
    tags: quiz.tags ?? [],
  });
  if (error) throw new Error(error.message);

  if (quiz.questions.length > 0) {
    const { error: qError } = await supabase.from("questions").insert(
      quiz.questions.map((q, i) => ({
        id: newId("q"),
        quiz_id: id,
        question_text: q.questionText,
        type: q.type,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        linked_concept: q.linkedConcept,
        sort_order: i,
      }))
    );
    if (qError) throw new Error(qError.message);
  }

  return (await getQuiz(id))!;
}

/** Update a quiz's title and replace its full question set. */
export async function updateQuiz(
  id: string,
  quiz: { title: string; tags?: string[]; questions: Question[] }
): Promise<Quiz> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ title: quiz.title, ...(quiz.tags ? { tags: quiz.tags } : {}) })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Replace all questions — simplest way to handle edits, removals & reorders
  const { error: delError } = await supabase.from("questions").delete().eq("quiz_id", id);
  if (delError) throw new Error(delError.message);

  if (quiz.questions.length > 0) {
    const { error: qError } = await supabase.from("questions").insert(
      quiz.questions.map((q, i) => ({
        id: newId("q"),
        quiz_id: id,
        question_text: q.questionText,
        type: q.type,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        linked_concept: q.linkedConcept,
        sort_order: i,
      }))
    );
    if (qError) throw new Error(qError.message);
  }

  return (await getQuiz(id))!;
}

// ---- Queries: Resources and Quizzes by topic ----

export async function getResourcesByTopic(topicId: string): Promise<Resource[]> {
  const { data } = await getSupabaseClient()
    .from("resources")
    .select("*")
    .eq("topic_id", topicId)
    .order("title");
  return (data ?? []).map(mapResource);
}

export async function getQuizzesByTopic(topicId: string): Promise<Quiz[]> {
  const { data } = await getSupabaseClient()
    .from("quizzes")
    .select("*, questions(*)")
    .eq("topic_id", topicId);
  return (data ?? []).map(mapQuiz);
}

// ---- Mutations: Content ----

export async function attachMuxPlayback(
  muxUploadId: string,
  muxAssetId: string,
  muxPlaybackId: string,
  durationSeconds: number
): Promise<void> {
  await getSupabaseClient()
    .from("videos")
    .update({ mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId, duration_seconds: durationSeconds })
    .eq("mux_upload_id", muxUploadId);
}

export async function updateVideo(
  id: string,
  fields: { title?: string; description?: string; tags?: string[]; published?: boolean }
): Promise<Video> {
  const updates: Record<string, unknown> = {};
  if (fields.title       !== undefined) updates.title       = fields.title;
  if (fields.description !== undefined) updates.description = fields.description;
  if (fields.tags        !== undefined) updates.tags        = fields.tags;
  if (fields.published   !== undefined) updates.published   = fields.published;
  const { data, error } = await getSupabaseClient()
    .from("videos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapVideo(data);
}

export async function createVideo(video: Omit<Video, "id">): Promise<Video> {
  const id = newId("vid");
  const { data, error } = await getSupabaseClient()
    .from("videos")
    .insert({
      id,
      title: video.title,
      description: video.description,
      topic_id: video.topicId || null,
      unit_id: video.unitId || null,
      video_url: video.videoUrl,
      thumbnail_url: video.thumbnailUrl,
      duration_seconds: video.durationSeconds,
      tags: video.tags,
      stage: video.stage,
      year_groups: video.yearGroups,
      transcript: video.transcript,
      learning_intent: video.learningIntent,
      success_criteria: video.successCriteria,
      published: video.published,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapVideo(data);
}

export async function createResource(
  resource: Omit<Resource, "id" | "downloads">
): Promise<Resource> {
  const id = newId("res");
  const { data, error } = await getSupabaseClient()
    .from("resources")
    .insert({
      id,
      title: resource.title,
      type: resource.type,
      file_url: resource.fileUrl,
      topic_id: resource.topicId,
      unit_id: resource.unitId,
      stage: resource.stage,
      difficulty: resource.difficulty,
      tags: resource.tags,
      teacher_notes: resource.teacherNotes ?? null,
      published: resource.published,
      downloads: 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapResource(data);
}

export async function createUnit(unit: Omit<Unit, "id" | "createdAt">): Promise<Unit> {
  const id = newId("unit");
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await getSupabaseClient()
    .from("units")
    .insert({
      id,
      title: unit.title,
      subject: unit.subject,
      stage: unit.stage,
      year_groups: unit.yearGroups,
      description: unit.description,
      duration_lessons: unit.durationLessons,
      outcomes: unit.outcomes,
      cover_image: unit.coverImage,
      published: unit.published,
      program: unit.program ?? "",
      assessment_task: unit.assessmentTask ?? "",
      created_at: today,
    })
    .select("*, topics(id)")
    .single();
  if (error) throw new Error(error.message);
  return mapUnit(data);
}

export async function updateUnit(
  id: string,
  fields: Partial<Pick<Unit, "title" | "description" | "program" | "assessmentTask" | "published">>
): Promise<Unit> {
  const dbFields: Record<string, unknown> = {};
  if (fields.title !== undefined)         dbFields.title = fields.title;
  if (fields.description !== undefined)   dbFields.description = fields.description;
  if (fields.program !== undefined)       dbFields.program = fields.program;
  if (fields.assessmentTask !== undefined) dbFields.assessment_task = fields.assessmentTask;
  if (fields.published !== undefined)     dbFields.published = fields.published;
  const { data, error } = await getSupabaseClient()
    .from("units")
    .update(dbFields)
    .eq("id", id)
    .select("*, topics(id)")
    .single();
  if (error) throw new Error(error.message);
  return mapUnit(data);
}

// ---- Mutations: Classes & Students ----

function generateClassCode(name: string): string {
  const base = name.replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase() || "CLASS";
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}-${suffix}`;
}

export async function createClass(
  input: Omit<ClassGroup, "id" | "classCode" | "studentIds" | "assignedUnitIds">,
  size = 0
): Promise<ClassGroup> {
  const supabase = getSupabaseClient();
  const id = newId("class");
  const classCode = generateClassCode(input.name);

  const { error } = await supabase.from("classes").insert({
    id,
    name: input.name,
    year_group: input.yearGroup,
    teacher_id: input.teacherId,
    school_id: input.schoolId,
    class_code: classCode,
  });
  if (error) throw new Error(error.message);

  if (size > 0) {
    // Pick random animals and create alias students.
    const picked = animals.slice().sort(() => Math.random() - 0.5).slice(0, size);
    const studentRows = picked.map((animal) => ({
      id: newId("stu"),
      name: animal.name,
      animal_id: animal.id,
      email: "",
      role: "student",
      school_id: input.schoolId,
      pin: generatePin(),
      created_at: new Date().toISOString().slice(0, 10),
    }));

    const { data: created } = await supabase.from("users").insert(studentRows).select("id");
    const studentIds = (created ?? []).map((r: Row) => String(r.id));

    await supabase
      .from("class_students")
      .insert(studentIds.map((sid: string) => ({ class_id: id, student_id: sid })));
  }

  return (await getClass(id))!;
}

export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  await getSupabaseClient()
    .from("class_students")
    .delete()
    .eq("class_id", classId)
    .eq("student_id", studentId);
}

/** Toggle silent (captions-only) playback for a whole class. */
export async function setClassSilentMode(classId: string, silent: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("classes")
    .update({ silent_mode: silent })
    .eq("id", classId);
  if (error) throw new Error(error.message);
}

/** Toggle headphone (full-volume) playback for a whole class. */
export async function setClassHeadphoneMode(classId: string, headphone: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("classes")
    .update({ headphone_mode: headphone })
    .eq("id", classId);
  if (error) throw new Error(error.message);
}

export async function addAlias(classId: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  // Find which animals are already taken in this class.
  const { data: existing } = await supabase
    .from("users")
    .select("animal_id, class_students!inner(class_id)")
    .eq("class_students.class_id", classId)
    .eq("role", "student");

  const taken = new Set((existing ?? []).map((r: Row) => r.animal_id).filter(Boolean));
  const pool = animals.filter((a) => !taken.has(a.id));
  if (pool.length === 0) return null;

  const animal = pool[Math.floor(Math.random() * pool.length)];
  const cls = await getClass(classId);
  if (!cls) return null;

  const id = newId("stu");
  const today = new Date().toISOString().slice(0, 10);

  await supabase.from("users").insert({
    id,
    name: animal.name,
    animal_id: animal.id,
    email: "",
    role: "student",
    school_id: cls.schoolId,
    pin: generatePin(),
    created_at: today,
  });

  await supabase.from("class_students").insert({ class_id: classId, student_id: id });

  return getUser(id);
}

export async function assignLessonToClass(
  input: Omit<Assignment, "id" | "assignedAt">
): Promise<Assignment> {
  const supabase = getSupabaseClient();
  const id = newId("assign");
  const today = new Date().toISOString().slice(0, 10);

  // Re-assigning the same unit to the same class replaces the old assignment
  // (e.g. switching delivery mode) instead of duplicating it in classwork.
  await supabase
    .from("assignments")
    .delete()
    .eq("class_id", input.classId)
    .eq("unit_id", input.unitId);

  const { error } = await supabase.from("assignments").insert({
    id,
    class_id: input.classId,
    unit_id: input.unitId,
    due_date: input.dueDate,
    adaptive_tasks_enabled: input.adaptiveTasksEnabled,
    explorer_points_enabled: input.explorerPointsEnabled,
    delivery_mode: input.deliveryMode,
    assigned_at: today,
  });
  if (error) throw new Error(error.message);

  if (input.topicIds.length) {
    await supabase.from("assignment_topics").insert(
      input.topicIds.map((tid) => ({ assignment_id: id, topic_id: tid }))
    );
  }

  return (await getAssignmentsByClass(input.classId)).find((a) => a.id === id)!;
}

// ---- Mutations: Student Progress ----

export async function upsertProgress(
  progress: Omit<StudentProgress, "id"> & { unitId?: string; topicId?: string }
): Promise<StudentProgress> {
  const supabase = getSupabaseClient();

  // Try to find an existing record for this student + video combo.
  const { data: existing } = await supabase
    .from("student_progress")
    .select("id")
    .eq("student_id", progress.studentId)
    .eq("video_id", progress.videoId)
    .maybeSingle();

  const id = existing?.id ?? newId("prog");

  const { data, error } = await supabase
    .from("student_progress")
    .upsert({
      id,
      student_id: progress.studentId,
      class_id: progress.classId,
      unit_id: progress.unitId || null,
      topic_id: progress.topicId || null,
      video_id: progress.videoId,
      watch_time_seconds: progress.watchTimeSeconds,
      video_completion_percentage: progress.videoCompletionPercentage,
      replay_count: progress.replayCount,
      skipped: progress.skipped,
      clicked_curious: progress.clickedCurious,
      clicked_help: progress.clickedHelp,
      quiz_score: progress.quizScore,
      quiz_attempts: progress.quizAttempts,
      worksheet_completed: progress.worksheetCompleted,
      adaptive_focus_area: progress.adaptiveFocusArea,
      engagement_level: progress.engagementLevel,
      recommended_task_type: progress.recommendedTaskType ?? null,
      video_reaction: progress.videoReaction ?? null,
      last_active: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProgress(data);
}

// ---- Lesson Items ----

import type {
  LessonItem,
  LessonItemWithContent,
  Activity,
  ActivityBlock,
  TaggedActivityBlock,
  StudentActivityResponse,
  BlockResponse,
  Difficulty,
} from "@/types";

function mapLessonItem(r: Row): LessonItem {
  return {
    id: r.id,
    lessonId: r.lesson_id,
    itemType: r.item_type,
    itemId: r.item_id,
    orderIndex: r.order_index,
  };
}

function mapActivity(r: Row): Activity {
  return {
    id: r.id,
    lessonId: r.lesson_id ?? undefined,
    setId: r.set_id ?? undefined,
    topicTags: r.topic_tags ?? undefined,
    title: r.title,
    difficulty: r.difficulty,
    blocks: (r.blocks ?? []) as TaggedActivityBlock[],
    createdAt: r.created_at ?? "",
  };
}

function mapStudentActivityResponse(r: Row): StudentActivityResponse {
  return {
    id: r.id,
    activityId: r.activity_id,
    studentId: r.student_id,
    classId: r.class_id,
    responses: (r.responses ?? []) as BlockResponse[],
    submittedAt: r.submitted_at ?? undefined,
    lastEditedAt: r.last_edited_at ?? "",
  };
}

export async function getLessonItems(lessonId: string, studentMode = false): Promise<LessonItemWithContent[]> {
  const supabase = getSupabaseClient();

  const { data: items } = await supabase
    .from("lesson_items")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("order_index");

  if (!items || items.length === 0) return [];

  const videoIds = items.filter((i: Row) => i.item_type === "video").map((i: Row) => i.item_id);
  const quizIds  = items.filter((i: Row) => i.item_type === "quiz").map((i: Row) => i.item_id);

  // In student mode, omit correct_answer from the Supabase query so it never
  // reaches the browser. Grading is handled server-side by /api/student/quiz-submit.
  const questionsSelect = studentMode
    ? "questions(id,question_text,type,options,explanation,difficulty,linked_concept,sort_order)"
    : "questions(*)";

  const [videosData, quizzesData] = await Promise.all([
    videoIds.length
      ? supabase.from("videos").select("*").in("id", videoIds)
      : { data: [] },
    quizIds.length
      ? supabase.from("quizzes").select(`*, ${questionsSelect}`).in("id", quizIds)
      : { data: [] },
  ]);

  const videoMap = new Map<string, Video>((videosData.data ?? []).map((v: Row) => [v.id as string, mapVideo(v)]));
  const quizMap  = new Map<string, Quiz>((quizzesData.data ?? []).map((q: Row) => [q.id as string, mapQuiz(q)]));

  return (items as Row[]).reduce((acc: LessonItemWithContent[], r: Row) => {
    const base = mapLessonItem(r);
    if (r.item_type === "video") {
      const video = videoMap.get(r.item_id);
      if (video) acc.push({ ...base, itemType: "video", video });
    } else if (r.item_type === "quiz") {
      const quiz = quizMap.get(r.item_id);
      if (quiz) acc.push({ ...base, itemType: "quiz", quiz });
    } else if (r.item_type === "activity") {
      acc.push({ ...base, itemType: "activity" });
    }
    return acc;
  }, []);
}

export async function getLessonOrTopicItems(id: string, studentMode = false): Promise<LessonItemWithContent[]> {
  const items = await getLessonItems(id, studentMode);
  if (items.length > 0) return items;

  // Fall back: treat id as a topicId and synthesise a sequence
  const [topic, quiz] = await Promise.all([getTopic(id), getQuizByTopic(id)]);
  if (!topic) return [];

  const videos = await getVideosByTopic(id);
  const synth: LessonItemWithContent[] = videos.map((video, i) => ({
    id: `synth-v-${video.id}`,
    lessonId: id,
    itemType: "video" as const,
    itemId: video.id,
    orderIndex: i,
    video,
  }));
  if (quiz) {
    synth.push({
      id: `synth-q-${quiz.id}`,
      lessonId: id,
      itemType: "quiz" as const,
      itemId: quiz.id,
      orderIndex: videos.length,
      quiz,
    });
  }
  return synth;
}

export async function addItemToLesson(
  lessonId: string,
  itemType: "video" | "quiz" | "activity",
  itemId: string,
  orderIndex: number
): Promise<LessonItem> {
  const id = newId("li");
  const { data, error } = await getSupabaseClient()
    .from("lesson_items")
    .insert({ id, lesson_id: lessonId, item_type: itemType, item_id: itemId, order_index: orderIndex })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapLessonItem(data);
}

export async function removeLessonItem(itemId: string): Promise<void> {
  await getSupabaseClient().from("lesson_items").delete().eq("id", itemId);
}

export async function reorderLessonItems(
  updates: Array<{ id: string; orderIndex: number }>
): Promise<void> {
  const supabase = getSupabaseClient();
  await Promise.all(
    updates.map(({ id, orderIndex }) =>
      supabase.from("lesson_items").update({ order_index: orderIndex }).eq("id", id)
    )
  );
}

// ---- Activities ----

export async function getActivity(id: string): Promise<Activity | null> {
  const { data } = await getSupabaseClient()
    .from("activities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapActivity(data) : null;
}

export async function getActivities(): Promise<Activity[]> {
  const { data } = await getSupabaseClient()
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapActivity);
}

/** Find the activity whose blocks are tagged with any of the given video tags. */
export async function getActivityForVideoTags(videoTags: string[]): Promise<Activity | null> {
  if (!videoTags.length) return null;
  const all = await getActivities();
  return all.find((a) =>
    a.blocks.some((b) => getBlockTags(b).some((t) => videoTags.includes(t)))
  ) ?? null;
}

export async function getActivitiesForLesson(lessonId: string): Promise<Activity[]> {
  const { data } = await getSupabaseClient()
    .from("activities")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("difficulty");
  return (data ?? []).map(mapActivity);
}

export async function getActivitiesByIds(ids: string[]): Promise<Activity[]> {
  if (!ids.length) return [];
  const { data } = await getSupabaseClient()
    .from("activities")
    .select("*")
    .in("id", ids);
  const byId = new Map((data ?? []).map((r: Row) => [r.id as string, mapActivity(r)]));
  return ids.map((id) => byId.get(id)).filter((a): a is Activity => Boolean(a));
}

/*
 * Picks the 3-4 activities that make up a student's worksheet from a lesson's
 * activity pool. Quiz performance sets the preferred difficulty tier;
 * interest scores (video tags weighted by watch behaviour) rank activities
 * within each tier. Adjacent tiers fill remaining slots when the target tier
 * runs short.
 */
export function selectAdaptiveActivities(
  pool: Activity[],
  avgQuizScore: number | null,
  interestByTag: Record<string, number>,
  count = 4
): Activity[] {
  if (pool.length === 0) return [];

  const target: Difficulty =
    avgQuizScore === null ? "core"
    : avgQuizScore >= 80 ? "advanced"
    : avgQuizScore >= 50 ? "core"
    : "foundation";

  const fallbackOrder: Record<Difficulty, Difficulty[]> = {
    advanced:   ["advanced", "core", "foundation"],
    core:       ["core", "foundation", "advanced"],
    foundation: ["foundation", "core", "advanced"],
  };
  const tierRank = new Map(fallbackOrder[target].map((d, i) => [d, i]));

  const interestScore = (a: Activity): number => {
    const tags = new Set<string>(a.topicTags ?? []);
    a.blocks.forEach((b) => getBlockTags(b).forEach((t) => tags.add(t)));
    let score = 0;
    tags.forEach((t) => { score += interestByTag[t] ?? 0; });
    return score;
  };

  return [...pool]
    .sort((a, b) => {
      const tier = (tierRank.get(a.difficulty) ?? 3) - (tierRank.get(b.difficulty) ?? 3);
      if (tier !== 0) return tier;
      return interestScore(b) - interestScore(a);
    })
    .slice(0, count);
}

export type PointEventType =
  | "video_completed"
  | "quiz_ace"
  | "worksheet_completed"
  | "curious_click"
  | "activity_completed";

export const POINT_VALUES: Record<PointEventType, number> = {
  video_completed: 20,
  quiz_ace: 20,
  worksheet_completed: 15,
  curious_click: 5,
  activity_completed: 15,
};

/**
 * Awards points to a student for a qualifying action. Idempotent — a unique
 * (student_id, event_type, reference_id) constraint prevents double-awarding
 * for the same action. Failures are swallowed so points never break the flow.
 */
export async function awardPoints(
  studentId: string,
  classId: string | null,
  eventType: PointEventType,
  referenceId: string
): Promise<void> {
  try {
    await getSupabaseClient().from("points_events").insert({
      id: newId("pe"),
      student_id: studentId,
      class_id: classId,
      event_type: eventType,
      points: POINT_VALUES[eventType],
      reference_id: referenceId,
    });
  } catch {
    // Unique constraint violation = already awarded. Any other error is silent.
  }
}

export async function getPointsTotal(studentId: string): Promise<number> {
  const { data } = await getSupabaseClient()
    .from("points_events")
    .select("points")
    .eq("student_id", studentId);
  return (data ?? []).reduce((sum: number, row: { points: number }) => sum + row.points, 0);
}

export async function getPointsHistory(studentId: string): Promise<
  { eventType: string; points: number; referenceId: string | null; createdAt: string }[]
> {
  const { data } = await getSupabaseClient()
    .from("points_events")
    .select("event_type, points, reference_id, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r: { event_type: string; points: number; reference_id: string | null; created_at: string }) => ({
    eventType: r.event_type,
    points: r.points,
    referenceId: r.reference_id,
    createdAt: r.created_at,
  }));
}

export async function saveClassSession(session: {
  classId: string;
  topicId: string;
  videoId: string | null;
  teacherId: string | null;
  classReaction: "loved" | "meh" | "skip" | null;
  classScore: number;
  classDifficulty: "foundation" | "core" | "advanced";
  recommendedQs: number[];
  challengeQs: number[];
}): Promise<void> {
  await getSupabaseClient().from("class_sessions").insert({
    id: newId("cs"),
    class_id: session.classId,
    topic_id: session.topicId,
    video_id: session.videoId,
    teacher_id: session.teacherId,
    class_reaction: session.classReaction,
    class_score: session.classScore,
    class_difficulty: session.classDifficulty,
    recommended_qs: session.recommendedQs,
    challenge_qs: session.challengeQs,
    session_date: new Date().toISOString().slice(0, 10),
  });
}

export async function upsertActivity(
  activity: { id?: string } & Omit<Activity, "id" | "createdAt">
): Promise<Activity> {
  const id = activity.id ?? newId("act");
  const { data, error } = await getSupabaseClient()
    .from("activities")
    .upsert({
      id,
      lesson_id: activity.lessonId ?? null,
      topic_tags: activity.topicTags ?? null,
      title: activity.title,
      difficulty: activity.difficulty,
      blocks: activity.blocks,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapActivity(data);
}

export async function getActivitiesBySetId(setId: string): Promise<Activity[]> {
  const { data } = await getSupabaseClient()
    .from("activities")
    .select("*")
    .eq("set_id", setId)
    .order("difficulty");
  return (data ?? []).map(mapActivity);
}

export async function deleteActivity(id: string): Promise<void> {
  await getSupabaseClient().from("activities").delete().eq("id", id);
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("units").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("topics").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("videos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteQuiz(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("quizzes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Student Activity Responses ----

export async function getStudentActivityResponse(
  activityId: string,
  studentId: string,
  classId: string
): Promise<StudentActivityResponse | null> {
  const { data } = await getSupabaseClient()
    .from("student_activity_responses")
    .select("*")
    .eq("activity_id", activityId)
    .eq("student_id", studentId)
    .eq("class_id", classId)
    .maybeSingle();
  return data ? mapStudentActivityResponse(data) : null;
}

export async function upsertStudentActivityResponse(
  response: Omit<StudentActivityResponse, "id" | "lastEditedAt">
): Promise<StudentActivityResponse> {
  const supabase = getSupabaseClient();

  // Deterministic id from the natural key so rapid autosaves collapse onto one
  // row. Upserting on the unique (activity, student, class) constraint avoids
  // the SELECT-then-insert race that caused duplicate-key errors.
  const id = deterministicId("sar", response.activityId, response.studentId, response.classId);
  const { data, error } = await supabase
    .from("student_activity_responses")
    .upsert(
      {
        id,
        activity_id: response.activityId,
        student_id: response.studentId,
        class_id: response.classId,
        responses: response.responses,
        submitted_at: response.submittedAt ?? null,
        last_edited_at: new Date().toISOString(),
      },
      { onConflict: "activity_id,student_id,class_id" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapStudentActivityResponse(data);
}

export async function getResponsesForActivity(
  activityId: string
): Promise<StudentActivityResponse[]> {
  const { data } = await getSupabaseClient()
    .from("student_activity_responses")
    .select("*")
    .eq("activity_id", activityId)
    .order("last_edited_at", { ascending: false });
  return (data ?? []).map(mapStudentActivityResponse);
}

export async function getResponsesByClass(
  classId: string
): Promise<StudentActivityResponse[]> {
  const { data } = await getSupabaseClient()
    .from("student_activity_responses")
    .select("*")
    .eq("class_id", classId)
    .order("last_edited_at", { ascending: false });
  return (data ?? []).map(mapStudentActivityResponse);
}

// ---- Analytics Events ----

export async function logAnalyticsEvent(
  event: Omit<AnalyticsEvent, "id" | "timestamp">
): Promise<void> {
  try {
    await getSupabaseClient()
      .from("analytics_events")
      .insert({
        id: newId("ae"),
        user_id: event.userId,
        role: event.role,
        event_type: event.eventType,
        video_id: event.videoId ?? null,
        topic_id: event.topicId ?? null,
        unit_id: event.unitId ?? null,
        class_id: event.classId ?? null,
        timestamp: new Date().toISOString(),
        metadata: event.metadata ?? null,
      });
  } catch {
    // Analytics failures must never break the student flow
  }
}
