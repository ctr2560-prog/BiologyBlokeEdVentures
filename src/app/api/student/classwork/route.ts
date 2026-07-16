import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  // Read the student's session from cookies (server-side — no JWT staleness issues).
  const userClient = await createSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const meta = user.user_metadata as Record<string, unknown>;
  const classId = meta?.class_id as string | undefined;
  const studentId = meta?.student_id as string | undefined;

  if (!classId || !studentId) {
    return NextResponse.json({ assignments: [], units: {}, topics: {}, videos: {}, progress: [] });
  }

  const supabase = await createSupabaseServiceClient();

  // Fetch assignments + nested topic ids.
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, assignment_topics(topic_id)")
    .eq("class_id", classId);

  if (!assignments || assignments.length === 0) {
    return NextResponse.json({ assignments: [], units: {}, topics: {}, videos: {}, progress: [] });
  }

  // Collect unique unit and topic ids.
  const unitIds = [...new Set(assignments.map((a) => a.unit_id as string))];
  const topicIds = [
    ...new Set(
      assignments.flatMap((a) =>
        (a.assignment_topics as { topic_id: string }[]).map((at) => at.topic_id)
      )
    ),
  ];

  // Fetch all supporting data in parallel.
  // Videos link to a lesson via lesson_items (new) and/or videos.topic_id (legacy),
  // so we resolve both and group by the owning topic.
  const [unitsRes, topicsRes, legacyVideosRes, lessonItemsRes, progressRes] = await Promise.all([
    supabase.from("units").select("*").in("id", unitIds),
    supabase.from("topics").select("*").in("id", topicIds),
    topicIds.length
      ? supabase.from("videos").select("*").in("topic_id", topicIds).order("created_at")
      : Promise.resolve({ data: [] }),
    topicIds.length
      ? supabase.from("lesson_items").select("lesson_id, item_id, order_index").eq("item_type", "video").in("lesson_id", topicIds).order("order_index")
      : Promise.resolve({ data: [] }),
    supabase
      .from("student_progress")
      .select("*")
      .eq("student_id", studentId),
  ]);

  // Fetch the videos referenced by the lesson sequence.
  const seqVideoIds = [...new Set((lessonItemsRes.data ?? []).map((i) => i.item_id as string))];
  const seqVideosRes = seqVideoIds.length
    ? await supabase.from("videos").select("*").in("id", seqVideoIds)
    : { data: [] };
  const videoById = new Map((seqVideosRes.data ?? []).map((v) => [v.id as string, v]));

  // Index by id for easy lookup on the client.
  const units = Object.fromEntries((unitsRes.data ?? []).map((u) => [u.id, u]));
  const topics = Object.fromEntries((topicsRes.data ?? []).map((t) => [t.id, t]));
  const videosByTopic: Record<string, unknown[]> = {};
  const pushVideo = (tid: string, v: unknown) => {
    if (!videosByTopic[tid]) videosByTopic[tid] = [];
    videosByTopic[tid].push(v);
  };
  // Preferred: lesson_items order per topic
  for (const item of lessonItemsRes.data ?? []) {
    const v = videoById.get(item.item_id as string);
    if (v) pushVideo(item.lesson_id as string, v);
  }
  // Legacy topic_id links, only for topics the sequence didn't already cover
  for (const v of legacyVideosRes.data ?? []) {
    const tid = v.topic_id as string;
    if (!videosByTopic[tid]) pushVideo(tid, v);
  }

  return NextResponse.json({
    assignments,
    units,
    topics,
    videosByTopic,
    progress: progressRes.data ?? [],
  });
}
