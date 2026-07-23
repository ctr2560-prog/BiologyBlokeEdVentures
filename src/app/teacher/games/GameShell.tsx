"use client";
/*
 * Full-screen presentation shell shared by every brain-break game - a
 * class-projector-friendly takeover matching the student lesson feed's
 * branding, with just a back button up top.
 */
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function GameShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "linear-gradient(175deg, #163329 0%, #204535 55%, #2c5844 100%)" }}
    >
      <div className="flex shrink-0 items-center gap-3 p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to games"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-cream backdrop-blur transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="display text-lg font-bold text-cream">{title}</h1>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 pb-10">
        {children}
      </div>
    </div>
  );
}

export function GameEnd({
  heading,
  onRestart,
  onBack,
}: {
  heading: string;
  onRestart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-6xl">🎉</p>
      <h2 className="display text-3xl font-bold text-cream">{heading}</h2>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-gold-400 px-8 py-3 text-sm font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-white/10 px-8 py-3 text-sm font-semibold text-cream backdrop-blur transition-colors hover:bg-white/20"
        >
          Back to games
        </button>
      </div>
    </div>
  );
}
