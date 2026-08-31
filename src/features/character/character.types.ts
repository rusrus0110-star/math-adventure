export type CharacterMood = 'idle' | 'happy' | 'thinking' | 'almost';

export interface CharacterAssets {
  idle: string;
  happy: string;
  thinking: string;
  almost: string;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  assets: CharacterAssets;
}
