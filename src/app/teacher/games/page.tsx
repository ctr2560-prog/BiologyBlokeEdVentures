"use client";
import { useState } from "react";
import { SectionHeader } from "@/components/ui/primitives";
import { Volume2, ScanEye, Zap, Shuffle as ShuffleIcon, LayoutGrid, Users, type LucideIcon } from "lucide-react";
import GuessTheNoise from "./GuessTheNoise";
import GuessWho from "./GuessWho";
import SpeedRound from "./SpeedRound";
import WordScramble from "./WordScramble";
import Jeopardy from "./Jeopardy";
import FamilyFeud from "./FamilyFeud";

type GameId = "noise" | "guesswho" | "speedround" | "scramble" | "jeopardy" | "feud";

const GAMES: { id: GameId; title: string; description: string; Icon: LucideIcon; gradient: string }[] = [
  {
    id: "noise",
    title: "Guess the Animal Noise",
    description: "Play a sound - class shouts out the answer",
    Icon: Volume2,
    gradient: "linear-gradient(135deg, #204535, #4f9776)",
  },
  {
    id: "guesswho",
    title: "Guess Who",
    description: "A blurry animal photo comes into focus",
    Icon: ScanEye,
    gradient: "linear-gradient(135deg, #163329, #3d7a5e)",
  },
  {
    id: "speedround",
    title: "Animal Speed Round",
    description: "Fast-paced trivia against the clock",
    Icon: Zap,
    gradient: "linear-gradient(135deg, #8b5e3c, #d4a373)",
  },
  {
    id: "scramble",
    title: "Word Scramble",
    description: "Unscramble the animal's name",
    Icon: ShuffleIcon,
    gradient: "linear-gradient(135deg, #5c8aa8, #7fa8c9)",
  },
  {
    id: "jeopardy",
    title: "Animal Jeopardy",
    description: "Pick a category and points, answer the clue",
    Icon: LayoutGrid,
    gradient: "linear-gradient(135deg, #1a2db0, #3d5afe)",
  },
  {
    id: "feud",
    title: "Animal Family Feud",
    description: "Two teams, survey-style guessing, steals and strikes",
    Icon: Users,
    gradient: "linear-gradient(135deg, #6a1fd0, #9c5fe0)",
  },
];

export default function GamesPage() {
  const [active, setActive] = useState<GameId | null>(null);

  if (active === "noise") return <GuessTheNoise onBack={() => setActive(null)} />;
  if (active === "guesswho") return <GuessWho onBack={() => setActive(null)} />;
  if (active === "speedround") return <SpeedRound onBack={() => setActive(null)} />;
  if (active === "scramble") return <WordScramble onBack={() => setActive(null)} />;
  if (active === "jeopardy") return <Jeopardy onBack={() => setActive(null)} />;
  if (active === "feud") return <FamilyFeud onBack={() => setActive(null)} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Games & Brain Breaks"
        subtitle="Quick, fun, animal-themed games to project for the whole class - no accounts, no data collected."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActive(g.id)}
            className="card-lift group relative overflow-hidden rounded-3xl p-6 text-left text-cream shadow-soft"
            style={{ background: g.gradient }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
              <g.Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="display mt-4 text-xl font-bold">{g.title}</h3>
            <p className="mt-1 text-sm text-cream/80">{g.description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cream/90 transition-transform group-hover:translate-x-1">
              Play →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
