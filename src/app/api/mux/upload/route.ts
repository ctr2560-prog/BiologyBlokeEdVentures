import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// POST /api/mux/upload
// Body: { videoId, corsOrigin? }
// Creates a Mux direct upload URL and stores the mux_upload_id on the video record.
// The client then PUTs the file directly to uploadUrl (never hits our server).
export async function POST(req: NextRequest) {
  try {
    const { videoId, corsOrigin } = await req.json();
    if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return NextResponse.json({ error: "Mux credentials not configured" }, { status: 500 });
    }

    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin ?? "*",
      new_asset_settings: {
        playback_policy: ["public"],
        mp4_support: "none",
      },
    });

    const supabase = await createSupabaseServiceClient();
    await supabase
      .from("videos")
      .update({ mux_upload_id: upload.id })
      .eq("id", videoId);

    return NextResponse.json({ uploadUrl: upload.url, uploadId: upload.id });
  } catch (err) {
    console.error("Mux upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
