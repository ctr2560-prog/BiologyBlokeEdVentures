/*
 * Central mapping from content ids/types to lucide SVG icons, so the app can
 * render meaningful icons instead of emojis. lucide has no species-specific
 * icons, so animals map to the closest available nature/animal glyph. When real
 * thumbnail images land, card render sites can swap these for <Image>.
 */
import {
  TreePalm,
  Trees,
  Fish,
  Bird,
  Sun,
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

export const ecoIcon: Record<string, LucideIcon> = {
  "eco-rainforest": TreePalm,
  "eco-bush": Trees,
  "eco-reef": Fish,
  "eco-wetlands": Bird,
  "eco-savanna": Sun,
  "eco-apes": PawPrint,
  "eco-cats": Cat,
  "eco-marsupials": Rabbit,
};

export const getEcoIcon = (id: string): LucideIcon => ecoIcon[id] ?? Leaf;

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
