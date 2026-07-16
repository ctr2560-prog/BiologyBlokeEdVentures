/*
 * Class-card animal library. Each class gets one "cool animal" banner, picked
 * stably from its id so the same class always shows the same creature. Three
 * regions — Australian bush, Sumatran rainforest, African savanna — each with
 * a matching gradient. Purely decorative; no data is tied to the choice.
 */
export type AnimalRegion = "Australia" | "Sumatra" | "Africa";

export interface ClassAnimal {
  id: string;
  name: string;
  emoji: string;
  region: AnimalRegion;
  /** Photo path in /public/animals. Falls back to the gradient+emoji if the
   *  file hasn't been added yet. Drop a JPG named `<id>.jpg` to enable it. */
  image: string;
}

/** Region gradients, tuned to the Edventra earthy palette. */
export const REGION_GRADIENT: Record<AnimalRegion, string> = {
  Australia: "linear-gradient(135deg, #8b5e3c 0%, #c08552 55%, #6b7f3a 100%)",
  Sumatra:   "linear-gradient(135deg, #0d2419 0%, #1b4332 55%, #2d6a4f 100%)",
  Africa:    "linear-gradient(135deg, #a4703a 0%, #d9a45b 55%, #e6c088 100%)",
};

const A = (id: string, name: string, emoji: string, region: AnimalRegion): ClassAnimal => ({
  id,
  name,
  emoji,
  region,
  image: `/animals/${id}.jpg`,
});

export const classAnimals: ClassAnimal[] = [
  // ── Australian bush ──
  A("koala",      "Koala",             "🐨", "Australia"),
  A("kangaroo",   "Kangaroo",          "🦘", "Australia"),
  A("croc",       "Saltwater Croc",    "🐊", "Australia"),
  A("cockatoo",   "Cockatoo",          "🦜", "Australia"),
  A("echidna",    "Echidna",           "🦔", "Australia"),
  A("dingo",      "Dingo",             "🐕", "Australia"),
  A("kookaburra", "Kookaburra",        "🐦", "Australia"),
  // ── Sumatran rainforest ──
  A("orangutan",  "Orangutan",         "🦧", "Sumatra"),
  A("tiger",      "Sumatran Tiger",    "🐯", "Sumatra"),
  A("elephant",   "Sumatran Elephant", "🐘", "Sumatra"),
  A("sunbear",    "Sun Bear",          "🐻", "Sumatra"),
  A("gibbon",     "Gibbon",            "🐒", "Sumatra"),
  A("rhino",      "Sumatran Rhino",    "🦏", "Sumatra"),
  A("hornbill",   "Hornbill",          "🦤", "Sumatra"),
  // ── African savanna ──
  A("lion",       "Lion",              "🦁", "Africa"),
  A("cheetah",    "Cheetah",           "🐆", "Africa"),
  A("gorilla",    "Gorilla",           "🦍", "Africa"),
  A("zebra",      "Zebra",             "🦓", "Africa"),
  A("giraffe",    "Giraffe",           "🦒", "Africa"),
  A("hippo",      "Hippo",             "🦛", "Africa"),
];

/** Stable string hash → non-negative int. */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministically pick a class animal from a seed (usually the class id). */
export function getClassAnimal(seed: string): ClassAnimal {
  return classAnimals[hashSeed(seed || "x") % classAnimals.length];
}
