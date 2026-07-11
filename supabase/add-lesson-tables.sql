-- ============================================================
-- Lesson content ordering + adaptive activities
-- Run this in the Supabase SQL editor.
-- ============================================================

-- 1. Ordered sequence of videos and quizzes within a lesson (topic)
create table if not exists public.lesson_items (
  id          text primary key,
  lesson_id   text not null references public.topics(id) on delete cascade,
  item_type   text not null check (item_type in ('video', 'quiz')),
  item_id     text not null,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_lesson_items_lesson
  on public.lesson_items(lesson_id, order_index);

-- 2. Post-lesson adaptive activities (admin-built, block-based)
--    Each lesson has up to one activity per difficulty tier.
create table if not exists public.activities (
  id          text primary key,
  lesson_id   text not null references public.topics(id) on delete cascade,
  title       text not null,
  difficulty  text not null check (difficulty in ('foundation', 'core', 'advanced')),
  -- JSONB array of blocks: [{id, type, ...config}]
  -- Block types: 'q_and_a' | 'writing' | 'research' | 'drawing_canvas'
  blocks      jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  unique (lesson_id, difficulty)
);

create index if not exists idx_activities_lesson
  on public.activities(lesson_id);

-- 3. Student work on activities (auto-saved, teacher-observable)
create table if not exists public.student_activity_responses (
  id             text primary key,
  activity_id    text not null references public.activities(id) on delete cascade,
  student_id     text not null references public.users(id) on delete cascade,
  class_id       text not null references public.classes(id) on delete cascade,
  -- JSONB array: [{blockId, type, content}]
  responses      jsonb not null default '[]',
  submitted_at   timestamptz,
  last_edited_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (activity_id, student_id, class_id)
);

create index if not exists idx_responses_activity
  on public.student_activity_responses(activity_id);
create index if not exists idx_responses_student
  on public.student_activity_responses(student_id, class_id);
