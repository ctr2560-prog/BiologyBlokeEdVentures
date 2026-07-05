-- ============================================================
-- Biology Bloke Edventures — Supabase Database Schema
-- Run this in the Supabase SQL Editor after creating your project
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CLASSES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  year_level      TEXT NOT NULL,
  focus           TEXT,
  code            TEXT UNIQUE NOT NULL,          -- e.g. W7CR4
  active_edventure TEXT,                          -- current topic assigned
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STUDENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  nickname        TEXT NOT NULL,
  pathway         TEXT NOT NULL DEFAULT 'grow'   CHECK (pathway IN ('explore','grow','support')),
  progress_pct    INTEGER DEFAULT 0,
  explorer_points INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WATCH EVENTS ─────────────────────────────────────────
-- Each row = one video session by one student
CREATE TABLE IF NOT EXISTS watch_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id            UUID REFERENCES classes(id) ON DELETE SET NULL,
  video_id            TEXT NOT NULL,
  topic               TEXT NOT NULL,
  watch_pct           INTEGER DEFAULT 0,         -- 0–100
  avg_time_seconds    INTEGER DEFAULT 0,
  rewatched           BOOLEAN DEFAULT FALSE,
  drop_off_point      INTEGER,                   -- % where student left
  engagement_level    TEXT CHECK (engagement_level IN ('high','mid','low')),
  adaptive_focus      TEXT,                      -- sub-topic to focus on
  curiosity_response  TEXT,                      -- optional typed reflection
  check_in_correct    BOOLEAN,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLASS EDVENTURES ─────────────────────────────────────
-- Tracks which programs/topics a teacher has assigned to a class
CREATE TABLE IF NOT EXISTS class_edventures (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  stage_id    TEXT NOT NULL,
  topic_id    TEXT NOT NULL,
  topic_label TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, stage_id, topic_id)
);

-- ─── EDVENTURE VIDEOS ──────────────────────────────────────
-- Teacher-managed short-form media and adaptive timing rules
CREATE TABLE IF NOT EXISTS edventure_videos (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id                    TEXT NOT NULL,
  topic_id                    TEXT NOT NULL,
  title                       TEXT NOT NULL,
  description                 TEXT,
  video_url                   TEXT NOT NULL,
  thumbnail_emoji             TEXT DEFAULT '🌿',
  duration_seconds            INTEGER NOT NULL DEFAULT 90,
  sequence_index              INTEGER NOT NULL DEFAULT 1,
  curiosity_prompt            TEXT NOT NULL,
  curiosity_prompt_at_seconds INTEGER NOT NULL DEFAULT 45,
  check_in_question           TEXT NOT NULL,
  check_in_options            JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option              TEXT NOT NULL,
  check_in_at_seconds         INTEGER NOT NULL DEFAULT 75,
  support_threshold_pct       INTEGER NOT NULL DEFAULT 40,
  explore_threshold_pct       INTEGER NOT NULL DEFAULT 80,
  adaptive_focus              TEXT,
  support_resource_url        TEXT,
  explore_resource_url        TEXT,
  is_published                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STUDENT PATHWAYS LOG ─────────────────────────────────
-- Historical log of pathway changes for a student
CREATE TABLE IF NOT EXISTS pathway_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  old_pathway     TEXT,
  new_pathway     TEXT NOT NULL,
  reason          TEXT,
  confidence      INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE classes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_edventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE edventure_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathway_history ENABLE ROW LEVEL SECURITY;

-- ─── CLASSES policies ─────────────────────────────────────
-- Teachers can only manage their own classes
CREATE POLICY "Teachers manage own classes"
  ON classes FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Students can read their own class
CREATE POLICY "Students read own class"
  ON classes FOR SELECT
  USING (id IN (SELECT class_id FROM students WHERE id = auth.uid()));

-- ─── STUDENTS policies ─────────────────────────────────────
-- Teachers can see students in their classes
CREATE POLICY "Teachers see their students"
  ON students FOR ALL
  USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()))
  WITH CHECK (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));

