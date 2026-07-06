"use client";
/*
 * Landing page, cinematic, centered brand splash inspired by editorial nature
 * education sites (big bold headline over full-bleed darkened wildlife media,
 * slim top nav, scroll cue), followed by clean marketing sections and a
 * working sign-in. Login is fully functional: account-type selector,
 * email/password (visual for the MVP) and one-tap demo logins.
 */
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { roleHome, roleLabel } from "@/components/layout/navConfig";
import { Button, Modal, inputClass } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollProgress } from "@/components/ui/motion";
import { PlatformTabs } from "@/components/layout/PlatformTabs";
import {
  WhyShortForm,
  HowItWorks,
  ContentShowcase,
  FounderStory,
} from "@/components/layout/LandingSections";
import { getClasses } from "@/lib/dataService";
import {
  Globe,
  Compass,
  UserCog,
  Presentation,
  GraduationCap,
  Film,
  Check,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

const roleMeta: { role: Role; Icon: LucideIcon; blurb: string }[] = [
  { role: "admin", Icon: UserCog, blurb: "Manage the whole learning ecosystem" },
  { role: "teacher", Icon: Presentation, blurb: "Run classes & assign Edventures" },
  { role: "student", Icon: GraduationCap, blurb: "Watch, explore & earn points" },
];

const features = [
  "Curriculum-aligned units for Stage 3–5",
  "Short, high-quality wildlife reels",
  "Adaptive tasks personalised to each student",
  "Live class insights & printable reports",
  "Explorer points & badges to drive engagement",
];

export default function LandingPage() {
  const { loginAs, loginAsUser } = useApp();
  const router = useRouter();
  const [selected, setSelected] = useState<Role>("teacher");

  // Student class-code entry.
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const enter = (role: Role) => {
    loginAs(role);
    router.push(roleHome[role]);
  };

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const match = getClasses().find(
      (c) => c.classCode.toLowerCase() === code.trim().toLowerCase()
    );
    if (!match) {
      setCodeError("We couldn't find that class code. Try KOALA-5J for the demo.");
      return;
    }
    // Sign the student in as the first learner in that class (demo behaviour).
    if (match.studentIds[0]) loginAsUser(match.studentIds[0]);
    else loginAs("student");
    router.push(roleHome.student);
  };

  return (
    <div className="bg-cream">
      <ScrollProgress />
      {/* ============ Top nav ============ */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-5">
          <nav className="flex items-center gap-2">
            <a href="#signin" className="rounded-full px-4 py-2 text-sm font-semibold text-cream/90 hover:text-cream">
              Teacher login
            </a>
            <button
              onClick={() => { setCode(""); setCodeError(""); setCodeOpen(true); }}
              className="glass rounded-full px-5 py-2 text-sm font-semibold text-forest-900 shadow-soft hover:bg-cream"
            >
              Student code 
            </button>
          </nav>
        </div>
      </header>

      {/* ============ Hero, centered brand splash ============ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forest-950 text-center">
        {/* Live wildlife film */}
        <video
          className="ken-burns absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/intro-poster.jpg"
          preload="auto"
          aria-hidden
        >
          <source src="/intro-bg.mp4" type="video/mp4" />
        </video>

        {/* Cinematic darkening for legibility */}
        <div className="grain pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,26,18,0.68) 0%, rgba(9,26,18,0.5) 40%, rgba(9,26,18,0.82) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 45%, transparent 50%, rgba(5,17,11,0.8) 100%)" }} />
        </div>

        {/* Centered copy */}
        <div className="rise-in relative z-10 mx-auto max-w-4xl px-6">
          {/* Large centred Biology Bloke Edventures logo (home page only) */}
          <Image
            src="/logo-home.png"
            alt="The Biology Bloke Edventures"
            width={420}
            height={420}
            priority
            className="float-y-slow mx-auto h-44 w-auto drop-shadow-2xl md:h-60"
          />
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-cream/25 bg-forest-950/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cream backdrop-blur">
            <Globe className="h-4 w-4" aria-hidden />
            The world&apos;s first adaptive short-form media platform
          </p>
          <h1 className="display mt-5 text-4xl font-bold leading-[1.08] text-cream drop-shadow-xl md:text-5xl">
            Bringing the wild to every classroom,
            <br className="hidden sm:block" />
            and every learner to the wild.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-balance text-lg text-cream/85 md:text-xl">
            Students explore the natural world with The Biology Bloke through reels that
            adapt to each learner, turning curiosity into action across every key learning area.
          </p>
        </div>

        {/* Scroll cue */}
        <a href="#how" className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center text-cream/70 hover:text-cream">
          <span className="text-[0.65rem] font-semibold uppercase tracking-widest">Discover more</span>
          <span className="float-y-fast mt-1 text-xl"></span>
        </a>
      </section>

      <WhyShortForm />
      <HowItWorks />

      {/* ============ What you get (clean white section) ============ */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-20 md:py-28">
        <Reveal>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-600">
              Built for real classrooms
            </p>
            <h2 className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-5xl">
              Everything you need to teach through nature.
            </h2>
            <p className="mt-4 max-w-md text-lg text-charcoal-soft">
              No preparation required. Ready-to-teach units built around short,
              cinematic wildlife films, with the platform doing the personalising.
            </p>
            <ul className="mt-6 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-charcoal">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
                  </span>
                  <span className="text-base">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Portrait reel card with floating stat cards */}
          <div className="relative mx-auto w-full max-w-[320px]">
            {/* Phone-style short-form reel */}
            <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-forest-950 shadow-hero ring-1 ring-black/10">
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster="/reel-following-poster.jpg"
                preload="metadata"
                aria-label="Short-form wildlife reel: walking behind chimps in Uganda"
              >
                <source src="/reel-following.mp4" type="video/mp4" />
              </video>
              {/* subtle bottom scrim + reel label */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-forest-950/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-cream">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-cream">
                  <Film className="h-4 w-4 text-forest-700" aria-hidden />
                </span>
                <span className="text-xs font-semibold drop-shadow">A BioBloke reel · Great Apes</span>
              </div>
            </div>

            {/* Floating stat cards */}
            <div className="float-y-slow absolute -left-4 top-10 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-black/5">
              <p className="display text-3xl font-bold text-clay-500">3</p>
              <p className="text-xs font-medium text-charcoal-soft">Stages · Yr 5–10</p>
            </div>
            <div className="float-y absolute -right-5 bottom-14 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-black/5">
              <p className="display text-3xl font-bold text-forest-600">100%</p>
              <p className="text-xs font-medium text-charcoal-soft">Adaptive to each student</p>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* ============ One platform, every role (tabs) ============ */}
      <section className="bg-cream-dark/40 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-600">
                One platform, every role
              </p>
              <h2 className="display mt-3 text-3xl font-bold text-forest-900 md:text-5xl">
                Made for teachers, students &amp; schools.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <PlatformTabs />
          </Reveal>
        </div>
      </section>

      <ContentShowcase />
      <FounderStory />

      {/* ============ Sign in (forest section) ============ */}
      <section
        id="signin"
        className="relative scroll-mt-4 overflow-hidden px-6 py-20 md:py-28"
        style={{ background: "linear-gradient(160deg, #14352a 0%, #1b4332 55%, #0d2419 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        <Reveal className="relative mx-auto max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-100/70">
            Start your Edventure
          </p>
          <h2 className="display mt-3 text-3xl font-bold text-cream md:text-4xl">
            Welcome back, Explorer
          </h2>

          <div className="mt-7 rounded-3xl bg-cream p-7 text-left shadow-hero">
            {/* Account type selector */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">I am a…</p>
            <div className="grid grid-cols-3 gap-2">
              {roleMeta.map((r) => (
                <button
                  key={r.role}
                  onClick={() => setSelected(r.role)}
                  className={`rounded-2xl border-2 p-3 text-center transition-all ${
                    selected === r.role ? "border-forest-600 bg-forest-50 shadow-soft" : "border-sand bg-white hover:border-forest-400"
                  }`}
                >
                  <r.Icon className="mx-auto h-6 w-6 text-forest-700" aria-hidden />
                  <span className="mt-1 block text-xs font-semibold text-forest-900">{roleLabel[r.role]}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-charcoal-soft">
              {roleMeta.find((r) => r.role === selected)?.blurb}
            </p>

            {/* Email / password (visual only for MVP) */}
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                enter(selected);
              }}
            >
              <input type="email" placeholder="Email address" defaultValue="demo@biobloke.com" className="w-full rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30" />
              <input type="password" placeholder="Password" defaultValue="explorer" className="w-full rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30" />
              <Button type="submit" size="lg" className="w-full">Sign in as {roleLabel[selected]} </Button>
            </form>

            {/* Demo logins */}
            <div className="mt-5">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-sand" />
                <span className="text-xs font-medium text-charcoal-soft">or jump straight in</span>
                <div className="h-px flex-1 bg-sand" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {roleMeta.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => enter(r.role)}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-forest-700 px-2 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-forest-800"
                  >
                    <r.Icon className="h-4 w-4" aria-hidden /> Demo {roleLabel[r.role]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-charcoal-soft">
                No sign-up needed. Demo accounts use realistic sample data.
              </p>
            </div>
          </div>

          <p className="mt-8 text-xs text-forest-100/60">
            The Biology Bloke · Conservation education for schools
          </p>
        </Reveal>
      </section>

      {/* ============ Student code modal ============ */}
      <Modal open={codeOpen} onClose={() => setCodeOpen(false)} title="Enter your class code">
        <form onSubmit={submitCode} className="space-y-4">
          <div className="grid place-items-center py-2">
            <Compass className="h-12 w-12 text-forest-600" aria-hidden />
          </div>
          <p className="text-center text-sm text-charcoal-soft">
            Ask your teacher for your class code, then pop it in below to start your Edventure.
          </p>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
            placeholder="e.g. KOALA-5J"
            autoFocus
            className={`${inputClass} text-center text-lg font-bold uppercase tracking-widest`}
          />
          {codeError && <p className="text-center text-sm font-medium text-clay-600">{codeError}</p>}
          <Button type="submit" size="lg" className="w-full">Start exploring </Button>
          <p className="text-center text-xs text-charcoal-soft">
            Demo code: <b>KOALA-5J</b>
          </p>
        </form>
      </Modal>
    </div>
  );
}
