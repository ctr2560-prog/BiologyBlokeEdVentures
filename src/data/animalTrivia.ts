/*
 * General animal fact trivia for the Speed Round brain break. Original
 * question text - no external content, safe to ship as-is.
 */
export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export const animalTrivia: TriviaQuestion[] = [
  { question: "Which animal sleeps up to 22 hours a day?", options: ["Koala", "Lion", "Zebra", "Eagle"], correctIndex: 0 },
  { question: "What is a group of lions called?", options: ["A pack", "A pride", "A herd", "A troop"], correctIndex: 1 },
  { question: "Which animal can change the colour of its skin?", options: ["Gecko", "Chameleon", "Turtle", "Frog"], correctIndex: 1 },
  { question: "How many hearts does an octopus have?", options: ["1", "2", "3", "4"], correctIndex: 2 },
  { question: "Which of these is Australia's only egg-laying mammal along with the platypus?", options: ["Wombat", "Echidna", "Dingo", "Kangaroo"], correctIndex: 1 },
  { question: "What is a baby kangaroo called?", options: ["Cub", "Kit", "Joey", "Calf"], correctIndex: 2 },
  { question: "Which big cat is the fastest land animal on Earth?", options: ["Tiger", "Leopard", "Cheetah", "Lion"], correctIndex: 2 },
  { question: "Which animal has the longest neck of any land mammal?", options: ["Giraffe", "Camel", "Ostrich", "Zebra"], correctIndex: 0 },
  { question: "What do you call a group of wolves?", options: ["A pack", "A pod", "A flock", "A colony"], correctIndex: 0 },
  { question: "Which sea creature has three hearts?", options: ["Shark", "Dolphin", "Octopus", "Turtle"], correctIndex: 2 },
  { question: "Which bird is famous for its laughing call in the Australian bush?", options: ["Cockatoo", "Kookaburra", "Emu", "Magpie"], correctIndex: 1 },
  { question: "How many legs does a spider have?", options: ["6", "8", "10", "12"], correctIndex: 1 },
  { question: "Which animal is known to sleep standing up?", options: ["Horse", "Pig", "Sheep", "Dog"], correctIndex: 0 },
  { question: "What is the largest living land animal?", options: ["Rhino", "Hippo", "African elephant", "Giraffe"], correctIndex: 2 },
  { question: "Which of these animals is a marsupial?", options: ["Fox", "Wombat", "Otter", "Owl"], correctIndex: 1 },
  { question: "What is a baby dolphin called?", options: ["Pup", "Calf", "Cub", "Kit"], correctIndex: 1 },
  { question: "Which bird can't fly but is the fastest runner among birds?", options: ["Penguin", "Kiwi", "Ostrich", "Emu"], correctIndex: 2 },
  { question: "Which animal has black and white stripes that are unique to each individual, like a fingerprint?", options: ["Zebra", "Panda", "Tiger", "Skunk"], correctIndex: 0 },
  { question: "Which of these animals can regrow a lost limb?", options: ["Turtle", "Gecko", "Frog", "Crocodile"], correctIndex: 1 },
  { question: "What is a group of crocodiles called?", options: ["A bask", "A congregation", "A pack", "A pod"], correctIndex: 1 },
  { question: "Which of these is not a big cat?", options: ["Tiger", "Cheetah", "Leopard", "Lion"], correctIndex: 1 },
  { question: "Roughly how long can a giant panda spend eating bamboo each day?", options: ["2 hours", "6 hours", "12 hours", "18 hours"], correctIndex: 2 },
  { question: "Which animal has the best sense of smell relative to its size?", options: ["Dog", "Elephant", "Bear", "Shark"], correctIndex: 0 },
  { question: "What do you call a baby owl?", options: ["Chick", "Owlet", "Fledgling", "Hatchling"], correctIndex: 1 },
  { question: "Which of these animals is nocturnal (active mainly at night)?", options: ["Eagle", "Owl", "Emu", "Flamingo"], correctIndex: 1 },
  { question: "Which animal is known for 'playing dead' when threatened?", options: ["Possum", "Fox", "Wolf", "Meerkat"], correctIndex: 0 },
  { question: "How many stomach compartments does a cow have?", options: ["1", "2", "3", "4"], correctIndex: 3 },
  { question: "Which of these animals lives in a group called a 'mob'?", options: ["Kangaroo", "Lion", "Wolf", "Elephant"], correctIndex: 0 },
  { question: "What colour is a giraffe's tongue?", options: ["Pink", "White", "Dark blue-black", "Red"], correctIndex: 2 },
  { question: "Which of these birds cannot fly?", options: ["Toucan", "Cockatoo", "Penguin", "Eagle"], correctIndex: 2 },
  { question: "Which animal can sleep with one half of its brain awake?", options: ["Dolphin", "Elephant", "Lion", "Owl"], correctIndex: 0 },
  { question: "What is a group of flamingos called?", options: ["A flamboyance", "A flock", "A colony", "A troop"], correctIndex: 0 },
];
