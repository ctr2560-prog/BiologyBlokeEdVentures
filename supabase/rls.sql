-- BioBloke Edventures — Row Level Security policies
-- Run AFTER schema.sql.

-- ============================================================
-- Enable RLS on every table
-- ============================================================
alter table public.schools          enable row level security;
alter table public.users            enable row level security;
alter table public.classes          enable row level security;
alter table public.class_students   enable row level security;
alter table public.units            enable row level security;
alter table public.topics           enable row level security;
alter table public.videos           enable row level security;
alter table public.resources        enable row level security;
alter table public.quizzes          enable row level security;
alter table public.questions        enable row level security;
alter table public.assignments      enable row level security;
alter table public.assignment_topics enable row level security;
alter table public.student_progress enable row level security;
alter table public.analytics_events enable row level security;
alter table public.adaptive_tasks   enable row level security;

-- ============================================================
-- Helper functions (security definer so they can read users)
-- ============================================================

create or replace function auth.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid() and role = 'admin'
  )
$$;

create or replace function auth.is_teacher()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid() and role = 'teacher'
  )
$$;

-- Returns the current user's public.users.id (for teachers/admins).
create or replace function auth.my_user_id()
returns text language sql stable security definer as $$
  select id from public.users where auth_id = auth.uid()
$$;

-- Returns the student_id stored in anonymous JWT metadata.
create or replace function auth.my_student_id()
returns text language sql stable as $$
  select nullif(auth.jwt() -> 'user_metadata' ->> 'student_id', '')
$$;

-- Returns the class_id stored in anonymous JWT metadata.
create or replace function auth.my_class_id()
returns text language sql stable as $$
  select nullif(auth.jwt() -> 'user_metadata' ->> 'class_id', '')
$$;

-- ============================================================
-- schools
-- ============================================================
create policy "Admin: full access to schools"
  on public.schools for all
  using (auth.is_admin());

create policy "Teachers: read own school"
  on public.schools for select
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.school_id = schools.id
    )
  );

-- ============================================================
-- users
-- ============================================================
create policy "Admin: full access to users"
  on public.users for all
  using (auth.is_admin());

create policy "Teachers: read users in own school"
  on public.users for select
  using (
    auth.is_teacher() and (
      school_id = (select school_id from public.users where auth_id = auth.uid())
    )
  );

create policy "Students: read own user record"
  on public.users for select
  using (id = auth.my_student_id());

-- ============================================================
-- classes
-- ============================================================
create policy "Admin: full access to classes"
  on public.classes for all
  using (auth.is_admin());

create policy "Teachers: CRUD own classes"
  on public.classes for all
  using (teacher_id = auth.my_user_id());

create policy "Students: read enrolled class"
  on public.classes for select
  using (id = auth.my_class_id());

-- ============================================================
-- class_students
-- ============================================================
create policy "Admin: full access to class_students"
  on public.class_students for all
  using (auth.is_admin());

create policy "Teachers: manage enrolments for own classes"
  on public.class_students for all
  using (
    exists (
      select 1 from public.classes
      where classes.id = class_students.class_id
        and classes.teacher_id = auth.my_user_id()
    )
  );

create policy "Students: read own enrolment"
  on public.class_students for select
  using (student_id = auth.my_student_id());

-- ============================================================
-- units / topics / videos / resources / quizzes / questions / adaptive_tasks
-- Content is readable by anyone authenticated; only admins write.
-- ============================================================

-- units
create policy "Authenticated read: units"
  on public.units for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: units"
  on public.units for all
  using (auth.is_admin());

-- topics
create policy "Authenticated read: topics"
  on public.topics for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: topics"
  on public.topics for all
  using (auth.is_admin());

-- videos
create policy "Authenticated read: videos"
  on public.videos for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: videos"
  on public.videos for all
  using (auth.is_admin());

-- resources
create policy "Authenticated read: resources"
  on public.resources for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: resources"
  on public.resources for all
  using (auth.is_admin());

-- quizzes
create policy "Authenticated read: quizzes"
  on public.quizzes for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: quizzes"
  on public.quizzes for all
  using (auth.is_admin());

-- questions
create policy "Authenticated read: questions"
  on public.questions for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: questions"
  on public.questions for all
  using (auth.is_admin());

-- adaptive_tasks
create policy "Authenticated read: adaptive_tasks"
  on public.adaptive_tasks for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "Admin write: adaptive_tasks"
  on public.adaptive_tasks for all
  using (auth.is_admin());

-- ============================================================
-- assignments
-- ============================================================
create policy "Admin: full access to assignments"
  on public.assignments for all
  using (auth.is_admin());

create policy "Teachers: manage assignments for own classes"
  on public.assignments for all
  using (
    exists (
      select 1 from public.classes
      where classes.id = assignments.class_id
        and classes.teacher_id = auth.my_user_id()
    )
  );

create policy "Students: read assignments for enrolled class"
  on public.assignments for select
  using (class_id = auth.my_class_id());

-- assignment_topics
create policy "Admin: full access to assignment_topics"
  on public.assignment_topics for all
  using (auth.is_admin());

create policy "Teachers: manage assignment_topics for own assignments"
  on public.assignment_topics for all
  using (
    exists (
      select 1 from public.assignments
        join public.classes on classes.id = assignments.class_id
      where assignments.id = assignment_topics.assignment_id
        and classes.teacher_id = auth.my_user_id()
    )
  );

create policy "Students: read assignment_topics for enrolled class"
  on public.assignment_topics for select
  using (
    exists (
      select 1 from public.assignments
      where assignments.id = assignment_topics.assignment_id
        and assignments.class_id = auth.my_class_id()
    )
  );

-- ============================================================
-- student_progress
-- ============================================================
create policy "Admin: full access to student_progress"
  on public.student_progress for all
  using (auth.is_admin());

create policy "Teachers: read progress for students in own classes"
  on public.student_progress for select
  using (
    exists (
      select 1 from public.classes
      where classes.id = student_progress.class_id
        and classes.teacher_id = auth.my_user_id()
    )
  );

create policy "Students: read/write own progress"
  on public.student_progress for all
  using (student_id = auth.my_student_id());

-- ============================================================
-- analytics_events
-- ============================================================
create policy "Admin: full access to analytics_events"
  on public.analytics_events for all
  using (auth.is_admin());

create policy "Teachers: read analytics for own classes"
  on public.analytics_events for select
  using (
    class_id in (
      select id from public.classes where teacher_id = auth.my_user_id()
    )
  );

create policy "Students: insert own events"
  on public.analytics_events for insert
  with check (user_id = auth.my_student_id());
