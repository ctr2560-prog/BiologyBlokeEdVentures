"use client";
/*
 * PlatformTabs, Atomi-style tabbed feature section. Three tabs (Teachers /
 * Students / Schools); switching a tab swaps an animated preview panel that
 * mocks the relevant portal using the app's real design language.
 * Icons are SVG (lucide-react), no emojis.
 */
import { useState } from "react";
import { Badge } from "@/components/ui/primitives";
import {
  Presentation,
  GraduationCap,
  Building2,
  Rocket,
  Sprout,
  LifeBuoy,
  Film,
  PawPrint,
  Fish,
  Award,
  Check,
  type LucideIcon,
} from "lucide-react";

type TabId = "teachers" | "students" | "schools";

const tabs: {
  id: TabId;
  label: string;
  Icon: LucideIcon;
  heading: string;
  blurb: string;
  points: string[];
}[] = [
  {
    id: "teachers",
    label: "Teachers",
    Icon: Presentation,
    heading: "See exactly who needs support, and who's ready to fly.",
    blurb:
      "Assign a unit in seconds, then watch live class insights update as students learn.",
    points: [
      "Assign units & reels to any class",
      "Live completion, quiz & engagement data",
      "Auto-flagged support & extension students",
    ],
  },
  {
    id: "students",
    label: "Students",
    Icon: GraduationCap,
    heading: "Short wildlife reels that turn into a personal Edventure.",
    blurb:
      "Watch at your own pace, take quick quizzes, and get a mission matched to you.",
    points: [
      "Cinematic short-form reels",
      "Adaptive missions that fit each learner",
      "Explorer points & conservation badges",
    ],
  },
  {
    id: "schools",
    label: "Schools",
    Icon: Building2,
    heading: "One platform for your whole conservation curriculum.",
    blurb:
      "Manage every unit, reel and class, with platform-wide analytics for leaders.",
    points: [
      "Author units, reels, resources & quizzes",
      "Whole-school engagement analytics",
      "Curriculum-aligned for Stage 3–5",
    ],
  },
];

export function PlatformTabs() {
  const [active, setActive] = useState<TabId>("teachers");
  const tab = tabs.find((t) => t.id === active)!;

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              active === t.id
                ? "bg-forest-700 text-cream shadow-soft"
                : "bg-white text-charcoal-soft ring-1 ring-sand hover:bg-forest-50"
            }`}
          >
            <t.Icon className="h-4 w-4" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content, re-mounts on tab change to animate in */}
      <div key={active} className="panel-in grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <h3 className="display text-2xl font-bold leading-tight text-forest-900 md:text-4xl">
            {tab.heading}
          </h3>
          <p className="mt-3 max-w-md text-lg text-charcoal-soft">{tab.blurb}</p>
          <ul className="mt-5 space-y-3">
            {tab.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-charcoal">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                  <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preview panel */}
        <div className="relative">
          {active === "teachers" && <TeacherPreview />}
          {active === "students" && <StudentPreview />}
          {active === "schools" && <SchoolPreview />}
        </div>
      </div>
    </div>
  );
}

function PanelFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-hero ring-1 ring-black/5">
      <div className="flex items-center gap-2 border-b border-sand px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-clay-400" />
        <span className="h-3 w-3 rounded-full bg-gold-400" />
        <span className="h-3 w-3 rounded-full bg-forest-400" />
        <span className="ml-2 text-xs font-semibold text-charcoal-soft">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TeacherPreview() {
  const rows: { n: string; c: number; label: string; Icon: LucideIcon; tone: "mist" | "forest" | "clay" }[] = [
    { n: "Aria M.", c: 97, label: "Extension", Icon: Rocket, tone: "mist" },
    { n: "Ben T.", c: 82, label: "Core", Icon: Sprout, tone: "forest" },
    { n: "Chloe R.", c: 42, label: "Support", Icon: LifeBuoy, tone: "clay" },
  ];
  return (
    <PanelFrame title="Class Insights · 5J Science Explorers">
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { l: "Avg completion", v: "73%" },
          { l: "Avg quiz", v: "69%" },
          { l: "Need support", v: "1" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-cream/70 p-3">
            <p className="display text-xl font-bold text-forest-900">{s.v}</p>
            <p className="text-[0.65rem] text-charcoal-soft">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.n} className="flex items-center gap-3 rounded-2xl bg-cream/50 px-3 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-forest-100 text-xs font-bold text-forest-800">
              {r.n[0]}
            </span>
            <span className="flex-1 text-sm font-semibold text-forest-900">{r.n}</span>
            <span className="text-xs text-charcoal-soft">{r.c}%</span>
            <Badge tone={r.tone}>
              <r.Icon className="h-3 w-3" aria-hidden />
              {r.label}
            </Badge>
          </div>
        ))}
      </div>
    </PanelFrame>
  );
}

function StudentPreview() {
  const badges: LucideIcon[] = [PawPrint, Fish, Award];
  return (
    <div className="mx-auto flex max-w-[300px] items-end gap-3">
      {/* phone reel */}
      <div className="relative aspect-[9/16] w-44 shrink-0 overflow-hidden rounded-[1.5rem] bg-forest-950 shadow-hero ring-1 ring-black/10">
        <video className="h-full w-full object-cover" autoPlay muted loop playsInline poster="/reel-following-poster.jpg" preload="metadata" aria-hidden>
          <source src="/reel-following.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-forest-950/80 to-transparent" />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[0.6rem] font-semibold text-cream">
          <Film className="h-3 w-3" aria-hidden />
          Great Apes reel
        </span>
      </div>
      {/* points + badges */}
      <div className="space-y-2">
        <div className="rounded-2xl bg-white p-3 shadow-lift ring-1 ring-black/5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-charcoal-soft">Explorer points</p>
          <p className="display text-2xl font-bold text-forest-700">285</p>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white p-3 shadow-lift ring-1 ring-black/5">
          {badges.map((Icon, i) => (
            <span key={i} className="grid h-8 w-8 place-items-center rounded-full bg-forest-50">
              <Icon className="h-4 w-4 text-forest-700" aria-hidden />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SchoolPreview() {
  const bars = [
    { l: "Survival", v: 92 },
    { l: "Wild Systems", v: 64 },
    { l: "Frontlines", v: 48 },
  ];
  return (
    <PanelFrame title="Platform Analytics">
      <div className="mb-3 grid grid-cols-4 gap-2">
        {[
          { l: "Schools", v: "3" },
          { l: "Students", v: "9" },
          { l: "Reels", v: "8" },
          { l: "Avg quiz", v: "74%" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-cream/70 p-2 text-center">
            <p className="display text-lg font-bold text-forest-900">{s.v}</p>
            <p className="text-[0.6rem] text-charcoal-soft">{s.l}</p>
          </div>
        ))}
      </div>
      <p className="mb-2 text-xs font-semibold text-charcoal-soft">Watch time by unit</p>
      <div className="space-y-2">
        {bars.map((b, i) => (
          <div key={b.l} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-xs text-charcoal-soft">{b.l}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-charcoal/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${b.v}%`, background: ["#2d6a4f", "#40916c", "#d4a373"][i] }}
              />
            </div>
          </div>
        ))}
      </div>
    </PanelFrame>
  );
}
