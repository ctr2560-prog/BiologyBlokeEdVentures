"use client";
import { useRef, useState } from "react";
import { animalFeud } from "@/data/animalFeud";
import { GameShell, GameEnd } from "./GameShell";

const MAX_STRIKES = 3;

function matchAnswer(guess: string, answers: { keys: string[] }[], revealed: Set<number>): number {
  const g = guess.trim().toLowerCase();
  if (!g) return -1;
  return answers.findIndex((a, i) => !revealed.has(i) && a.keys.some((k) => k.toLowerCase() === g));
}

type Phase = "main" | "steal" | "roundEnd" | "gameEnd";
type Flash = "hit" | "miss" | "steal-win" | "steal-lose" | null;

export default function FamilyFeud({ onBack }: { onBack: () => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [strikes, setStrikes] = useState(0);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [team, setTeam] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<Phase>("main");
  const [guess, setGuess] = useState("");
  const [flash, setFlash] = useState<Flash>(null);
  const [roundPts, setRoundPts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = animalFeud[qIdx];
  const totalPts = q.answers.reduce((s, a) => s + a.points, 0);
  const revealedPts = [...revealed].reduce((s, i) => s + q.answers[i].points, 0);
  const unrevealedPts = totalPts - revealedPts;
  const allRevealed = revealed.size === q.answers.length;
  const otherTeam = team === 1 ? 2 : 1;

  // `totalPtsForRound` is the full amount to award - callers compute it
  // (roundPts already banked + whatever this awarding covers) so it's never
  // double-added here.
  const awardTeam = (t: 1 | 2, totalPtsForRound: number) => {
    setScores((s) => ({ ...s, [t]: s[t] + totalPtsForRound }));
    setRevealed(new Set(q.answers.map((_, i) => i)));
    setPhase("roundEnd");
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || flash) return;
    const matchIdx = matchAnswer(guess, q.answers, revealed);

    if (matchIdx >= 0) {
      const pts = q.answers[matchIdx].points;
      setFlash("hit");
      setGuess("");
      const willComplete = revealed.size + 1 === q.answers.length;
      setTimeout(() => {
        setRevealed((r) => new Set([...r, matchIdx]));
        setRoundPts((p) => p + pts);
        setFlash(null);
        if (willComplete) awardTeam(team, roundPts + pts);
        inputRef.current?.focus();
      }, 700);
    } else {
      const newStrikes = strikes + 1;
      setFlash("miss");
      setGuess("");
      setTimeout(() => {
        setStrikes(newStrikes);
        setFlash(null);
        if (newStrikes >= MAX_STRIKES) setPhase("steal");
        inputRef.current?.focus();
      }, 700);
    }
  };

  const submitSteal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || flash) return;
    const matchIdx = matchAnswer(guess, q.answers, revealed);
    setGuess("");

    if (matchIdx >= 0) {
      // Steal succeeds: the stealing team only wins the remaining pool -
      // the original team's roundPts is lost, not transferred.
      setFlash("steal-win");
      setTimeout(() => awardTeam(otherTeam, unrevealedPts), 900);
    } else {
      // Steal fails: the original team keeps what they'd already banked
      // this round, plus the remaining pool.
      setFlash("steal-lose");
      setTimeout(() => awardTeam(team, roundPts + unrevealedPts), 900);
    }
  };

  const nextQuestion = () => {
    const next = qIdx + 1;
    if (next >= animalFeud.length) {
      setPhase("gameEnd");
      return;
    }
    setQIdx(next);
    setRevealed(new Set());
    setStrikes(0);
    setRoundPts(0);
    setGuess("");
    setFlash(null);
    setPhase("main");
    setTeam(otherTeam);
  };

  const newGame = () => {
    setQIdx(0);
    setRevealed(new Set());
    setStrikes(0);
    setScores({ 1: 0, 2: 0 });
    setTeam(1);
    setPhase("main");
    setRoundPts(0);
    setGuess("");
    setFlash(null);
  };

  if (phase === "gameEnd") {
    return (
      <GameShell title="Animal Family Feud" onBack={onBack}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-cream/80">
            Team 1: <strong className="text-gold-300">{scores[1]}</strong> · Team 2: <strong className="text-gold-300">{scores[2]}</strong>
          </p>
          <p className="font-semibold text-gold-300">
            {scores[1] > scores[2] ? "Team 1 wins!" : scores[2] > scores[1] ? "Team 2 wins!" : "It's a tie!"}
          </p>
          <GameEnd heading="Game over!" onRestart={newGame} onBack={onBack} />
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Animal Family Feud" onBack={onBack}>
      <div className="flex w-full max-w-2xl flex-col items-center gap-5">
        <div className="flex items-center gap-6">
          <div className={`rounded-2xl px-5 py-3 text-center ${team === 1 ? "bg-gold-400/20 ring-2 ring-gold-400" : "bg-white/5"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-cream/60">Team 1</p>
            <p className="display text-2xl font-bold text-cream">{scores[1]}</p>
          </div>
          <span className="text-cream/40">vs</span>
          <div className={`rounded-2xl px-5 py-3 text-center ${team === 2 ? "bg-gold-400/20 ring-2 ring-gold-400" : "bg-white/5"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-cream/60">Team 2</p>
            <p className="display text-2xl font-bold text-cream">{scores[2]}</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-100/70">
            Question {qIdx + 1} of {animalFeud.length}
          </p>
          <h2 className="display mt-1 text-2xl font-bold text-cream">{q.question}</h2>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: MAX_STRIKES }).map((_, i) => (
            <span
              key={i}
              className={`grid h-9 w-9 place-items-center rounded-full border-2 text-lg font-bold ${
                i < strikes ? "border-clay-400 bg-clay-400/20 text-clay-400" : "border-white/15 text-white/20"
              }`}
            >
              ✕
            </span>
          ))}
          {phase === "steal" && (
            <span className="ml-2 rounded-full bg-gold-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-forest-950">
              Steal! Team {otherTeam}
            </span>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {q.answers.map((a, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-2xl px-5 py-3 text-left transition-colors ${
                revealed.has(i) ? "bg-forest-500/25 text-cream" : "bg-white/5 text-cream/30"
              }`}
            >
              {revealed.has(i) ? (
                <>
                  <span className="font-semibold">{a.text}</span>
                  <span className="font-bold text-gold-300">{a.points}</span>
                </>
              ) : (
                <span className="font-bold">{i + 1}</span>
              )}
            </div>
          ))}
        </div>

        {flash === "hit" && <p className="text-lg font-bold text-forest-400">Survey says!</p>}
        {flash === "miss" && <p className="text-lg font-bold text-clay-400">Strike!</p>}
        {flash === "steal-win" && <p className="text-lg font-bold text-forest-400">Stolen!</p>}
        {flash === "steal-lose" && <p className="text-lg font-bold text-clay-400">No steal!</p>}

        {phase === "main" && !allRevealed && (
          <form onSubmit={submitGuess} className="flex w-full max-w-md items-center gap-2">
            <input
              ref={inputRef}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder={`Team ${team}, type an answer…`}
              autoFocus
              disabled={!!flash}
              className="flex-1 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-cream placeholder:text-cream/40 focus:border-gold-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!!flash || !guess.trim()}
              className="rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-forest-950 shadow-hero transition-transform hover:scale-105 disabled:opacity-40"
            >
              Guess
            </button>
          </form>
        )}

        {phase === "steal" && (
          <form onSubmit={submitSteal} className="flex w-full max-w-md items-center gap-2">
            <input
              ref={inputRef}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="One steal attempt…"
              autoFocus
              disabled={!!flash}
              className="flex-1 rounded-full border border-gold-400/60 bg-white/10 px-5 py-3 text-cream placeholder:text-cream/40 focus:border-gold-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!!flash || !guess.trim()}
              className="rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-forest-950 shadow-hero transition-transform hover:scale-105 disabled:opacity-40"
            >
              Steal!
            </button>
          </form>
        )}

        {(phase === "roundEnd" || allRevealed) && (
          <button
            type="button"
            onClick={nextQuestion}
            className="rounded-full bg-gold-400 px-8 py-3 text-sm font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
          >
            {qIdx + 1 < animalFeud.length ? "Next question →" : "See results"}
          </button>
        )}
      </div>
    </GameShell>
  );
}
