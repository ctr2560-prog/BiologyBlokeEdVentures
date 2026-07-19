@AGENTS.md

# Edventra — project brief

Adaptive, teacher-led / student-driven learning platform built on short-form wildlife video "reels" (TikTok-style feed), adaptive quizzes, and adaptive worksheets. Branded **Edventra** ("by The Biology Bloke") — this repo is still named `BiologyBlokeEdVentures` from before the rebrand.

**Live:** https://www.edventra.com.au (Vercel project `biology-bloke-ed-ventures`, also at `biology-bloke-ed-ventures.vercel.app`). **Every push to `main` auto-deploys straight to production** — there is no staging environment and no CI gate beyond Vercel's own build. Treat `main` accordingly: run `npx tsc --noEmit` after edits, and run a full `npm run build` before pushing anything that touches routes or the data layer, since Vercel's build runs ESLint too (stricter than `next dev`).

**Stack:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind v4 + Supabase (Postgres/Auth/RLS) + Mux (video).

## Environment & secrets

All secrets live in `.env.local` (gitignored — never commit it) and are mirrored in Vercel's project env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`. **This repo is public on GitHub — never put credentials, connection strings, or keys in this file or any committed file.**

Database access for direct SQL/migrations: no `psql` on PATH in this environment — use `/opt/homebrew/opt/libpq/bin/psql` (Homebrew's). Direct DB host DNS-fails; use the Supabase IPv4 pooler host instead. Connection details are not written here — ask the user or check prior session memory.

## Data model gotchas

- **`lesson_items`** is the current lesson-sequence table (video/quiz/activity, ordered). A legacy model (`videos.topic_id`, one quiz per topic) still exists in parts of the codebase — if something reads as empty/zero, check whether the UI is reading the legacy column instead of `lesson_items`.
- **Quiz scores** live in `quiz_results` (server-graded), not the legacy `student_progress.quiz_score` column.
- **`quiz_results.details`** (jsonb) holds per-question answer/correct/correctAnswer for the teacher-facing breakdown — only populated for quiz attempts submitted after it was added; older rows are blank by design (no backfill).
- **Topic tags**: `videos.tags` and `quizzes.tags` (both `text[]`) drive "topic strengths/gaps" analytics. A quiz's own tags take priority; if empty, it falls back to the tags of the videos in its lesson. Editing tags is fully retroactive on next page load — no reprocessing needed.
- **`classes.silent_mode` / `classes.headphone_mode`** — teacher-set, mutually exclusive classroom audio modes, read by students client-side via `/api/student/audio-policy`. There is no per-student audio override.

## Branding

Logo files in `public/`: `edventra-tagline-v2.png` (home hero only, with "by The Biology Bloke"), `edventra-white-v2.png` (everywhere else — sidebar, login, etc.), `edventra-symbol.png` (the mark alone — used as a CSS mask for the animated loading screen and composited into the favicon at `src/app/icon.png`). All were trimmed of transparent padding from the original 500×500 source exports — if new logo exports arrive, trim them the same way before using, or spacing will look broken.

Loading UI: `src/components/ui/BrandLoader.tsx` exports `BrandLoader` (the animated drawn-on symbol) and `FullPageLoader` (full-screen brand-green loading screen) — used as the default loading state almost everywhere in the app.

Colour theme: Tailwind v4 `@theme` block in `src/app/globals.css`, eucalyptus-green + soft-off-white palette (`forest-*`, `cream`, `sand`, `clay-*`, `gold-*`, `mist-*`, `charcoal*`).

## Analytics conventions (Insights / Reports / dashboards)

- "Need support" = student average quiz score **< 50%**; "Ready for extension" = **> 90%**. Students with zero quiz attempts are never flagged.
- "Topic strengths" = top 3 highest-scoring tags (floored ≥50%); "Topic gaps" = any tag averaging <50%. Grouped by tag (quiz's own tags, else lesson's video tags), not by lesson name.
- "Avg watch time" means **per student** (sum each student's watch time, average across students) — use the shared `avgWatchPerStudent()` helper in `src/lib/analytics.ts` rather than averaging raw per-view rows, which undercounts.
- Video/lesson "Watched" % is an average of each video's own completion ratio, not total-watched ÷ total-length.

## Test accounts

Admin access is restricted to one specific account (not available to automated sessions) — admin-only pages can't be verified end-to-end without the human. A demo teacher account and a demo class (with a handful of aliased student logins) exist for testing the student/teacher flows; ask the user for current credentials if needed, or check prior session memory.
