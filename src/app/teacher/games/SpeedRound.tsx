"use client";
import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { animalTrivia, type TriviaQuestion } from "@/data/animalTrivia";
import { GameShell } from "./GameShell";

const DURATION = 60;
const HS_KEY = "edventra_speedround_hs";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
function getHS(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(HS_KEY) || "0", 10);
}
function saveHS(n: number) {
  if (typeof window === "undefined") return;
  if (n > getHS()) localStorage.setItem(HS_KEY, String(n));
}

export default function SpeedRound({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"ready" | "playing" | "end">("ready");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [order, setOrder] = useState<TriviaQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [hs, setHs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHs(getHS());
  }, []);

  const current = order.length ? order[idx % order.length] : null;

  function start() {
    setOrder(shuffle(animalTrivia));
    setIdx(0);
    setCorrect(0);
    setTotal(0);
    setTimeLeft(DURATION);
    setFlash(null);
    setPhase("playing");
  }

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase("end");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "end") {
      saveHS(correct);
      setHs(getHS());
    }
  }, [phase, correct]);

  function answer(i: number) {
    if (flash || !current) return;
    const ok = i === current.correctIndex;
    setFlash(ok ? "correct" : "wrong");
    if (ok) setCorrect((c) => c + 1);
    setTotal((t) => t + 1);
    setTimeout(() => {
      setFlash(null);
      setIdx((n) => n + 1);
    }, 500);
  }

  return (
    <GameShell title="Animal Speed Round" onBack={onBack}>
      {phase === "ready" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-gold-400 text-forest-950 shadow-hero">
            <Zap className="h-10 w-10" aria-hidden />
          </span>
          <h2 className="display text-3xl font-bold text-cream">Animal Speed Round</h2>
          <p className="max-w-sm text-forest-100/70">
            Answer as many animal trivia questions as you can in {DURATION} seconds!
          </p>
          {hs > 0 && (
            <p className="text-sm text-forest-100/60">
              Personal best: <strong className="text-gold-300">{hs}</strong>
            </p>
          )}
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-gold-400 px-10 py-4 text-base font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
          >
            Start
          </button>
        </div>
      )}

      {phase === "playing" && current && (
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between text-sm font-semibold text-cream/80">
            <span>Score: {correct}</span>
            <span className={timeLeft <= 10 ? "text-clay-400" : ""}>{timeLeft}s</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${timeLeft <= 10 ? "bg-clay-400" : "bg-gold-400"}`}
              style={{ width: `${(timeLeft / DURATION) * 100}%` }}
            />
          </div>
          <h2 className="display text-center text-2xl font-bold text-cream">{current.question}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {current.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => answer(i)}
                disabled={!!flash}
                className={`rounded-2xl border-2 px-5 py-4 text-left text-base font-semibold transition-colors ${
                  flash && i === current.correctIndex
                    ? "border-forest-400 bg-forest-500/20 text-cream"
                    : flash && i !== current.correctIndex
                    ? "border-white/10 bg-white/5 text-cream/40"
                    : "border-white/15 bg-white/5 text-cream hover:border-gold-400/60 hover:bg-white/10"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "end" && (
        <div className="flex flex-col items-center gap-5 text-center">
          {correct >= hs && correct > 0 && <p className="text-sm font-bold text-gold-300">New personal best!</p>}
          <p className="display text-6xl font-bold text-cream">{correct}</p>
          <p className="text-forest-100/70">correct out of {total}</p>
          {hs > 0 && (
            <p className="text-sm text-forest-100/60">
              Best: <strong className="text-gold-300">{hs}</strong>
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={start}
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
      )}
    </GameShell>
  );
}
