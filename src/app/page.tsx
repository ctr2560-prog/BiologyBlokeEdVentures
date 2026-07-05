"use client";
/*
 * Cinematic landing + login.
 *
 * A muted, looping film of the Biology Bloke intro plays full-bleed behind the
 * content. Real 3D depth: the whole hero sits in a perspective scene, floating
 * wildlife particles parallax with the pointer at different depths, and the
 * glass auth card tilts in 3D toward the cursor. Login is fully functional —
 * account-type selector, email/password (visual for the MVP) and one-tap demo
 * logins for Admin / Teacher / Student.
 */
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { roleHome, roleLabel } from "@/components/layout/navConfig";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/primitives";
import type { Role } from "@/types";

const roleMeta: { role: Role; emoji: string; blurb: string }[] = [
  { role: "admin", emoji: "🧑‍💼", blurb: "Manage the whole learning ecosystem" },
  { role: "teacher", emoji: "👩‍🏫", blurb: "Run classes & assign Edventures" },
  { role: "student", emoji: "🎓", blurb: "Watch, explore & earn points" },
];

export default function LandingPage() {
  const { loginAs } = useApp();
  const router = useRouter();
  const [selected, setSelected] = useState<Role>("teacher");
  // Pointer position normalised to -0.5..0.5 for the whole scene.
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  const enter = (role: Role) => {
    loginAs(role);
    router.push(roleHome[role]);
  };

  const onMove = useCallback((e: React.MouseEvent) => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      setPointer({ x, y });
      frame.current = null;
    });
  }, []);

  return (
    <div
      onMouseMove={onMove}
      className="scene-3d relative min-h-screen overflow-hidden bg-forest-950"
    >
      {/* ---- Layer 0: cinematic video backdrop ---- */}
      <div className="absolute inset-0">
        <video
          className="ken-burns h-full w-full object-cover"
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
      </div>

      {/* ---- Layer 1: scrims, vignette, grain — light enough to reveal the footage ---- */}
      <div className="grain pointer-events-none absolute inset-0">
        {/* gentle overall forest tint for cohesion */}
        <div className="absolute inset-0" style={{ background: "rgba(13,36,25,0.18)" }} />
        {/* strong left scrim seats the copy without hiding the animal */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(9,26,18,0.9) 0%, rgba(9,26,18,0.55) 28%, transparent 52%)" }} />
        {/* bottom fade for the scroll cue */}
        <div className="absolute inset-x-0 bottom-0 h-56" style={{ background: "linear-gradient(0deg, #0d2419 0%, transparent 100%)" }} />
        {/* soft cinematic vignette */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(130% 100% at 55% 42%, transparent 62%, rgba(5,17,11,0.6) 100%)" }} />
      </div>

      {/* ---- Layer 2: content ---- */}
      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
        {/* Hero copy — parallaxes gently opposite the card */}
        <div
          className="rise-in text-cream"
          style={{ transform: `translate3d(${pointer.x * -18}px, ${pointer.y * -12}px, 0)`, transition: "transform 0.3s ease-out" }}
        >
          <div className="float-y-slow inline-block drop-shadow-2xl">
            <Logo size={72} variant="white" withWordmark />
          </div>
          <h1 className="display mt-8 text-4xl font-bold leading-[1.05] md:text-6xl">
            Step into the
            <span className="text-shimmer"> wild.</span>
            <span className="mt-2 block text-2xl font-semibold text-forest-100/90 md:text-3xl">
              Learn conservation like an explorer.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-forest-100/85">
            Cinematic wildlife reels, adaptive missions and live class insights —
            so every student learns at their own pace, and every teacher sees who
            needs support or extension.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["🎬 Short-form reels", "🧭 Adaptive missions", "📊 Class insights", "⭐ Explorer points"].map((f, i) => (
              <span
                key={f}
                className="glass rounded-full px-4 py-2 text-sm font-semibold text-forest-900 shadow-lift"
                style={{ transform: `translate3d(${pointer.x * (14 + i * 6)}px, ${pointer.y * (10 + i * 4)}px, 0)`, transition: "transform 0.3s ease-out" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Auth card — 3D tilt toward the cursor */}
        <div className="scene-3d w-full justify-self-center lg:justify-self-end">
          <div
            className="preserve-3d rise-in-delayed w-full max-w-md rounded-3xl bg-cream/95 p-7 shadow-hero backdrop-blur-xl"
            style={{
              transform: `rotateY(${pointer.x * 13}deg) rotateX(${pointer.y * -13}deg) translateZ(0)`,
              transition: "transform 0.2s ease-out",
              boxShadow: `${pointer.x * -28}px 40px 90px rgba(5,17,11,0.6)`,
            }}
          >
            <div style={{ transform: "translateZ(40px)" }} className="preserve-3d">
              <h2 className="display text-2xl font-bold text-forest-900">Welcome back, Explorer</h2>
              <p className="mt-1 text-sm text-charcoal-soft">Sign in to continue your Edventure.</p>

              {/* Account type selector */}
              <div className="mt-5">
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
              </div>

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
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center text-cream/70">
        <span className="text-[0.65rem] font-semibold uppercase tracking-widest">The Biology Bloke</span>
        <span className="float-y-fast mt-1 text-lg">⌄</span>
      </div>
    </div>
  );
}
