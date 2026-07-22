import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityBlock } from "@/types";

function newId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

async function requireAdmin() {
  const userClient = await createSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;
  // Check app_metadata (set server-side only) for the role — not user_metadata.
  const appMeta = user.app_metadata as Record<string, unknown>;
  if (appMeta.bb_role !== "admin") return null;
  return user;
}

// POST /api/admin/activity — upsert an activity
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, lessonId, title, difficulty, blocks, feedbackKeywords } = await req.json() as {
    id?: string;
    lessonId: string;
    title: string;
    difficulty: string;
    blocks: ActivityBlock[];
    feedbackKeywords?: string[];
  };

  if (!lessonId || !title?.trim() || !difficulty) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();
  const activityId = id ?? newId("act");

  const { data, error } = await supabase
    .from("activities")
    .upsert({
      id: activityId,
      lesson_id: lessonId,
      title: title.trim(),
      difficulty,
      blocks,
      topic_tags: null,
      feedback_keywords: feedbackKeywords && feedbackKeywords.length > 0 ? feedbackKeywords : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activity: data });
}

// PATCH /api/admin/activity — link an existing activity to a lesson
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, lessonId } = await req.json() as { id: string; lessonId: string };
  if (!id || !lessonId) return NextResponse.json({ error: "Missing id or lessonId." }, { status: 400 });

  const supabase = await createSupabaseServiceClient();

  // Check for a conflicting activity (same lesson + difficulty).
  const { data: existing } = await supabase
    .from("activities")
    .select("id, difficulty")
    .eq("id", id)
    .single();

  if (existing) {
    const { data: conflict } = await supabase
      .from("activities")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("difficulty", existing.difficulty)
      .neq("id", id)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json(
        { error: `This lesson already has a ${existing.difficulty} activity. Remove it first.` },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("activities")
    .update({ lesson_id: lessonId })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activity: data });
}

// DELETE /api/admin/activity?id=act-xxx — delete an activity
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const supabase = await createSupabaseServiceClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
