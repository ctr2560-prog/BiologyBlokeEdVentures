"use client";
/*
 * Landing page — cinematic, centered brand splash inspired by editorial nature
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
import { Button } from "@/components/ui/primitives";
import type { Role } from "@/types";

const roleMeta: { role: Role; emoji: string; blurb: string }[] = [
  { role: "admin", emoji: "🧑‍💼", blurb: "Manage the whole learning ecosystem" },
  { role: "teacher", emoji: "👩‍🏫", blurb: "Run classes & assign Edventures" },
  { role: "student", emoji: "🎓", blurb: "Watch, explore & earn points" },
];

const features = [
  "Curriculum-aligned units for Stage 3–5",
  "Short, high-quality wildlife reels",
  "Adaptive tasks personalised to each student",
  "Live class insights & printable reports",
  "Explorer points & badges to drive engagement",
];

export default function LandingPage() {
  const { loginAs } = useApp();
  const router = useRouter();
  const [selected, setSelected] = useState<Role>("teacher");

  const enter = (role: Role) => {
    loginAs(role);
    router.push(roleHome[role]);
  };

  return (
    <div className="bg-cream">
      {/* ============ Top nav ============ */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-5">
          <nav className="flex items-center gap-2">
            <a href="#how" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-cream/90 hover:text-cream sm:block">
              How it works
            </a>
            <a href="#signin" className="glass rounded-full px-5 py-2 text-sm font-semibold text-forest-900 shadow-soft hover:bg-cream">
              Log in
            </a>
          </nav>
        </div>
      </header>

      {/* ============ Hero — centered brand splash ============ */}
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
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,26,18,0.55) 0%, rgba(9,26,18,0.35) 40%, rgba(9,26,18,0.7) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 45%, transparent 55%, rgba(5,17,11,0.7) 100%)" }} />
        </div>

        {/* Centered copy */}
        <div className="rise-in relative z-10 mx-auto max-w-3xl px-6">
          {/* Large centred Biology Bloke logo */}
          <Image
            src="/logo-white.png"
            alt="The Biology Bloke"
            width={360}
            height={360}
            priority
            className="float-y-slow mx-auto h-40 w-auto drop-shadow-2xl md:h-56"
          />
          <h1 className="display mt-6 text-5xl font-bold leading-[1.02] text-cream drop-shadow-xl md:text-7xl">
            Australia&apos;s wildest way to learn conservation.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cream/85 md:text-xl">
            Cinematic wildlife reels, adaptive missions and live class insights —
            ready to teach.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href="#signin">
              <Button size="lg">Enter the platform →</Button>
            </a>
            <a href="#how">
              <button className="rounded-full border border-cream/40 px-7 py-3.5 text-base font-semibold text-cream transition-colors hover:bg-cream/10">
                How it works
              </button>
            </a>
          </div>
        </div>

        {/* Scroll cue */}
        <a href="#how" className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center text-cream/70 hover:text-cream">
          <span className="text-[0.65rem] font-semibold uppercase tracking-widest">Discover more</span>
          <span className="float-y-fast mt-1 text-xl">⌄</span>
        </a>
      </section>

      {/* ============ What you get (clean white section) ============ */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="rise-in">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-600">
              Built for real classrooms
            </p>
            <h2 className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-5xl">
              Everything you need to teach conservation.
            </h2>
            <p className="mt-4 max-w-md text-lg text-charcoal-soft">
              No preparation required. Ready-to-teach units built around short,
              cinematic wildlife films — with the platform doing the personalising.
            </p>
            <ul className="mt-6 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-charcoal">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest-100 text-sm font-bold text-forest-700">
                    ✓
                  </span>
                  <span className="text-base">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Media panel with floating stat cards */}
          <div className="relative">
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-hero"
              style={{ background: "linear-gradient(150deg, #14352a 0%, #2d6a4f 55%, #40916c 100%)" }}
            >
              <div className="absolute inset-0 opacity-40" style={{ background: "url(/trees.png) bottom center / cover no-repeat" }} />
              <div className="absolute inset-0 grid place-items-center">
                <video className="ken-burns h-full w-full object-cover opacity-90" autoPlay muted loop playsInline poster="/intro-poster.jpg" aria-hidden>
                  <source src="/intro-bg.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
            {/* Floating stat cards */}
            <div className="float-y-slow absolute -left-4 top-8 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-black/5">
              <p className="display text-3xl font-bold text-clay-500">3</p>
              <p className="text-xs font-medium text-charcoal-soft">Stages · Yr 5–10</p>
            </div>
            <div className="float-y absolute -right-3 bottom-8 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-black/5">
              <p className="display text-3xl font-bold text-forest-600">100%</p>
              <p className="text-xs font-medium text-charcoal-soft">Adaptive to each student</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Sign in (forest section) ============ */}
      <section
        id="signin"
        className="relative scroll-mt-4 overflow-hidden px-6 py-20 md:py-28"
        style={{ background: "linear-gradient(160deg, #14352a 0%, #1b4332 55%, #0d2419 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        <div className="relative mx-auto max-w-md text-center">
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
                  <span className="text-2xl">{r.emoji}</span>
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
              <Button type="submit" size="lg" className="w-full">Sign in as {roleLabel[selected]} →</Button>
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
                    className="rounded-2xl bg-forest-700 px-2 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-forest-800"
                  >
                    {r.emoji} Demo {roleLabel[r.role]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-charcoal-soft">
                No sign-up needed — demo accounts use realistic sample data.
              </p>
            </div>
          </div>

          <p className="mt-8 text-xs text-forest-100/60">
            The Biology Bloke · Conservation education for schools
          </p>
        </div>
      </section>
    </div>
  );
}
