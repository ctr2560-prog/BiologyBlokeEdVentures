import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// POST /api/mux/webhook
// Mux calls this when a video finishes processing.
// We verify the signature, then update the video record with the playback ID.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("mux-signature") ?? "";

  try {
    mux.webhooks.verifySignature(rawBody, req.headers, process.env.MUX_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: {
      id: string;
      upload_id?: string;
      playback_ids?: { id: string; policy: string }[];
      duration?: number;
    };
  };

  if (event.type === "video.asset.ready") {
    const { id: assetId, upload_id: uploadId, playback_ids, duration } = event.data;
    const playbackId = playback_ids?.find((p) => p.policy === "public")?.id;

    if (uploadId && playbackId) {
      const supabase = await createSupabaseServiceClient();
      await supabase
        .from("videos")
        .update({
          mux_asset_id: assetId,
          mux_playback_id: playbackId,
          duration_seconds: Math.round(duration ?? 0),
          published: true,
        })
        .eq("mux_upload_id", uploadId);
    }
  }

  return NextResponse.json({ received: true });
}
