-- BioBloke Edventures — Row Level Security policies
-- Run AFTER schema.sql.

-- ============================================================
-- Enable RLS on every table
-- ============================================================
alter table public.schools           enable row level security;
alter table public.users             enable row level security;
alter table public.classes           enable row level security;
alter table public.class_students    enable row level security;
alter table public.units             enable row level security;
alter table public.topics            enable row level security;
alter table public.videos            enable row level security;
alter table public.resources         enable row level security;
alter table public.quizzes           enable row level security;
alter table public.questions         enable row level security;
alter table public.assignments       enable row level security;
alter table public.assignment_topics enable row level security;
alter table public.student_progress  enable row level security;
alter table public.analytics_events  enable row level security;
alter table public.adaptive_tasks    enable row level security;

-- ============================================================
-- Helper functions in public schema
--
-- Role/identity information is read from the JWT (app_metadata / user_metadata)
-- rather than querying public.users. This avoids infinite recursion: Supabase's
-- Postgres environment does not bypass RLS inside SECURITY DEFINER functions, so
-- any function that reads public.users from within a public.users policy would
-- recurse forever.
--
-- app_metadata is set via the Supabase admin API (set-jwt-metadata.ts) and
-- cannot be modified by the client — safe for role checks.
-- ============================================================

-- Returns true if the current JWT belongs to an admin.
create or replace function public.bb_is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'bb_role', '') = 'admin'
$$;

-- Returns true if the current JWT belongs to a teacher.
create or replace function public.bb_is_teacher()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'bb_role', '') = 'teacher'
$$;

-- Returns the current teacher/admin's public.users.id (from JWT app_metadata).
create or replace function public.bb_my_user_id()
returns text language sql stable as $$
  select auth.jwt() -> 'app_metadata' ->> 'bb_user_id'
$$;

-- Returns the current teacher/admin's school_id (from JWT app_metadata).
create or replace function public.bb_my_school_id()
returns text language sql stable as $$
  select auth.jwt() -> 'app_metadata' ->> 'bb_school_id'
$$;

-- Returns the student_id stored in anonymous JWT user_metadata.
create or replace function public.bb_my_student_id()
returns text language sql stable as $$
  select nullif(auth.jwt() -> 'user_metadata' ->> 'student_id', '')
$$;

-- Returns the class_id stored in anonymous JWT user_metadata.
create or replace function public.bb_my_class_id()
returns text language sql stable as $$
  select nullif(auth.jwt() -> 'user_metadata' ->> 'class_id', '')
$$;

-- ============================================================
-- schools
-- ============================================================
create policy "Admin: full access to schools"
  on public.schools for all
  using (public.bb_is_admin());

create policy "Teachers: read own school"
  on public.schools for select
  using (id = public.bb_my_school_id());

-- ============================================================
-- users
-- ============================================================
-- Any authenticated user (teacher or admin) can read their own row by auth_id.
-- This avoids a circular dependency: bb_is_admin() itself reads public.users,
-- so without this direct policy the admin can't read their own row on first login.
create policy "Authenticated users can read own row"
  on public.users for select
  using (auth_id = auth.uid());

create policy "Admin: full access to users"
  on public.users for all
  using (public.bb_is_admin());

create policy "Teachers: read users in own school"
  on public.users for select
  using (
    public.bb_is_teacher() and school_id = public.bb_my_school_id()
  );

create policy "Students: read own user record"
  on public.users for select
  using (id = public.bb_my_student_id());

-- ============================================================
-- classes
-- ============================================================
create policy "Admin: full access to classes"
  on public.classes for all
  using (public.bb_is_admin());

create policy "Teachers: CRUD own classes"
  on public.classes for all
  using (teacher_id = public.bb_my_user_id());

create policy "Students: read enrolled class"
  on public.classes for select
  using (id = public.bb_my_class_id());

