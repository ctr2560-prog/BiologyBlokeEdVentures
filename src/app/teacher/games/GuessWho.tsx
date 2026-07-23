"use client";
import { useState } from "react";
import { Eye, Sparkles } from "lucide-react";
import { animals } from "@/data/animals";
import { GameShell, GameEnd } from "./GameShell";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Blur amount (px) at each hint step - last step is fully revealed.
const BLUR_STEPS = [26, 16, 8, 0];

export default function GuessWho({ onBack }: { onBack: () => void }) {
  const [order, setOrder] = useState(() => shuffle(animals));
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);

  const current = order[idx];
  const done = idx >= order.length;
  const revealed = step >= BLUR_STEPS.length - 1;

  const nextHint = () => setStep((s) => Math.min(s + 1, BLUR_STEPS.length - 1));
  const reveal = () => setStep(BLUR_STEPS.length - 1);
  const next = () => {
    setStep(0);
    setIdx((i) => i + 1);
  };
  const restart = () => {
    setOrder(shuffle(animals));
    setIdx(0);
    setStep(0);
  };

  if (done) {
    return (
      <GameShell title="Guess Who" onBack={onBack}>
        <GameEnd heading="That's every animal!" onRestart={restart} onBack={onBack} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Guess Who" onBack={onBack}>
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-forest-100/70">
          Animal {idx + 1} of {order.length}
        </p>

        <div className="h-64 w-64 overflow-hidden rounded-[32px] shadow-hero ring-4 ring-gold-400/40 sm:h-72 sm:w-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.id}
            src={current.image}
            alt={revealed ? current.name : "Mystery animal"}
            className="h-full w-full scale-110 object-cover transition-[filter] duration-500"
            style={{ filter: `blur(${BLUR_STEPS[step]}px)` }}
          />
        </div>

        {revealed ? (
          <>
            <h2 className="display text-4xl font-bold text-cream">{current.name}</h2>
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-gold-400 px-8 py-3 text-base font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
            >
              Next animal →
            </button>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={nextHint}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-cream backdrop-blur transition-colors hover:bg-white/20"
            >
              <Sparkles className="h-4 w-4" aria-hidden /> Zoom in a little
            </button>
            <button
              type="button"
              onClick={reveal}
              className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
            >
              <Eye className="h-4 w-4" aria-hidden /> Reveal
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
