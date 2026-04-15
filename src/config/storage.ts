import { LearningProgressState, SettingsState } from "../types";

export const storageKeys = {
  settings: "kid-english-settings",
  progress: "kid-english-progress",
};

export const defaultSettings: SettingsState = {
  listeningDifficulty: "starter",
  speakingDifficulty: "starter",
  phraseDifficulty: "starter",
  selectedWordCategory: "all",
  accent: "american",
  maxVideoMinutes: 10,
};

export const defaultProgress: LearningProgressState = {
  listenedIds: [],
  spokenIds: [],
  solvedWordIds: [],
  completedPhraseIds: [],
  rewards: {
    stars: 0,
    badges: 0,
  },
  phraseRotationSeed: "",
  recommendedPhraseIds: [],
  moduleState: {
    listeningCurrentId: null,
    speakingCurrentId: null,
    phrases: {
      category: "推荐",
      currentId: null,
    },
    words: {
      mode: "pick",
      cursorByCategory: {},
    },
  },
};

export function normalizeProgress(progress: LearningProgressState): LearningProgressState {
  return {
    ...defaultProgress,
    ...progress,
    rewards: {
      ...defaultProgress.rewards,
      ...progress.rewards,
    },
    moduleState: {
      ...defaultProgress.moduleState,
      ...progress.moduleState,
      phrases: {
        ...defaultProgress.moduleState.phrases,
        ...progress.moduleState?.phrases,
      },
      words: {
        ...defaultProgress.moduleState.words,
        ...progress.moduleState?.words,
        cursorByCategory: {
          ...defaultProgress.moduleState.words.cursorByCategory,
          ...progress.moduleState?.words?.cursorByCategory,
        },
      },
    },
  };
}
