export type Difficulty = "starter" | "basic";
export type Accent = "american" | "british";
export type WordGameMode = "pick" | "match";
export type WordCategory =
  | "animals"
  | "fruits"
  | "colors"
  | "numbers"
  | "daily"
  | "actions";

export type RouteKey =
  | "home"
  | "settings"
  | "listening"
  | "speaking"
  | "words"
  | "phrases"
  | "videos"
  | "pocket";

export interface SettingsState {
  listeningDifficulty: Difficulty;
  speakingDifficulty: Difficulty;
  phraseDifficulty: Difficulty;
  selectedWordCategory: WordCategory | "all";
  accent: Accent;
  maxVideoMinutes: 5 | 10 | 15;
}

export interface RewardState {
  stars: number;
  badges: number;
}

export interface ModuleProgressState {
  listeningCurrentId: string | null;
  speakingCurrentId: string | null;
  phrases: {
    category: string;
    currentId: string | null;
  };
  words: {
    mode: WordGameMode;
    cursorByCategory: Partial<Record<WordCategory | "all", number>>;
  };
  pocket: {
    tab: "words" | "phrases";
  };
}

export interface LearningProgressState {
  listenedIds: string[];
  spokenIds: string[];
  solvedWordIds: string[];
  completedPhraseIds: string[];
  pocketWordIds: string[];
  pocketPhraseIds: string[];
  rewards: RewardState;
  phraseRotationSeed: string;
  recommendedPhraseIds: string[];
  moduleState: ModuleProgressState;
}

export interface ListeningItem {
  id: string;
  text: string;
  meaningZh?: string;
  hint: string;
  image: string;
  difficulty: Difficulty;
  keyword?: string;
}

export interface WordItem {
  id: string;
  text: string;
  category: WordCategory;
  image: string;
  keyword?: string;
  audio: {
    american?: string;
    british?: string;
    local?: string;
  };
}

export interface PhraseItem {
  id: string;
  text: string;
  meaningZh?: string;
  category: string;
  image: string;
  difficulty: Difficulty;
  keyword?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  titleZh: string;
  durationLabel: string;
  cover: string;
  summary: string;
  source: "bilibili";
  bvid: string;
  aid: string;
  url: string;
}
