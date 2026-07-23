"use client";
import { useRef, useState } from "react";
import { Volume2, Eye } from "lucide-react";
import { animalSounds } from "@/data/animalSounds";
import { GameShell, GameEnd } from "./GameShell";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function GuessTheNoise({ onBack }: { onBack: () => void }) {
  const [order, setOrder] = useState(() => shuffle(animalSounds));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const current = order[idx];
  const done = idx >= order.length;

  const play = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    setPlaying(true);
    el.play().catch(() => setPlaying(false));
  };

  const next = () => {
    setRevealed(false);
    setPlaying(false);
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setOrder(shuffle(animalSounds));
    setIdx(0);
    setRevealed(false);
    setPlaying(false);
  };

  if (done) {
    return (
      <GameShell title="Guess the Animal Noise" onBack={onBack}>
        <GameEnd heading="That's every animal!" onRestart={restart} onBack={onBack} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Guess the Animal Noise" onBack={onBack}>
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-forest-100/70">
          Animal {idx + 1} of {order.length}
        </p>

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioRef} src={current.audio} onEnded={() => setPlaying(false)} />

        {!revealed ? (
          <>
            <button
              type="button"
              onClick={play}
              aria-label="Play sound"
              className={`grid h-40 w-40 place-items-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-forest-950 shadow-hero transition-transform hover:scale-105 ${
                playing ? "animate-pulse" : ""
              }`}
            >
              <Volume2 className="h-16 w-16" aria-hidden />
            </button>
            <p className="max-w-xs text-forest-100/70">Tap to play the sound — who can guess first?</p>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-cream backdrop-blur transition-colors hover:bg-white/20"
            >
              <Eye className="h-4 w-4" aria-hidden /> Reveal answer
            </button>
          </>
        ) : (
          <>
            <div className="overflow-hidden rounded-[32px] shadow-hero ring-4 ring-gold-400/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.photo} alt={current.name} className="h-64 w-64 object-cover sm:h-72 sm:w-72" />
            </div>
            <h2 className="display text-4xl font-bold text-cream">{current.name}</h2>
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-gold-400 px-8 py-3 text-base font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
            >
              Next animal →
            </button>
          </>
        )}
      </div>
    </GameShell>
  );
}
