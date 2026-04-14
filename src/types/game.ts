export interface Card {
  id: string;
  type: string;
  emoji: string;
  x: number;
  y: number;
  zIndex: number;
  isCover: boolean;
  status: number; // 0:正常, 1:队列中, 2:已消除
}

export interface Level {
  id: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cardTypes: string[];
  cardCount: number;
  description: string;
}

export interface GameState {
  cards: Card[];
  queue: Card[];
  sortedQueue: Record<string, number>;
  score: number;
  level: number;
  isPlaying: boolean;
  isFinished: boolean;
  isSuccess: boolean;
  isAnimating: boolean;
  currentLevel: Level | null;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward: string;
}

export interface Skin {
  id: string;
  name: string;
  emoji: string;
  color: string;
  unlocked: boolean;
}

export interface DailyStats {
  date: string;
  cardsCleared: number;
  gamesPlayed: number;
  totalScore: number;
  tasks: DailyTask[];
}

export interface UserData {
  totalCardsCleared: number;
  totalGamesPlayed: number;
  totalScore: number;
  skins: Skin[];
  dailyStats: DailyStats | null;
}
