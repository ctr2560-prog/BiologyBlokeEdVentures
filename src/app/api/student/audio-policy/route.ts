import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

/*
 * Returns the audio policy for the signed-in student's class: whether the
 * teacher has set silent (captions-only) mode, or headphone (full-volume) mode
 * for the room.
 */
export async function GET() {
  const userClient = await createSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ silentMode: false, headphoneMode: false });

  const classId = (user.user_metadata as Record<string, unknown>)?.class_id as string | undefined;
  if (!classId) return NextResponse.json({ silentMode: false, headphoneMode: false });

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("classes")
    .select("silent_mode, headphone_mode")
    .eq("id", classId)
    .maybeSingle();

  return NextResponse.json({
    silentMode: Boolean(data?.silent_mode),
    headphoneMode: Boolean(data?.headphone_mode),
  });
}
