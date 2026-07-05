# BioBloke Edventures

An adaptive conservation-education platform for schools by **The Biology Bloke**.
Short-form wildlife reels → interactive quizzes → personalised adaptive tasks →
class & platform analytics. Premium, nature-based UI inspired by the WWF Together app.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4**. All data
runs through a mock data layer designed to be swapped for **Firebase** with no
changes to components.

---

## 1. App structure

```
src/
  app/                      # Routes (App Router)
    page.tsx                # Landing + login (role selector, demo logins)
    layout.tsx              # Root layout + AppProvider (global store)
    admin/                  # Admin portal (dashboard, content, units, videos,
                            #   resources, quizzes, schools, teachers, students,
                            #   analytics, settings) + layout.tsx (AppShell)
    teacher/                # Teacher portal (dashboard, classes[/id], assign,
                            #   insights, reports, resources, settings)
    student/                # Student portal (home, classwork, watch/[videoId],
                            #   explore, progress, points, profile)
  components/
    layout/                 # AppShell, RoleSwitcher, navConfig, UserManagement
    cards/                  # Content cards + InsightCards + AdaptiveRecommendationPanel
    forms/                  # Admin content-authoring forms (video/resource/unit/quiz)
    media/                  # VideoPlayerMock (tracks watch signals)
    analytics/              # CSS chart components (Bar/Line/Donut)
    ui/                     # Primitives (Button, Badge, Modal, StatCard, DataTable…)
  data/                     # Sample data: content.ts, people.ts, progress.ts
  lib/
    store.tsx               # React context: current user / role switching
    dataService.ts          # THE data boundary — reads/writes (Firebase-swappable)
    adaptive.ts             # generateAdaptiveRecommendation() engine
    analytics.ts            # Derived metrics for all dashboards
  types/index.ts            # All TypeScript interfaces
```

### Four areas + role switcher
- **Landing/login** (`/`) — nature hero, account-type selector, one-tap demo logins.
- **Admin** (`/admin`) — manage the whole ecosystem + platform analytics.
- **Teacher** (`/teacher`) — classes, assign lessons, class insights, reports.
- **Student** (`/student`) — watch reels, quizzes, adaptive tasks, explore, points.

A **Role Switcher** lives at the bottom of the sidebar in every portal — preview
Admin / Teacher / Student instantly without authentication.

---

## 2. How to run

```bash
cd ~/biology-bloke-edventures
npm install        # first time only
npm run dev        # http://localhost:3000
```

Then open the app and click **Demo Admin / Demo Teacher / Demo Student**, or use the
role switcher in the sidebar. `npm run build` produces a production build.

### Key demo flows to try
1. **Admin adds content** — Content Library → Add video/resource/unit → it appears instantly.
2. **Teacher creates a class** — My Classes → Create class → get a join code.
3. **Teacher assigns a lesson** — Assign Lessons → preview a unit → assign to class(es).
4. **Student completes a lesson** — Class Work → open a reel → watch (tracked) → quiz →
   reflect → receive an adaptive task + explorer points.
5. **Teacher views insights** — Class Insights → per-student completion, quiz, adaptive
   focus & recommendation. Click a student for their adaptive panel.
6. **Admin analytics** — Analytics → platform watch time, engagement, content performance
   (click a reel row for a drill-down).

---

## 3. Where the data model lives

- **Types:** `src/types/index.ts` — `User, School, ClassGroup, Unit, Topic, Video,
  Resource, Quiz, Question, StudentProgress, AdaptiveTask, AnalyticsEvent`, etc.
- **Sample data:** `src/data/{content,people,progress}.ts` — 3 units, 15 topics,
  7 reels, 7 resources, 3 quizzes, 3 schools, 4 classes, 9 students with progress.
- **Access layer:** `src/lib/dataService.ts` — every read/write goes through here
  (`getUnits`, `getClassesByTeacher`, `getProgressByClass`, `createVideo`,
  `assignLessonToClass`, …). Components never import raw data directly.
- **Adaptive engine:** `src/lib/adaptive.ts` — `generateAdaptiveRecommendation()` takes
  watch %, quiz score, replays, curiosity/help clicks and returns engagement level,
  focus area, recommended task type + message. Pure and unit-testable.

---

## 4. Connecting Firebase later

The mock layer mirrors Firestore collections: `users, schools, classes, units, topics,
videos, resources, quizzes, studentProgress, adaptiveTasks, analyticsEvents`.

To go live, replace the bodies in **`src/lib/dataService.ts`** only — signatures stay
the same:

```ts
export async function getUnits() {
  const snap = await getDocs(collection(db, "units"));
  return snap.docs.map(d => d.data() as Unit);
}
```

- **Auth:** swap the demo `loginAs` in `src/lib/store.tsx` for Firebase Auth sessions;
  store `role` as a custom claim.
- **Security rules (role-based access):** admin = full; teacher = only classes where
  `teacherId == request.auth.uid` and their students; student = only their own
  `studentProgress`. The service functions already scope by `teacherId/studentId/classId`,
  so rules map straight on. (See comments in `dataService.ts` and `/admin/settings`.)
- **Storage:** the resource "file upload" and video URL fields are ready for Firebase
  Storage download URLs.
- **Analytics:** `AnalyticsEvent` records are ready to write to an `analyticsEvents`
  collection or export to BigQuery.

### Privacy by design
Student records store a display name + class linkage only — no unnecessary PII.
Analytics measure learning engagement, not surveillance.

---

## 5. Suggested next features
1. **Real auth + Firestore** — wire `dataService.ts` and `store.tsx` to Firebase.
2. **Real video playback** — replace `VideoPlayerMock` with a player using real
   watch-progress events (the tracked-signal shape is already correct).
3. **School Admin role** — the data model already anticipates school-level accounts.
4. **Adaptive task completion loop** — let students submit tasks and feed results back
   into the next recommendation.
5. **Teacher-authored quizzes** and drag-and-drop unit builder.
6. **Notifications & due-date reminders**, plus exportable PDF reports (Reports page
   is print-ready today).
7. **BioBloke Jr** (ages 0–5) as a second themed experience.

---

_The Biology Bloke — "The solution to the global conservation crisis is the development
of continuous learning."_
