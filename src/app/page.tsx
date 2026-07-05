"use client";
/*
 * Landing + login. Cinematic nature hero with the Biology Bloke logo, an
 * account-type selector, email/password fields (visual only for the MVP), and
 * one-tap demo logins for Admin / Teacher / Student.
 */
import { useState } from "react";
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

  const enter = (role: Role) => {
    loginAs(role);
    router.push(roleHome[role]);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cinematic nature backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, #2d6a4f 0%, transparent 45%), radial-gradient(circle at 85% 15%, #5c8aa8 0%, transparent 40%), linear-gradient(160deg, #0d2419 0%, #14352a 45%, #1b4332 100%)",
        }}
      />
      {/* Layered foliage silhouettes */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-30"
        style={{ background: "url(/trees.png) bottom center / cover no-repeat" }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "26px 26px" }}
      />

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
        {/* Hero copy */}
        <div className="rise-in text-cream">
          <Logo size={64} variant="white" withWordmark />
          <h1 className="display mt-8 text-4xl font-bold leading-tight md:text-5xl">
            Turn short wildlife stories into
            <span className="text-forest-400"> real conservation learning.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-forest-100/90">
            BioBloke Edventures blends cinematic reels, adaptive tasks and live class
            insights — so every student learns at their own pace, and every teacher
            sees exactly who needs support or extension.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["🐨 Adaptive pathways", "🎬 Short-form reels", "📊 Class insights", "⭐ Explorer points"].map(
              (f) => (
                <span key={f} className="glass rounded-full px-4 py-2 text-sm font-medium text-forest-900">
                  {f}
                </span>
              )
            )}
          </div>
        </div>

        {/* Auth card */}
        <div className="rise-in-delayed w-full justify-self-center lg:justify-self-end">
          <div className="w-full max-w-md rounded-3xl bg-cream p-7 shadow-hero">
            <h2 className="display text-2xl font-bold text-forest-900">Welcome back, Explorer</h2>
            <p className="mt-1 text-sm text-charcoal-soft">Sign in to continue your Edventure.</p>

            {/* Account type selector */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">
                I am a…
              </p>
              <div className="grid grid-cols-3 gap-2">
                {roleMeta.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => setSelected(r.role)}
                    className={`rounded-2xl border-2 p-3 text-center transition-all ${
                      selected === r.role
                        ? "border-forest-600 bg-forest-50 shadow-soft"
                        : "border-sand bg-white hover:border-forest-400"
                    }`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="mt-1 block text-xs font-semibold text-forest-900">
                      {roleLabel[r.role]}
                    </span>
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
              <input
                type="email"
                placeholder="Email address"
                defaultValue="demo@biobloke.com"
                className="w-full rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30"
              />
              <input
                type="password"
                placeholder="Password"
                defaultValue="explorer"
                className="w-full rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30"
              />
              <Button type="submit" size="lg" className="w-full">
                Sign in as {roleLabel[selected]} →
              </Button>
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
  );
}
