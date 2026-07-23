/*
 * "Survey says" style questions for the Family Feud brain break. Answers are
 * ranked by how likely a class is to guess them first - not real survey
 * data, just sensible common-sense ordering for a fun classroom round.
 */
export interface FeudAnswer {
  text: string;
  keys: string[];
  points: number;
}

export interface FeudQuestion {
  question: string;
  answers: FeudAnswer[];
}

export const animalFeud: FeudQuestion[] = [
  {
    question: "Name an animal you might see at the zoo",
    answers: [
      { text: "Lion", keys: ["lion"], points: 32 },
      { text: "Elephant", keys: ["elephant"], points: 26 },
      { text: "Giraffe", keys: ["giraffe"], points: 20 },
      { text: "Monkey", keys: ["monkey"], points: 14 },
      { text: "Tiger", keys: ["tiger"], points: 8 },
    ],
  },
  {
    question: "Name an animal that can fly",
    answers: [
      { text: "Eagle", keys: ["eagle"], points: 30 },
      { text: "Bee", keys: ["bee"], points: 22 },
      { text: "Butterfly", keys: ["butterfly"], points: 20 },
      { text: "Owl", keys: ["owl"], points: 16 },
      { text: "Bat", keys: ["bat"], points: 12 },
    ],
  },
  {
    question: "Name an animal that lives in the ocean",
    answers: [
      { text: "Shark", keys: ["shark"], points: 34 },
      { text: "Dolphin", keys: ["dolphin"], points: 26 },
      { text: "Octopus", keys: ["octopus"], points: 18 },
      { text: "Turtle", keys: ["turtle"], points: 14 },
      { text: "Clownfish", keys: ["clownfish", "fish"], points: 8 },
    ],
  },
  {
    question: "Name an animal that's native to Australia",
    answers: [
      { text: "Kangaroo", keys: ["kangaroo"], points: 36 },
      { text: "Koala", keys: ["koala"], points: 28 },
      { text: "Wombat", keys: ["wombat"], points: 16 },
      { text: "Dingo", keys: ["dingo"], points: 12 },
      { text: "Echidna", keys: ["echidna"], points: 8 },
    ],
  },
  {
    question: "Name a fast animal",
    answers: [
      { text: "Cheetah", keys: ["cheetah"], points: 40 },
      { text: "Horse", keys: ["horse"], points: 24 },
      { text: "Eagle", keys: ["eagle"], points: 16 },
      { text: "Rabbit", keys: ["rabbit"], points: 12 },
      { text: "Fox", keys: ["fox"], points: 8 },
    ],
  },
  {
    question: "Name a big animal",
    answers: [
      { text: "Elephant", keys: ["elephant"], points: 38 },
      { text: "Hippo", keys: ["hippo", "hippopotamus"], points: 24 },
      { text: "Rhino", keys: ["rhino", "rhinoceros"], points: 18 },
      { text: "Giraffe", keys: ["giraffe"], points: 12 },
      { text: "Whale", keys: ["whale"], points: 8 },
    ],
  },
  {
    question: "Name a bird",
    answers: [
      { text: "Eagle", keys: ["eagle"], points: 28 },
      { text: "Owl", keys: ["owl"], points: 22 },
      { text: "Penguin", keys: ["penguin"], points: 20 },
      { text: "Cockatoo", keys: ["cockatoo"], points: 16 },
      { text: "Kookaburra", keys: ["kookaburra"], points: 14 },
    ],
  },
];
