"use client";
import { useState } from "react";
import { Eye, Shuffle as ShuffleIcon } from "lucide-react";
import { animals } from "@/data/animals";
import { GameShell, GameEnd } from "./GameShell";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function scrambleWord(word: string): string {
  const letters = word.replace(/\s+/g, "").split("");
  if (letters.length < 2) return letters.join("");
  let scrambled = letters.join("");
  let attempts = 0;
  while (scrambled.toLowerCase() === letters.join("").toLowerCase() && attempts < 10) {
    scrambled = shuffle(letters).join("");
    attempts++;
  }
  return scrambled;
}

export default function WordScramble({ onBack }: { onBack: () => void }) {
  const [order, setOrder] = useState(() => shuffle(animals));
  const [idx, setIdx] = useState(0);
  const [scrambled, setScrambled] = useState(() => scrambleWord(order[0]?.name ?? ""));
  const [revealed, setRevealed] = useState(false);

  const current = order[idx];
  const done = idx >= order.length;

  const next = () => {
    const n = idx + 1;
    setIdx(n);
    setRevealed(false);
    if (order[n]) setScrambled(scrambleWord(order[n].name));
  };
  const restart = () => {
    const fresh = shuffle(animals);
    setOrder(fresh);
    setIdx(0);
    setRevealed(false);
    setScrambled(scrambleWord(fresh[0]?.name ?? ""));
  };
  const reshuffle = () => setScrambled(scrambleWord(current.name));

  if (done) {
    return (
      <GameShell title="Animal Word Scramble" onBack={onBack}>
        <GameEnd heading="That's every animal!" onRestart={restart} onBack={onBack} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Animal Word Scramble" onBack={onBack}>
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-forest-100/70">
          Word {idx + 1} of {order.length}
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {scrambled.split("").map((letter, i) => (
            <span
              key={i}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl font-bold uppercase text-forest-900 shadow-hero sm:h-16 sm:w-16 sm:text-3xl"
            >
              {letter}
            </span>
          ))}
        </div>

        {revealed ? (
          <>
            <h2 className="display text-4xl font-bold text-gold-300">{current.name}</h2>
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-gold-400 px-8 py-3 text-base font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
            >
              Next word →
            </button>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reshuffle}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-cream backdrop-blur transition-colors hover:bg-white/20"
            >
              <ShuffleIcon className="h-4 w-4" aria-hidden /> Shuffle again
            </button>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
            >
              <Eye className="h-4 w-4" aria-hidden /> Reveal answer
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
