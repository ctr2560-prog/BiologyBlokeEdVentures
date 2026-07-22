-- Run this in the Supabase SQL editor.
-- Lets teachers leave whole-worksheet feedback for a student's activity
-- response, and lets admins define expected keywords per activity for the
-- heuristic feedback-draft suggestion.

ALTER TABLE public.student_activity_responses
  ADD COLUMN IF NOT EXISTS teacher_feedback   text,
  ADD COLUMN IF NOT EXISTS feedback_given_at  timestamptz,
  -- Set when the student opens the lesson review page for this response.
  -- Re-sending feedback (giveActivityFeedback) clears this so it notifies again.
  ADD COLUMN IF NOT EXISTS feedback_seen_at   timestamptz;

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS feedback_keywords  text[];

-- See supabase/rls.sql for the matching "Teachers: give feedback on
-- responses in own classes" UPDATE policy.
