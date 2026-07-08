/*
 * Animal alias catalogue. Students are identified only by a class + a unique
 * animal (no names, no PII). The animal -> child mapping lives on the teacher's
 * printed explorer cards, never in the platform. ~40 animals covers any class.
 * Visual colour + icon are derived in src/lib/icons.ts (kept out of data).
 */
export type AnimalKind = "mammal" | "bird" | "reptile" | "marine" | "insect";

export interface Animal {
  id: string;
  name: string;
  kind: AnimalKind;
}

export const animals: Animal[] = [
  { id: "koala", name: "Koala", kind: "mammal" },
  { id: "tiger", name: "Tiger", kind: "mammal" },
  { id: "orangutan", name: "Orangutan", kind: "mammal" },
  { id: "gorilla", name: "Gorilla", kind: "mammal" },
  { id: "elephant", name: "Elephant", kind: "mammal" },
  { id: "lion", name: "Lion", kind: "mammal" },
  { id: "cheetah", name: "Cheetah", kind: "mammal" },
  { id: "leopard", name: "Leopard", kind: "mammal" },
  { id: "panda", name: "Panda", kind: "mammal" },
  { id: "wombat", name: "Wombat", kind: "mammal" },
  { id: "kangaroo", name: "Kangaroo", kind: "mammal" },
  { id: "echidna", name: "Echidna", kind: "mammal" },
  { id: "platypus", name: "Platypus", kind: "mammal" },
  { id: "dingo", name: "Dingo", kind: "mammal" },
  { id: "wolf", name: "Wolf", kind: "mammal" },
  { id: "fox", name: "Fox", kind: "mammal" },
  { id: "otter", name: "Otter", kind: "mammal" },
  { id: "sloth", name: "Sloth", kind: "mammal" },
  { id: "lemur", name: "Lemur", kind: "mammal" },
  { id: "meerkat", name: "Meerkat", kind: "mammal" },
  { id: "rhino", name: "Rhino", kind: "mammal" },
  { id: "hippo", name: "Hippo", kind: "mammal" },
  { id: "zebra", name: "Zebra", kind: "mammal" },
  { id: "bear", name: "Bear", kind: "mammal" },
  { id: "kookaburra", name: "Kookaburra", kind: "bird" },
  { id: "cockatoo", name: "Cockatoo", kind: "bird" },
  { id: "emu", name: "Emu", kind: "bird" },
  { id: "penguin", name: "Penguin", kind: "bird" },
  { id: "owl", name: "Owl", kind: "bird" },
  { id: "eagle", name: "Eagle", kind: "bird" },
  { id: "flamingo", name: "Flamingo", kind: "bird" },
  { id: "toucan", name: "Toucan", kind: "bird" },
  { id: "crocodile", name: "Crocodile", kind: "reptile" },
  { id: "turtle", name: "Turtle", kind: "reptile" },
  { id: "gecko", name: "Gecko", kind: "reptile" },
  { id: "chameleon", name: "Chameleon", kind: "reptile" },
  { id: "dolphin", name: "Dolphin", kind: "marine" },
  { id: "shark", name: "Shark", kind: "marine" },
  { id: "clownfish", name: "Clownfish", kind: "marine" },
  { id: "octopus", name: "Octopus", kind: "marine" },
  { id: "butterfly", name: "Butterfly", kind: "insect" },
  { id: "bee", name: "Bee", kind: "insect" },
];

export const getAnimal = (id: string): Animal | undefined =>
  animals.find((a) => a.id === id);
