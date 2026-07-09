-- BioBloke Edventures — Supabase schema
-- Run this in the Supabase SQL editor (or as a migration) in order.

-- ============================================================
-- Schools
-- ============================================================
create table if not exists public.schools (
  id                  text primary key,
  name                text not null,
  location            text not null default '',
  active              boolean not null default true,
  subscription_status text not null default 'trial'
                        check (subscription_status in ('trial', 'active', 'lapsed')),
  last_active         date,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- Users  (admins, teachers, students)
-- auth_id links teachers/admins to auth.users; null for students.
-- Students have no PII — name is their animal alias only.
-- ============================================================
create table if not exists public.users (
  id          text primary key,
  auth_id     uuid unique,               -- Supabase auth.users.id (null for students)
  name        text not null,
  email       text not null default '',
  role        text not null check (role in ('admin', 'teacher', 'student')),
  school_id   text references public.schools(id) on delete set null,
  animal_id   text,                      -- students only
  avatar_url  text not null default '',
  created_at  date not null default current_date
);

create index if not exists idx_users_school on public.users(school_id);
create index if not exists idx_users_role   on public.users(role);

-- ============================================================
-- Classes
-- ============================================================
create table if not exists public.classes (
  id          text primary key,
  name        text not null,
  year_group  text not null,
  teacher_id  text not null references public.users(id) on delete restrict,
  school_id   text not null references public.schools(id) on delete cascade,
  class_code  text not null unique,
  created_at  timestamptz not null default now()
);

create index if not exists idx_classes_teacher on public.classes(teacher_id);
create index if not exists idx_classes_school  on public.classes(school_id);

-- ============================================================
-- Class enrolments (many-to-many: classes ↔ students)
-- ============================================================
create table if not exists public.class_students (
  class_id   text not null references public.classes(id) on delete cascade,
  student_id text not null references public.users(id) on delete cascade,
  primary key (class_id, student_id)
);

create index if not exists idx_class_students_student on public.class_students(student_id);

-- ============================================================
-- Units
-- ============================================================
create table if not exists public.units (
  id               text primary key,
  title            text not null,
  stage            text not null,
  year_groups      text[] not null default '{}',
  description      text not null default '',
  duration_lessons integer not null default 1,
  outcomes         text[] not null default '{}',
  cover_image      text not null default '',
  published        boolean not null default false,
  created_at       date not null default current_date
);

-- ============================================================
-- Topics
-- ============================================================
create table if not exists public.topics (
  id              text primary key,
  unit_id         text not null references public.units(id) on delete cascade,
  title           text not null,
  description     text not null default '',
  animal_focus    text[] not null default '{}',
  ecosystem_focus text[] not null default '{}',
  difficulty      text not null check (difficulty in ('foundation', 'core', 'advanced'))
);

create index if not exists idx_topics_unit on public.topics(unit_id);

-- ============================================================
-- Videos
-- ============================================================
create table if not exists public.videos (
  id                text primary key,
  title             text not null,
  description       text not null default '',
  topic_id          text not null references public.topics(id) on delete restrict,
  unit_id           text not null references public.units(id) on delete restrict,
  video_url         text not null default '',
  thumbnail_url     text not null default '',
  duration_seconds  integer not null default 0,
  tags              text[] not null default '{}',
  stage             text not null,
  year_groups       text[] not null default '{}',
  transcript        text not null default '',
  learning_intent   text not null default '',
  success_criteria  text[] not null default '{}',
  published         boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_videos_topic on public.videos(topic_id);
create index if not exists idx_videos_unit  on public.videos(unit_id);

-- ============================================================
-- Resources
-- ============================================================
create table if not exists public.resources (
  id            text primary key,
  title         text not null,
  type          text not null,
  file_url      text not null default '#',
  topic_id      text not null references public.topics(id) on delete restrict,
  unit_id       text not null references public.units(id) on delete restrict,
  stage         text not null,
  difficulty    text not null check (difficulty in ('foundation', 'core', 'advanced')),
  tags          text[] not null default '{}',
  teacher_notes text,
  published     boolean not null default false,
  downloads     integer not null default 0
);

create index if not exists idx_resources_topic on public.resources(topic_id);

-- ============================================================
-- Quizzes & Questions
-- ============================================================
create table if not exists public.quizzes (
  id       text primary key,
  title    text not null,
  topic_id text not null references public.topics(id) on delete cascade
);

create index if not exists idx_quizzes_topic on public.quizzes(topic_id);

create table if not exists public.questions (
  id             text primary key,
  quiz_id        text not null references public.quizzes(id) on delete cascade,
  question_text  text not null,
  type           text not null check (type in ('multipleChoice', 'shortResponse', 'trueFalse')),
  options        text[] not null default '{}',
  correct_answer text not null,
  explanation    text not null default '',
  difficulty     text not null check (difficulty in ('foundation', 'core', 'advanced')),
  linked_concept text not null default '',
  sort_order     integer not null default 0
);

create index if not exists idx_questions_quiz on public.questions(quiz_id);

-- ============================================================
-- Assignments
-- ============================================================
create table if not exists public.assignments (
  id                      text primary key,
  class_id                text not null references public.classes(id) on delete cascade,
  unit_id                 text not null references public.units(id) on delete restrict,
  due_date                date,
  adaptive_tasks_enabled  boolean not null default true,
  explorer_points_enabled boolean not null default true,
  delivery_mode           text not null default 'student-led'
                            check (delivery_mode in ('student-led', 'teacher-led')),
  assigned_at             date not null default current_date
);

create index if not exists idx_assignments_class on public.assignments(class_id);

create table if not exists public.assignment_topics (
  assignment_id text not null references public.assignments(id) on delete cascade,
  topic_id      text not null references public.topics(id) on delete cascade,
  primary key (assignment_id, topic_id)
);

-- ============================================================
-- Student Progress
-- ============================================================
create table if not exists public.student_progress (
  id                           text primary key,
  student_id                   text not null references public.users(id) on delete cascade,
  class_id                     text not null references public.classes(id) on delete cascade,
  unit_id                      text not null references public.units(id) on delete restrict,
  topic_id                     text not null references public.topics(id) on delete restrict,
  video_id                     text not null references public.videos(id) on delete restrict,
  watch_time_seconds           integer not null default 0,
  video_completion_percentage  numeric(5,2) not null default 0,
  replay_count                 integer not null default 0,
  skipped                      boolean not null default false,
  clicked_curious              boolean not null default false,
  clicked_help                 boolean not null default false,
  quiz_score                   numeric(5,2),
  quiz_attempts                integer not null default 0,
  worksheet_completed          boolean not null default false,
  adaptive_focus_area          text not null default '',
  engagement_level             text check (engagement_level in ('low', 'medium', 'high')),
  recommended_task_type        text check (recommended_task_type in ('support', 'core', 'extension', 'challenge')),
  last_active                  timestamptz not null default now()
);

create index if not exists idx_progress_student on public.student_progress(student_id);
create index if not exists idx_progress_class   on public.student_progress(class_id);
create index if not exists idx_progress_video   on public.student_progress(video_id);

-- ============================================================
-- Analytics Events
-- ============================================================
create table if not exists public.analytics_events (
  id         text primary key,
  user_id    text not null,
  role       text not null,
  event_type text not null,
  video_id   text,
  topic_id   text,
  unit_id    text,
  class_id   text,
  timestamp  timestamptz not null default now(),
  metadata   jsonb
);

create index if not exists idx_analytics_user  on public.analytics_events(user_id);
create index if not exists idx_analytics_class on public.analytics_events(class_id);
create index if not exists idx_analytics_ts    on public.analytics_events(timestamp desc);

-- ============================================================
-- Adaptive Tasks
-- ============================================================
create table if not exists public.adaptive_tasks (
  id                       text primary key,
  title                    text not null,
  type                     text not null check (type in ('support', 'core', 'extension', 'challenge')),
  topic_id                 text not null references public.topics(id) on delete cascade,
  description              text not null default '',
  instructions             text not null default '',
  linked_resource_id       text references public.resources(id) on delete set null,
  trigger_condition        text not null default '',
  estimated_time_minutes   integer not null default 10
);
