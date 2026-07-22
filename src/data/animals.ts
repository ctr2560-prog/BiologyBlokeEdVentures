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
  /** Stock photo path in /public/explorer-animals, e.g. `/explorer-animals/koala.jpg`. */
  image: string;
}

const A = (id: string, name: string, kind: AnimalKind): Animal => ({
  id,
  name,
  kind,
  image: `/explorer-animals/${id}.jpg`,
});

export const animals: Animal[] = [
  A("koala", "Koala", "mammal"),
  A("tiger", "Tiger", "mammal"),
  A("orangutan", "Orangutan", "mammal"),
  A("gorilla", "Gorilla", "mammal"),
  A("elephant", "Elephant", "mammal"),
  A("lion", "Lion", "mammal"),
  A("cheetah", "Cheetah", "mammal"),
  A("leopard", "Leopard", "mammal"),
  A("panda", "Panda", "mammal"),
  A("wombat", "Wombat", "mammal"),
  A("kangaroo", "Kangaroo", "mammal"),
  A("echidna", "Echidna", "mammal"),
  A("platypus", "Platypus", "mammal"),
  A("dingo", "Dingo", "mammal"),
  A("wolf", "Wolf", "mammal"),
  A("fox", "Fox", "mammal"),
  A("otter", "Otter", "mammal"),
  A("sloth", "Sloth", "mammal"),
  A("lemur", "Lemur", "mammal"),
  A("meerkat", "Meerkat", "mammal"),
  A("rhino", "Rhino", "mammal"),
  A("hippo", "Hippo", "mammal"),
  A("zebra", "Zebra", "mammal"),
  A("bear", "Bear", "mammal"),
  A("kookaburra", "Kookaburra", "bird"),
  A("cockatoo", "Cockatoo", "bird"),
  A("emu", "Emu", "bird"),
  A("penguin", "Penguin", "bird"),
  A("owl", "Owl", "bird"),
  A("eagle", "Eagle", "bird"),
  A("flamingo", "Flamingo", "bird"),
  A("toucan", "Toucan", "bird"),
  A("crocodile", "Crocodile", "reptile"),
  A("turtle", "Turtle", "reptile"),
  A("gecko", "Gecko", "reptile"),
  A("chameleon", "Chameleon", "reptile"),
  A("dolphin", "Dolphin", "marine"),
  A("shark", "Shark", "marine"),
  A("clownfish", "Clownfish", "marine"),
  A("octopus", "Octopus", "marine"),
  A("butterfly", "Butterfly", "insect"),
  A("bee", "Bee", "insect"),
];

export const getAnimal = (id: string): Animal | undefined =>
  animals.find((a) => a.id === id);
