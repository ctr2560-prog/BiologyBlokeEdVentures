"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { animalJeopardy, type JeopardyClue } from "@/data/animalJeopardy";
import { GameShell } from "./GameShell";

const POINTS = [100, 200, 300, 400, 500];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type BoardClue = JeopardyClue & { points: number; options: string[]; used: boolean; wasCorrect?: boolean };
type BoardCategory = { id: string; label: string; clues: BoardClue[] };

function buildBoard(): BoardCategory[] {
  const allAnswers = animalJeopardy.flatMap((cat) => cat.clues.map((c) => c.answer));
  return animalJeopardy.map((cat) => ({
    id: cat.id,
    label: cat.label,
    clues: cat.clues.map((clue, i) => {
      const distractors = shuffle(allAnswers.filter((a) => a !== clue.answer)).slice(0, 3);
      return {
        ...clue,
        points: POINTS[i],
        options: shuffle([clue.answer, ...distractors]),
        used: false,
      };
    }),
  }));
}

export default function Jeopardy({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<BoardCategory[]>(() => buildBoard());
  const [active, setActive] = useState<{ catIdx: number; clueIdx: number } | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [team, setTeam] = useState<1 | 2>(1);

  const activeClue = active ? board[active.catIdx].clues[active.clueIdx] : null;
  const isCorrect = chosen !== null && activeClue !== null && chosen === activeClue.answer;
  const allUsed = board.every((cat) => cat.clues.every((c) => c.used));

  const openClue = (catIdx: number, clueIdx: number) => {
    if (board[catIdx].clues[clueIdx].used) return;
    setActive({ catIdx, clueIdx });
    setChosen(null);
  };

  const choose = (option: string) => {
    if (chosen) return;
    setChosen(option);
  };

  const closeClue = () => {
    if (!active || !activeClue) return;
    const { catIdx, clueIdx } = active;
    if (isCorrect) {
      setScores((s) => ({ ...s, [team]: s[team] + activeClue.points }));
    }
    setBoard((b) =>
      b.map((cat, ci) =>
        ci !== catIdx
          ? cat
          : { ...cat, clues: cat.clues.map((cl, li) => (li !== clueIdx ? cl : { ...cl, used: true, wasCorrect: isCorrect })) }
      )
    );
    setActive(null);
    setChosen(null);
  };

  const newGame = () => {
    setBoard(buildBoard());
    setScores({ 1: 0, 2: 0 });
    setActive(null);
    setChosen(null);
    setTeam(1);
  };

  return (
    <GameShell title="Animal Jeopardy" onBack={onBack}>
      <div className="flex w-full max-w-5xl flex-col items-center gap-5">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setTeam(1)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              team === 1 ? "bg-gold-400 text-forest-950" : "bg-white/10 text-cream hover:bg-white/20"
            }`}
          >
            Team 1: {scores[1]}
          </button>
          <button
            type="button"
            onClick={() => setTeam(2)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              team === 2 ? "bg-gold-400 text-forest-950" : "bg-white/10 text-cream hover:bg-white/20"
            }`}
          >
            Team 2: {scores[2]}
          </button>
          <button
            type="button"
            onClick={newGame}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-cream backdrop-blur transition-colors hover:bg-white/20"
          >
            New board
          </button>
        </div>

        <div className="grid w-full grid-cols-5 gap-2">
          {board.map((cat, ci) => (
            <div key={cat.id} className="flex flex-col gap-2">
              <div className="rounded-xl bg-white/10 px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-cream sm:text-sm">
                {cat.label}
              </div>
              {cat.clues.map((clue, li) => (
                <button
                  key={li}
                  type="button"
                  onClick={() => openClue(ci, li)}
                  disabled={clue.used}
                  className={`rounded-xl py-4 text-center text-sm font-bold transition-colors sm:text-lg ${
                    clue.used
                      ? clue.wasCorrect
                        ? "bg-forest-500/20 text-forest-400"
                        : "bg-clay-400/15 text-clay-400"
                      : "bg-gold-400/90 text-forest-950 hover:bg-gold-400"
                  }`}
                >
                  {clue.used ? (clue.wasCorrect ? <Check className="mx-auto h-4 w-4" aria-hidden /> : <X className="mx-auto h-4 w-4" aria-hidden />) : `$${clue.points}`}
                </button>
              ))}
            </div>
          ))}
        </div>

        {allUsed && (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl bg-white/10 px-8 py-6 text-center backdrop-blur">
            <h3 className="display text-2xl font-bold text-cream">Game over!</h3>
            <p className="text-cream/80">
              Team 1: <strong className="text-gold-300">{scores[1]}</strong> · Team 2: <strong className="text-gold-300">{scores[2]}</strong>
            </p>
            <p className="font-semibold text-gold-300">
              {scores[1] > scores[2] ? "Team 1 wins!" : scores[2] > scores[1] ? "Team 2 wins!" : "It's a tie!"}
            </p>
            <button
              type="button"
              onClick={newGame}
              className="rounded-full bg-gold-400 px-8 py-3 text-sm font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
            >
              Play again
            </button>
          </div>
        )}
      </div>

      {/* Clue modal */}
      {active && activeClue && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={chosen ? closeClue : undefined}
        >
          <div
            className="w-full max-w-lg rounded-[32px] bg-forest-950 p-8 text-center shadow-hero ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-gold-400">
              {board[active.catIdx].label} · ${activeClue.points}
            </p>
            <p className="display mt-4 text-xl font-bold text-cream">{activeClue.clue}</p>

            {chosen === null ? (
              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {activeClue.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => choose(opt)}
                    className="rounded-2xl border-2 border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-cream transition-colors hover:border-gold-400/60 hover:bg-white/10"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <p className={`text-lg font-bold ${isCorrect ? "text-forest-400" : "text-clay-400"}`}>
                  {isCorrect ? `Correct! +${activeClue.points} for Team ${team}` : "Not quite!"}
                </p>
                <p className="text-cream/80">
                  Answer: <strong className="text-gold-300">{activeClue.answer}</strong>
                </p>
                <button
                  type="button"
                  onClick={closeClue}
                  className="rounded-full bg-gold-400 px-8 py-3 text-sm font-bold text-forest-950 shadow-hero transition-transform hover:scale-105"
                >
                  Back to board
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </GameShell>
  );
}
