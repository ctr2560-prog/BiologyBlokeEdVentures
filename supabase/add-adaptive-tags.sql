-- Add topic_tags array to activities for the per-block adaptive tagging system
ALTER TABLE activities ADD COLUMN IF NOT EXISTS topic_tags TEXT[];
