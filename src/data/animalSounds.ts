/*
 * Curated animal sound clips for the "Guess the Animal Noise" brain break.
 * Recordings sourced from Wikimedia Commons (openly licensed), trimmed and
 * transcoded to short mono mp3 clips in public/animal-sounds/.
 */
export interface AnimalSound {
  id: string;
  name: string;
  audio: string;
  photo: string;
}

export const animalSounds: AnimalSound[] = [
  { id: "lion", name: "Lion", audio: "/animal-sounds/lion.mp3", photo: "/explorer-animals/lion.jpg" },
  { id: "tiger", name: "Tiger", audio: "/animal-sounds/tiger.mp3", photo: "/explorer-animals/tiger.jpg" },
  { id: "wolf", name: "Wolf", audio: "/animal-sounds/wolf.mp3", photo: "/explorer-animals/wolf.jpg" },
  { id: "owl", name: "Owl", audio: "/animal-sounds/owl.mp3", photo: "/explorer-animals/owl.jpg" },
  { id: "elephant", name: "Elephant", audio: "/animal-sounds/elephant.mp3", photo: "/explorer-animals/elephant.jpg" },
  { id: "chimpanzee", name: "Chimpanzee", audio: "/animal-sounds/chimpanzee.mp3", photo: "/animal-sounds/photos/chimpanzee.jpg" },
  { id: "kookaburra", name: "Kookaburra", audio: "/animal-sounds/kookaburra.mp3", photo: "/explorer-animals/kookaburra.jpg" },
  { id: "zebra", name: "Zebra", audio: "/animal-sounds/zebra.mp3", photo: "/explorer-animals/zebra.jpg" },
  { id: "eagle", name: "Eagle", audio: "/animal-sounds/eagle.mp3", photo: "/explorer-animals/eagle.jpg" },
  { id: "fox", name: "Fox", audio: "/animal-sounds/fox.mp3", photo: "/explorer-animals/fox.jpg" },
  { id: "cow", name: "Cow", audio: "/animal-sounds/cow.mp3", photo: "/animal-sounds/photos/cow.jpg" },
  { id: "horse", name: "Horse", audio: "/animal-sounds/horse.mp3", photo: "/animal-sounds/photos/horse.jpg" },
  { id: "pig", name: "Pig", audio: "/animal-sounds/pig.mp3", photo: "/animal-sounds/photos/pig.jpg" },
  { id: "sheep", name: "Sheep", audio: "/animal-sounds/sheep.mp3", photo: "/animal-sounds/photos/sheep.jpg" },
  { id: "rooster", name: "Rooster", audio: "/animal-sounds/rooster.mp3", photo: "/animal-sounds/photos/rooster.jpg" },
  { id: "frog", name: "Frog", audio: "/animal-sounds/frog.mp3", photo: "/animal-sounds/photos/frog.jpg" },
];
