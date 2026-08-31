import almost from "@/assets/characters/mia/almost.png";
import celebrate from "@/assets/characters/mia/celebrate.png";
import idle from "@/assets/characters/mia/idle.png";
import thinking from "@/assets/characters/mia/thinking.png";
import type { CharacterDefinition } from "./character.types";

export const miaCharacter: CharacterDefinition = {
  id: "mia-cat",
  name: "Mia",
  assets: {
    idle,
    happy: celebrate,
    thinking,
    almost,
  },
};

export const characters: CharacterDefinition[] = [miaCharacter];

export const defaultCharacter = miaCharacter;
