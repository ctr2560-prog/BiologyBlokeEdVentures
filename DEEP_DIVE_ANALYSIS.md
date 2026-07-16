# BioBloke Edventures — Deep Dive Analysis
*Prepared overnight, 14 July 2026. Covers: platform audit, UI evaluation, cross-curriculum expansion, feature roadmap, Australian competitor landscape, pricing & valuation modelling.*

---

## 1. Executive summary

BioBloke Edventures is, at this point, a **remarkably complete vertical-slice of a modern adaptive learning platform**: three polished portals (admin / teacher / student), a genuinely differentiated adaptive engine (interest × mastery personalisation), privacy-first student identity, and an admin CMS that covers content, banners, PL, and the student Explore experience. The codebase is ~27,000 lines across 47 pages and 11 API routes, with a coherent design system throughout.

The three headline findings:

1. **The platform is ahead of its content.** The database currently holds 1 video, 0 lessons, 0 quizzes, 0 activities. Every hour of engineering from here has lower marginal value than an hour of content production. The single biggest risk to a pilot is a teacher logging in and finding a beautiful, empty library.
2. **The architecture is already ~90% subject-agnostic.** Expanding beyond science is mostly a naming/taxonomy exercise, not a rebuild (details in §4). The "interest-tag × mastery-tier" adaptive model transfers cleanly to English, HSIE, Health/PE — arguably *better* than to maths.
3. **The commercial sweet spot is $10–20/student/year for a single-subject offering**, benchmarked against Stile (~$10–20), Mathletics (~$38), and Education Perfect ($54–60 all-KLA). At NSW-pilot scale (10 schools) that's a side-income; at 100-school scale it's a $700K–$1.4M ARR business worth roughly $3.5–7M under K-12 content multiples.

---

## 2. What's working well

### Product & pedagogy
- **The adaptive loop is real, not cosmetic.** Watch signals (completion, replays, curiosity clicks, skips) × video tags → interest profile; quiz scores → mastery tier; both feed worksheet *selection* (which 3–4 activities) and block-level *filtering* (which tasks within them). Very few platforms at any price point do two-axis personalisation (interest AND ability). Stile doesn't. Education Perfect doesn't. This is the moat — protect and market it.
- **The TikTok-style lesson feed** is genuinely age-appropriate for Stage 3–5 and unlike anything in the Australian market. Story progress bar, full-screen steps, inline personalised worksheet with a "building your Edventure" moment — this will demo extremely well.
- **Privacy-by-design student identity** (animal aliases + PINs, no student PII in-platform, mapping lives on printed cards) is a *sales feature* for NSW DoE schools, where privacy compliance (ISP/PIPEDA-equivalent NSW requirements) kills many procurement conversations. Lead with it.
- **Teacher-led + student-led duality.** Present mode (slides → watch → hands-up react → quiz → worksheet recommendations) means the product works in a 1-device classroom AND a 1:1 classroom. Competitors are almost all 1:1-only.
- **Nearpod-style slides** via Canva/Google embed was the right call — zero conversion infrastructure, always up to date.

### Engineering
- **Consistent design system** — one palette (forest/cream/sand/clay/gold/mist), consistent radii (rounded-2xl/3xl), consistent card/badge/pill primitives. The app looks like one person with taste built it, which is rarer than it sounds.
- **Security posture is fundamentally sound**: middleware-enforced admin routes, `app_metadata`-based role checks (unforgeable client-side), RLS on every table, service-role verification for PINs, students unable to read other students' rows.
- **Sensible data model** — the lesson_items sequencing model, unit_lessons many-to-many, and activities-as-block-banks are flexible enough to survive the cross-curriculum expansion without schema surgery.
- Clean production builds, TypeScript throughout, no runtime framework hacks.

---

## 3. What needs improvement

### 3.1 Real bugs / gaps found in this audit