-- Students can read/update their own record
CREATE POLICY "Students manage own record"
  ON students FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── WATCH EVENTS policies ────────────────────────────────
-- Students can insert their own events
CREATE POLICY "Students insert own events"
  ON watch_events FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can read own events
CREATE POLICY "Students read own events"
  ON watch_events FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can read events for their classes
CREATE POLICY "Teachers read class events"
  ON watch_events FOR SELECT
  USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));

-- ─── CLASS EDVENTURES policies ────────────────────────────
CREATE POLICY "Teachers manage edventures"
  ON class_edventures FOR ALL
  USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()))
  WITH CHECK (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));

CREATE POLICY "Students read assigned edventures"
  ON class_edventures FOR SELECT
  USING (class_id IN (SELECT class_id FROM students WHERE id = auth.uid()));

-- ─── EDVENTURE VIDEOS policies ────────────────────────────
CREATE POLICY "Teachers manage own video library"
  ON edventure_videos FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students read published videos"
  ON edventure_videos FOR SELECT
  USING (is_published = TRUE);

-- ─── PATHWAY HISTORY policies ─────────────────────────────
CREATE POLICY "Teachers read pathway history"
  ON pathway_history FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )));

CREATE POLICY "Students read own pathway history"
  ON pathway_history FOR SELECT
  USING (student_id = auth.uid());

-- ============================================================
-- INDEXES for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_class       ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_student ON watch_events(student_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_class   ON watch_events(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher      ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code         ON classes(code);
CREATE INDEX IF NOT EXISTS idx_videos_teacher_topic ON edventure_videos(teacher_id, stage_id, topic_id, sequence_index);

-- ============================================================
-- FUNCTION: Update student pathway after watch event
-- Called automatically via trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_student_pathway()
RETURNS TRIGGER AS $$
DECLARE
  avg_watch    FLOAT;
  rewatch_pct  FLOAT;
  new_pathway  TEXT;
  old_pathway  TEXT;
BEGIN
  -- Calculate average watch % for this student over last 5 events
  SELECT AVG(watch_pct), AVG(CASE WHEN rewatched THEN 1.0 ELSE 0.0 END)
  INTO avg_watch, rewatch_pct
  FROM (
    SELECT watch_pct, rewatched FROM watch_events
    WHERE student_id = NEW.student_id
    ORDER BY created_at DESC
    LIMIT 5
  ) recent;

  -- Determine pathway
  IF avg_watch >= 75 OR (avg_watch >= 65 AND rewatch_pct >= 0.3) THEN
    new_pathway := 'explore';
  ELSIF avg_watch >= 40 THEN
    new_pathway := 'grow';
  ELSE
    new_pathway := 'support';
  END IF;

  -- Get current pathway
  SELECT pathway INTO old_pathway FROM students WHERE id = NEW.student_id;

  -- Update if changed
  IF old_pathway IS DISTINCT FROM new_pathway THEN
    UPDATE students SET pathway = new_pathway WHERE id = NEW.student_id;
    INSERT INTO pathway_history (student_id, old_pathway, new_pathway, reason, confidence)
    VALUES (NEW.student_id, old_pathway, new_pathway,
      'Auto-updated based on recent watch behaviour', ROUND(avg_watch)::INTEGER);
  END IF;

  -- Update progress %
  UPDATE students SET
    progress_pct = LEAST(100, ROUND((
      SELECT COUNT(DISTINCT video_id)::FLOAT /
             GREATEST(1, COUNT(DISTINCT video_id) OVER () + 3)
             * 100
      FROM watch_events
      WHERE student_id = NEW.student_id AND watch_pct >= 50
    ))),
    explorer_points = explorer_points + CASE WHEN NEW.check_in_correct THEN 10 ELSE 5 END
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_update_pathway ON watch_events;
CREATE TRIGGER trg_update_pathway
  AFTER INSERT ON watch_events
  FOR EACH ROW
  EXECUTE FUNCTION update_student_pathway();
