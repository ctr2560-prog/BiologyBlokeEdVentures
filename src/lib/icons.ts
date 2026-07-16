/*
 * Central mapping from content ids/types to lucide SVG icons, so the app can
 * render meaningful icons instead of emojis. lucide has no species-specific
 * icons, so animals map to the closest available nature/animal glyph. When real
 * thumbnail images land, card render sites can swap these for <Image>.
 */
import {
  TreePalm,
  Trees,
  Bird,
  Fish,
  Turtle,
  Sun,
  Moon,
  PawPrint,
  Cat,
  Rabbit,
  Leaf,
  Award,
  Trophy,
  Dna,
  Bug,
  type LucideIcon,
} from "lucide-react";
import type { AnimalKind } from "@/data/animals";

export const ecoIcon: Record<string, LucideIcon> = {
  "eco-rainforest": TreePalm,
  "eco-bush": Trees,
  "eco-wetlands": Bird,
  "eco-savanna": Sun,
  "eco-apes": PawPrint,
  "eco-cats": Cat,
  "eco-marsupials": Rabbit,
  "eco-nocturnal": Moon,
};

export const getEcoIcon = (id: string): LucideIcon => ecoIcon[id] ?? Leaf;

/* Icon choices for admin-built ecosystems, keyed by lucide name. */
export const ECO_ICON_CHOICES: Record<string, LucideIcon> = {
  TreePalm,
  Trees,
  Bird,
  Fish,
  Turtle,
  Sun,
  Moon,
  PawPrint,
  Cat,
  Rabbit,
  Leaf,
  Bug,
};

/** Resolve an ecosystem icon: explicit key first, then legacy id map, then Leaf. */
export const getEcoIconByKey = (key: string, id: string): LucideIcon =>
  ECO_ICON_CHOICES[key] ?? ecoIcon[id] ?? Leaf;

export const badgeIcon: Record<string, LucideIcon> = {
  "badge-koala": PawPrint,
  "badge-foodweb": Bug,
  "badge-rainforest": TreePalm,
  "badge-adaptation": Dna,
  "badge-champion": Trophy,
  "badge-gorilla": PawPrint,
  "badge-tiger": Cat,
};

export const getBadgeIcon = (id: string): LucideIcon => badgeIcon[id] ?? Award;

/* ---- Animal aliases ---- */
const animalKindIcon: Record<AnimalKind, LucideIcon> = {
  mammal: PawPrint,
  bird: Bird,
  reptile: Turtle,
  marine: Fish,
  insect: Bug,
};

export const getAnimalIcon = (kind: AnimalKind): LucideIcon => animalKindIcon[kind];

// Deterministic tile colour per animal id (varied nature palette).
const animalPalette = [
  "#2d6a4f", "#1b4332", "#a47148", "#d4a373", "#5c8aa8", "#40916c",
  "#c08552", "#6d597a", "#bc6c25", "#457b9d", "#588157", "#8b5e3c",
  "#3b3a63", "#e07a5f", "#7fa8c9", "#b5838d",
];

export const getAnimalColor = (id: string): string => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % animalPalette.length;
  return animalPalette[h];
};
