-- Run this in the Supabase SQL editor.
-- Adds Mux tracking columns to the videos table.

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS mux_upload_id   TEXT,
  ADD COLUMN IF NOT EXISTS mux_asset_id    TEXT,
  ADD COLUMN IF NOT EXISTS mux_playback_id TEXT;

-- Index for webhook lookups (upload_id → playback_id update)
CREATE INDEX IF NOT EXISTS videos_mux_upload_id_idx ON public.videos (mux_upload_id);
CREATE INDEX IF NOT EXISTS videos_mux_asset_id_idx  ON public.videos (mux_asset_id);
