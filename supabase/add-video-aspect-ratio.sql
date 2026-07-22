-- Run this in the Supabase SQL editor.
-- Lets admins mark each video as 'vertical' (9:16, fills a full-screen reel
-- edge-to-edge) or 'horizontal' (16:9, letterboxed). Defaults to 'horizontal'
-- so existing videos keep their current framing until an admin changes it.

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS aspect_ratio text NOT NULL DEFAULT 'horizontal'
    CHECK (aspect_ratio IN ('vertical', 'horizontal'));
