export interface PlayerProfile {
  id: string;
  name: string;
  characterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProgress {
  playerId: string;
  totalScore: number;
  coins: number;
  unlockedLevelIds: string[];
  levelStars: Record<string, number>;
  bestStreak: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
}
