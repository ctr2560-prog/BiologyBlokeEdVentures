/*
 * Content data. Mock arrays are emptied - all real content lives in Supabase.
 * exploreEcosystems and conservationFacts are UI copy (not DB records) and are kept.
 */
import type {
  Unit,
  Topic,
  Video,
  Resource,
  Quiz,
  AdaptiveTask,
  BadgeDef,
} from "@/types";

export const units: Unit[] = [];
export const topics: Topic[] = [];
export const videos: Video[] = [];
export const resources: Resource[] = [];
export const quizzes: Quiz[] = [];
export const adaptiveTasks: AdaptiveTask[] = [];
export const badges: BadgeDef[] = [];

export const exploreEcosystems = [
  { id: "eco-rainforest", name: "Rainforests", emoji: "", blurb: "Layered worlds bursting with life, from canopy to forest floor.", color: "#2c5844" },
  { id: "eco-bush", name: "Australian Bush", emoji: "", blurb: "Fire-shaped landscapes home to marsupials found nowhere else.", color: "#a47148" },
  { id: "eco-wetlands", name: "Wetlands", emoji: "", blurb: "Nature's kidneys, filtering water and sheltering wildlife.", color: "#3d7a5e" },
  { id: "eco-savanna", name: "Savannah", emoji: "", blurb: "Vast grasslands where great herds and hunters roam.", color: "#c08552" },
  { id: "eco-apes", name: "Great Apes", emoji: "", blurb: "Our closest cousins, intelligent, social and endangered.", color: "#8b5e3c" },
  { id: "eco-cats", name: "Big Cats", emoji: "", blurb: "Powerful, stealthy predators at the top of their food webs.", color: "#4f9776" },
  { id: "eco-marsupials", name: "Marsupials", emoji: "", blurb: "Pouched mammals uniquely adapted to Australian life.", color: "#9bd0b2" },
  { id: "eco-nocturnal", name: "Nocturnal", emoji: "", blurb: "The hidden world that only comes alive after dark.", color: "#3b3a63" },
];

export const conservationFacts = [
  "A single orangutan can spread seeds across kilometres of rainforest every day.",
  "Koalas have fingerprints so similar to humans they can confuse crime scenes.",
  "Wetlands store more carbon per hectare than any other ecosystem on land.",
  "A tiger's roar can be heard up to 3 kilometres away.",
  "Coral reefs support around 25% of all marine species despite covering under 1% of the ocean.",
  "Gorillas share about 98% of their DNA with humans.",
];