-- ============================================================
-- class_students
-- ============================================================
create policy "Admin: full access to class_students"
  on public.class_students for all
  using (public.bb_is_admin());

create policy "Teachers: manage enrolments for own classes"
  on public.class_students for all
  using (
    exists (
      select 1 from public.classes
      where classes.id = class_students.class_id
        and classes.teacher_id = public.bb_my_user_id()
    )
  );

create policy "Students: read own enrolment"
  on public.class_students for select
  using (student_id = public.bb_my_student_id());

-- ============================================================
-- Content tables: readable by any authenticated session
-- (teachers, admins, and anonymous student sessions)
-- ============================================================

-- units
create policy "Authenticated read: units"
  on public.units for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: units"
  on public.units for all
  using (public.bb_is_admin());

-- topics
create policy "Authenticated read: topics"
  on public.topics for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: topics"
  on public.topics for all
  using (public.bb_is_admin());

-- videos
create policy "Authenticated read: videos"
  on public.videos for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: videos"
  on public.videos for all
  using (public.bb_is_admin());

-- resources
create policy "Authenticated read: resources"
  on public.resources for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: resources"
  on public.resources for all
  using (public.bb_is_admin());

-- quizzes
create policy "Authenticated read: quizzes"
  on public.quizzes for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: quizzes"
  on public.quizzes for all
  using (public.bb_is_admin());

-- questions
create policy "Authenticated read: questions"
  on public.questions for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: questions"
  on public.questions for all
  using (public.bb_is_admin());

-- adaptive_tasks
create policy "Authenticated read: adaptive_tasks"
  on public.adaptive_tasks for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: adaptive_tasks"
  on public.adaptive_tasks for all
  using (public.bb_is_admin());

-- ============================================================
-- assignments
-- ============================================================
create policy "Admin: full access to assignments"
  on public.assignments for all
  using (public.bb_is_admin());

create policy "Teachers: manage assignments for own classes"
  on public.assignments for all
  using (
    exists (
      select 1 from public.classes
      where classes.id = assignments.class_id
        and classes.teacher_id = public.bb_my_user_id()
    )
  );

create policy "Students: read assignments for enrolled class"
  on public.assignments for select
  using (class_id = public.bb_my_class_id());

-- assignment_topics
create policy "Admin: full access to assignment_topics"
  on public.assignment_topics for all
  using (public.bb_is_admin());

create policy "Teachers: manage assignment_topics for own assignments"
  on public.assignment_topics for all
  using (
    exists (
      select 1 from public.assignments
        join public.classes on classes.id = assignments.class_id
      where assignments.id = assignment_topics.assignment_id
        and classes.teacher_id = public.bb_my_user_id()
    )
  );

create policy "Students: read assignment_topics for enrolled class"
  on public.assignment_topics for select
  using (
    exists (
      select 1 from public.assignments
      where assignments.id = assignment_topics.assignment_id
        and assignments.class_id = public.bb_my_class_id()
    )
  );

-- ============================================================
-- student_progress
-- ============================================================
create policy "Admin: full access to student_progress"
  on public.student_progress for all
  using (public.bb_is_admin());

create policy "Teachers: read progress for students in own classes"
  on public.student_progress for select
  using (
    exists (
      select 1 from public.classes
      where classes.id = student_progress.class_id
        and classes.teacher_id = public.bb_my_user_id()
    )
  );

create policy "Students: read/write own progress"
  on public.student_progress for all
  using (student_id = public.bb_my_student_id());

-- ============================================================
-- analytics_events
-- ============================================================
create policy "Admin: full access to analytics_events"
  on public.analytics_events for all
  using (public.bb_is_admin());

create policy "Teachers: read analytics for own classes"
  on public.analytics_events for select
  using (
    class_id in (
      select id from public.classes where teacher_id = public.bb_my_user_id()
    )
  );

create policy "Students: insert own events"
  on public.analytics_events for insert
  with check (user_id = public.bb_my_student_id());
