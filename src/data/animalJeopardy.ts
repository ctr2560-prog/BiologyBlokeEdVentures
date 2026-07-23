/*
 * Category clues for the Jeopardy-style brain break. Each category has 5
 * clues worth 100-500 points; the contestant is shown the clue and picks
 * the matching animal from four options (three drawn from the rest of the
 * category as distractors).
 */
export interface JeopardyClue {
  clue: string;
  answer: string;
}

export interface JeopardyCategory {
  id: string;
  label: string;
  clues: JeopardyClue[];
}

export const animalJeopardy: JeopardyCategory[] = [
  {
    id: "big-cats",
    label: "Big Cats",
    clues: [
      { clue: "The fastest land animal on Earth, reaching speeds over 100km/h.", answer: "Cheetah" },
      { clue: "Known for its orange coat with black stripes, unique to each individual.", answer: "Tiger" },
      { clue: "Lives in family groups called prides.", answer: "Lion" },
      { clue: "This big cat's spotted coat helps it hide in trees, where it often drags its kills.", answer: "Leopard" },
      { clue: "A great swimmer among big cats, sometimes called the 'ghost of the jungle'.", answer: "Jaguar" },
    ],
  },
  {
    id: "aussie-animals",
    label: "Australian Animals",
    clues: [
      { clue: "A marsupial that sleeps up to 22 hours a day, eating mostly eucalyptus.", answer: "Koala" },
      { clue: "Australia's largest marsupial, carries its young in a pouch.", answer: "Kangaroo" },
      { clue: "One of only two egg-laying mammals, alongside the platypus.", answer: "Echidna" },
      { clue: "A wild dog found across the Australian mainland.", answer: "Dingo" },
      { clue: "A burrowing marsupial known for its cube-shaped droppings.", answer: "Wombat" },
    ],
  },
  {
    id: "ocean-life",
    label: "Ocean Life",
    clues: [
      { clue: "A highly intelligent marine mammal that sleeps with half its brain awake.", answer: "Dolphin" },
      { clue: "This sea creature has three hearts and can change colour instantly.", answer: "Octopus" },
      { clue: "The largest fish in the ocean feeds mainly on tiny plankton.", answer: "Shark" },
      { clue: "A reptile that can hold its breath for hours and returns to the same beach to nest.", answer: "Turtle" },
      { clue: "A small, brightly striped fish that lives safely among sea anemones.", answer: "Clownfish" },
    ],
  },
  {
    id: "birds",
    label: "Birds",
    clues: [
      { clue: "Famous for its laughing call in the Australian bush.", answer: "Kookaburra" },
      { clue: "The world's largest bird, cannot fly but can run very fast.", answer: "Ostrich" },
      { clue: "A bird of prey with incredible eyesight, seen on flags and coins.", answer: "Eagle" },
      { clue: "This flightless Australian bird is the second-tallest bird in the world.", answer: "Emu" },
      { clue: "Known for its pink feathers, which come from the food it eats.", answer: "Flamingo" },
    ],
  },
  {
    id: "amazing-facts",
    label: "Amazing Facts",
    clues: [
      { clue: "This animal's tongue is dark blue-black to protect it from sunburn while reaching high leaves.", answer: "Giraffe" },
      { clue: "The largest land animal, with a memory strong enough to recognise other individuals for decades.", answer: "Elephant" },
      { clue: "This animal can regrow a lost tail if it needs to escape a predator.", answer: "Gecko" },
      { clue: "Known for 'playing dead' - flopping over and playing possum when threatened.", answer: "Possum" },
      { clue: "A nocturnal bird that can rotate its head almost all the way around.", answer: "Owl" },
    ],
  },
];
