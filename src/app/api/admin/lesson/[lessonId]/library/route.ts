import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = await createSupabaseServiceClient();

  const [videos, quizzes, activities] = await Promise.all([
    supabase.from("videos").select("*").order("title"),
    supabase.from("quizzes").select("*, questions(*)").order("title"),
    supabase.from("activities").select("id, title, difficulty, lesson_id, blocks").order("difficulty").order("title"),
  ]);

  return NextResponse.json({
    videos: videos.data ?? [],
    quizzes: quizzes.data ?? [],
    activities: activities.data ?? [],
  });
}