| Severity | Issue | Detail |
|---|---|---|
| **High** | **Quiz answers ship to the browser** | Quizzes are fetched client-side including `correctAnswer` and `explanation`. Any student who opens DevTools → Network can read every answer before submitting. Fix: server-side grading endpoint (accept answers, return score), strip `correctAnswer` from student-facing fetches. |
| **High** | **Quiz scores never persist** | The lesson player keeps quiz scores in React state only; `student_progress.quiz_score` stays null except via legacy flows. Teacher insights/reports aggregate `quizScore` from progress rows — so the new feed produces watch data but **no quiz analytics**. Fix: write a progress row (or a new `quiz_results` table) on quiz submit in the feed. |
| **Medium** | **Admin Settings page is decorative** | Inputs have `defaultValue` and a Save button wired to nothing. Either persist to a `site_settings` table or remove the page until it does something. |
| **Medium** | **Teacher Resources page reads an empty system** | It lists the `resources` table (0 rows, no admin UI to populate it since the resources tab became the activity builder). Either repoint it at activities/unit-docs or remove it from nav. |
| **Medium** | **PIN check is a UX gate, not a security gate** | `signInStudent` runs client-side anonymous auth + `updateUser({student_id})` — a determined student can skip the PIN via console. Acceptable for classroom threat model, but the fix (server-mints the session after PIN verification in the same endpoint) is ~1 day and worth doing before scale. |
| **Medium** | **Legacy/duplicate content paths** | `videos.topic_id`/`unit_id`, `topics.unit_id`, `adaptive_tasks` (0 rows, unused), `getQuizByTopic`, `dataService.ts`, `src/data/progress.ts` mock data, `DEMO_TEACHER_ID`/`DEMO_STUDENT_ID` fallbacks. Every legacy path is a future bug (present mode already broke on exactly this). Schedule a deletion pass. |
| **Low** | `/admin/units`, `/admin/lessons` (list), `/admin/students` still exist as routes though de-linked from nav — redirect them to `/admin/content` to avoid stale bookmarks. |
| **Low** | Lint debt: a handful of pre-existing `setState-in-effect` and unescaped-entity errors. Zero-cost to fix incrementally; blocks turning on CI lint gating. |

### 3.2 Product gaps (ranked by pilot impact)

1. **No teacher visibility of worksheet responses in-flow.** Responses save to `student_activity_responses`, and a teacher activity view exists, but there's no "marking inbox" — a single queue of submitted worksheets across classes with the ability to leave a comment/mark. This is the #1 thing teachers will ask for after a week.
2. **No content preview-as-student for admin.** You can build a lesson but can't experience the student feed without a student login. A "Preview as student" button on the lesson builder would shortcut every QA cycle.
3. **Assignment model is unit-only** (`assignments.unit_id NOT NULL`). The library says lessons are individually assignable, and they are — but only *through* a unit. True standalone-lesson assignment needs a nullable unit or a lesson_id column.
4. **No notifications/email.** Teachers don't know when students finish; you don't know when teachers book PL (you have to check the admin page). A daily digest email is the cheapest high-value add.
5. **Explorer points are shallow** — points accrue but the shop/badges/leaderboard loop is thin (`badges: BadgeDef[] = []` in content.ts). Gamification is half the retention story for Stage 3–4; either invest or de-emphasise in the UI.
6. **Anonymous-auth session fragility.** Student sessions are Supabase anonymous users; a cleared browser = new anonymous user (the PIN makes re-claim work, which is good). But orphaned anonymous auth users will accumulate — add a cleanup job.

---

## 4. Breaking the science barrier → all learning areas

**The good news: the platform has almost no science-specific architecture.** The audit found science assumptions live in exactly four shallow layers:

| Layer | Science-specific today | Change needed |
|---|---|---|
| **Branding/copy** | "BioBloke", "Edventures", wildlife hero video, conservation facts, "explorer" language | White-label config: platform name, hero media, fact-feed per subject. The `site_settings` table you already half-have is the natural home. |
| **Taxonomy** | `animal_focus`, `ecosystem_focus` on topics; animal aliases; ecosystems Explore | These are just *interest domains*. Generalise: `topics.tags`, Explore "worlds" are already DB-driven (you built that!) — a maths deployment fills them with "Money & finance", "Sport statistics", "Space & scale". Animal aliases can stay platform-wide (they're identity, not content). |
| **Content metadata** | `stage` values, video tags | Add a `subject` / `learning_area` column to units (and optionally videos). One column, filters everywhere. |
| **Adaptive model** | None — it's tag-based and subject-blind | Nothing. Interest tags work identically for "poetry vs persuasive writing" or "nutrition vs fitness". |

### Recommended expansion architecture (in order of effort)

**Option A — Subject packs inside one platform (recommended).** Add `learning_area` to units; the teacher library gains a subject filter row (like cool.org's subject pills); Explore worlds get a subject scope. One codebase, one login, one licence conversation per school. This is how Education Perfect became the category winner: land with one KLA, expand seats to others at renewal.

**Option B — Themed vertical brands (the Taronga Tracka model).** Same codebase deployed per partner/subject: "BioBloke Edventures" (science), a partner-branded instance for a zoo/museum, a "MathsBloke" skin. Your ZooSnooz/Taronga work shows you can execute partner-flavoured experiences; the banner/Explore/PL admin tooling you built this month is exactly the white-label toolkit. Higher ops cost, but partnership revenue (content co-funded by a Taronga/museum/sports body) can pay for content production — your biggest bottleneck.

**Practical sequencing:** Ship Option A's `learning_area` column now (an afternoon), keep branding science-first, and use Option B selectively when a funded partner appears. Don't rebrand away from BioBloke until a second KLA has real content — the personal-brand trust ("the Biology Bloke came to our school") is currently your strongest acquisition channel.

**Where the adaptive model shines per KLA:** English (interest tags: genres/themes → reading & writing tasks), HSIE (civics/history topics), Health/PE (sports/nutrition interests — video-first pedagogy fits perfectly), Languages (topic domains). **Where it's weakest: maths** — maths adaptivity is *prerequisite-graph* shaped (you must know fractions before algebra), not interest-shaped. Don't lead the expansion with maths; Mathletics/Maths Pathway own that fight and their model is genuinely different tech.

---

## 5. Feature audit — question, keep, add

### Functions to question (candidates to replace/eliminate)
- **`/teacher/resources` + `resources` table** — orphaned by the activity-builder evolution. Eliminate or repoint.
- **Admin Settings** — mock. Eliminate until real.
- **`adaptive_tasks` table + `src/lib/adaptive.ts` recommendation panel** — superseded by the worksheet engine; insights still calls `generateAdaptiveRecommendation`. Consolidate onto one adaptive system before they disagree in front of a teacher.
- **`/teacher/reports`** — currently a thinner duplicate of Insights. Merge into Insights with a "Download PDF" action rather than maintaining two aggregation code paths.
- **Legacy topic-based routes** (`getVideosByTopic`-driven paths, `/admin/units`, `/admin/lessons` list, `/admin/students`) — delete or redirect.
- **Explorer points shop** ("points" page promises rewards that don't exist) — either build the badge loop or reframe as a simple progress metric.
- **Dual video players** (Mux + mock) — the mock player served pre-Mux demos; once real videos exist, delete it (it currently ships in the student bundle).

### Functions to add (tiered)

**Tier 1 — before first paid pilot (each ≤1 week):**
1. Server-side quiz grading + persist quiz results (fixes the two High bugs together).
2. Teacher marking inbox for submitted worksheets (+ comment box; students see feedback in profile).
3. "Preview as student" from lesson builder.
4. Email notifications: PL booking → you; weekly class digest → teacher (Resend/Postmark, half a day).
5. Seed content: minimum viable library = 2 units × 4 lessons, each with video + quiz + 4-6 tagged activities. *This is the critical path.*

**Tier 2 — pilot-term horizon:**
6. Standalone-lesson assignment (nullable `assignments.unit_id`).
7. Live present-mode sync (Supabase Realtime: teacher advances slide/question, student devices follow — the "true Nearpod" upgrade; you already scoped it).
8. Question-level quiz analytics for teachers ("Q3 was missed by 70% of the class").
9. Student streaks + badge loop (retention).
10. `learning_area` column + subject filters (the §4 unlock).
11. CSV export (class results) — schools ask for this in week one.

**Tier 3 — scale horizon:**
12. School-level admin role (HoD sees all classes in their school) — needed the moment a second teacher at the same school signs up.
13. Curriculum-outcome tagging per lesson (NSW syllabus codes) with coverage reporting — the single biggest procurement checkbox for DoE schools.
14. AI-assisted authoring: draft quiz + activity blocks from a video transcript (transcripts are already a column). Cuts your content bottleneck dramatically.
15. Parent/carer summary links.
16. Offline-tolerant student mode (rural NSW pilot reality).

---

## 6. UI evaluation

**Overall: 8/10 for a pre-launch product.** The visual identity is distinctive and consistent; most flaws are density/scale issues, not design issues.

### Strengths
- Cohesive nature palette used *semantically* (video=forest, quiz=mist, adaptive=gold everywhere) — users learn the colour language once.
- Student surfaces are genuinely fun without being childish: the feed, animal tiles, explore worlds.
- Strong empty states with next-action CTAs in most places (library, content, present).
- Card/pill/badge system matches the cool.org benchmark you set.

### Weaknesses & fixes
1. **Admin nav is at 13 items** and scans as a flat wall. Group it: *Content* (Content, Videos, Quizzes, Resources, Explore), *Engage* (Banner, PL, Feedback), *Manage* (Schools, Users, Analytics, Settings). Sidebar section headers cost an hour.
2. **No mobile audit has happened.** The student feed is mobile-first (good) but the admin lesson builder's two-column layout and the teacher DataTables will fight on a phone. Teachers *will* check dashboards on phones. Do one pass with responsive collapse on tables (card-per-row under `sm`).
3. **Accessibility gaps:** icon-only buttons mostly have aria-labels (good), but colour-contrast on `text-charcoal-soft`/60-opacity text over cream is borderline WCAG AA; gold-on-white pills likewise. Keyboard navigation through the animal picker and feed is untested. One audit day before selling to DoE (they ask).
4. **Font-size drift** — the admin surfaces use 10px/11px labels liberally; fine for you, hard for a 55-year-old HoD on a 1366×768 school laptop. Establish 12px as the floor outside of print layouts.
5. **Loading states are inconsistent** — some pages show skeletons (dashboard), others a centered spinner, others nothing. Standardise on skeletons for list pages.
6. **The teacher dashboard is now long** (banner carousel + stats + featured + CTA + classes + support + activity + insights). Consider making Featured and Insights collapsible or moving Insights to its own emphasis. First screenful should be: banner, stats, classes.
7. **Confirm dialogs use native `confirm()`** — functional but visually jarring against the polished chrome. A styled ConfirmModal primitive would take an hour and lift perceived quality across ~8 destructive flows.

---

## 7. Competitive landscape (Australia)

| Platform | Focus | Model & price (AUD, per student/yr) | Strengths vs you | Your edge vs them |
|---|---|---|---|---|
| **Education Perfect** | All KLAs, 7–12 | ~$54–60 all-KLA school licence | Massive content library, curriculum tagging, entrenched in schools | No genuine interest-based adaptivity; content is drill-heavy; dated student UX |
| **Stile** | Science 5–10 | ~$10–20 (per-student, teacher accounts free) | Superb curriculum-aligned science content, strong teacher PL, real market share | No adaptive engine (whole-class linear); no video-first pedagogy; no teacher-led/student-led duality |
| **Mathletics (3P)** | Maths K–12 | ~$38 list (school quotes vary) | Brand, gamification depth | Different subject; its adaptivity is drill-path, not interest |
| **Atomi** | 7–12, exam-focused | Custom school pricing (personal ~$300+/yr) | Beautiful video content, HSC brand strength | Senior-only; no primary/Stage 3-4; no differentiation engine |
| **Inquisitive** | Primary science/HSIE/English | ~$3–5/student or ~$500-1500/school | Cheap, teacher-friendly primary units | Static content, no analytics/adaptivity/student portal to speak of |
| **Cool.org (ex Cool Australia)** | Cross-curricular, sustainability | Free (sponsor-funded) | Free; the browse UX you're emulating | Lesson-plan PDFs, not a platform: no student accounts, data, or adaptivity |
| **ClickView** | Video library, all subjects | School licence (~$1000s/school) | Video breadth, DoE penetration | Video *library* only — no lessons, quizzes light, no personalisation |
| **Nearpod/Kahoot (intl.)** | Delivery tools | ~$USD teacher/school plans | Live-lesson mechanics | Tools, not curriculum — you bundle both |

### Where BioBloke stands
- **Today (content-empty):** a demo, not a competitor. Nothing on this table loses a deal to an empty library.
- **At "current state built out" (the Tier-1 list + ~4 units of content):** you are credibly **"Stile's adaptivity-first challenger"** for NSW Stage 3–5 science — a real, winnable wedge because Stile's weakness (no personalisation, no video-first, no teacher-led mode) is exactly your strength, and your price can undercut EP by 70%.
- **What the market will demand that you don't have:** NSW syllabus outcome tagging (non-negotiable for procurement), a content library measured in dozens of lessons, evidence (a pilot case study with engagement data — which your analytics can already produce), SSO (DoE staff portal login eventually), and a privacy/security one-pager (you can write this today; your architecture supports it).

---

## 8. Pricing & valuation

### Recommended licensing model
- **Per-student, per-subject, per-year: $12 AUD** (positioning: "half of Mathletics, a fraction of EP, in line with Stile — but adaptive"). Band it: $15 list / $12 at >100 students / $10 at >400 students / whole-school primary cap ~$2,500.
- **Teacher accounts free, unlimited** (Stile-proven; removes friction).
- **PL as a revenue side-channel** ($300–500 per school session, or bundled free into >$2k licences as a closer) — you've already built the booking pipeline.
- **Partner-funded free tiers** (the cool.org trick): a Taronga/museum-sponsored unit distributed free is a lead-generation engine, with the sponsor paying content costs.

### Revenue scenarios (single subject, $12/student)

| Scenario | Schools | Students (avg 350 primary / 120/cohort secondary) | ARR |
|---|---|---|---|
| Pilot year | 5–10 (2 paid) | ~700 paid | **~$8K** |
| Year 2 — NSW beachhead | 30 paid | ~9,000 | **~$110K** |
| Year 3 — multi-KLA (2 subjects avg) | 100 paid | ~30,000 seats | **~$700K** |
| Scale case | 300 schools / 2.5 subjects | ~120,000 seats | **~$1.4–2M** |

Context: Australia has ~9,600 schools / ~4.1M students; NSW alone ~3,100 schools. 100 schools = ~1% national penetration — ambitious but precedented (Stile reached ~1/3 of Australian secondary schools in under a decade).

### Valuation estimate
- **Today (pre-revenue, pre-content, solo founder):** value is essentially asset + option value. Comparable pre-seed AU edtech with a working differentiated product and a founder with classroom distribution: **$250K–$750K AUD** on a SAFE-style raise. Not meaningful as a sale price; meaningful as raise leverage.
- **Multiples reality check (2025 data):** K-12 edtech trades at **~7x revenue average**, with K-12 *content* platforms often **below 5x**; premiums go to retention and recurring contracts. ([Finro Q4-2025](https://www.finrofca.com/news/edtech-multiples-q4-2025), [Finerva 2025](https://finerva.com/report/edtech-2025-valuation-multiples/), [FE International](https://www.feinternational.com/blog/edtech-business-valuation))
- **At $110K ARR (Year 2):** ~$0.4–0.8M (multiples compress at small scale).
- **At $700K ARR with >90% school retention:** **$3.5–5M AUD** (5–7x).
- **At $1.5–2M ARR, multi-subject, DoE-listed:** **$8–14M AUD**, and at that point you're a strategic acquisition target for 3P Learning, EP's PE owners, or a publisher (Cambridge/Oxford AU) rather than a financial sale.
- **The valuation lever that matters most is retention** — school renewals >90% roughly doubles the applicable multiple. Your adaptive data story ("here's the engagement report from your own students") is the renewal engine; make the teacher-facing evidence exports excellent.

### Sources
- [Education Perfect pricing](https://www.educationperfect.com/pricing/) · [Crestwood HS EP notice ($54+GST/student)](https://crestwood-h.schools.nsw.gov.au/content/dam/doe/sws/schools/c/crestwood-h/2020/orientation-day-2020/EDUCATION_PERFECT_INFO_2021.pdf) · [EdTech Impact EP review (~$60/student all-KLA)](https://edtechimpact.com/products/education-perfect/)
- [Stile pricing model](https://stileeducation.com/au/set-up-trial/) · [Stile overview](https://stileeducation.com/au/) · [Whirlpool pricing thread](https://forums.whirlpool.net.au/archive/2635660)
- [Mathletics pricing ($38/yr list)](https://home-ed.vic.edu.au/product/mathletics-2025/) · [Mathletics schools](https://www.mathletics.com/au/for-schools/) · [Atomi pricing](https://www.getatomi.com/au/pricing)
- [Finro EdTech multiples Q4 2025](https://www.finrofca.com/news/edtech-multiples-q4-2025) · [Finerva EdTech 2025 multiples](https://finerva.com/report/edtech-2025-valuation-multiples/) · [FE International EdTech valuation](https://www.feinternational.com/blog/edtech-business-valuation) · [409A K-12 vs B2B notes](https://txncapitalllc.com/blog/409a-valuation-edtech-startups/)

---

## 9. The priority list (if you only do ten things)

1. **Make 8 lessons of real content** (2 units). Nothing else matters until this exists.
2. Fix quiz answer exposure + persist quiz results server-side.
3. Teacher marking inbox for worksheets.
4. "Preview as student" button.
5. Booking/digest emails.
6. NSW syllabus outcome tags on lessons + a coverage line on the unit page.
7. Styled confirm dialogs + admin nav grouping + 12px type floor (one polish day).
8. Delete the legacy paths (resources page, mock settings, adaptive_tasks, mock data files).
9. Run one real class pilot with your own students; export the engagement data as the founding case study.
10. Write the 2-page privacy & security overview for principals (your architecture already earns it).

*Everything in this report is based on the codebase as of tonight (commit-state: post PL-bookings), the live database, and July-2026 market data. Numbers in §8 are directional estimates, not financial advice.*
