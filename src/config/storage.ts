import { LearningProgressState, SettingsState } from "../types";

export const storageKeys = {
  settings: "kid-english-settings",
  progress: "kid-english-progress",
};

export const defaultSettings: SettingsState = {
  listeningDifficulty: "basic",
  speakingDifficulty: "basic",
  phraseDifficulty: "basic",
  selectedWordCategory: "all",
  accent: "american",
  maxVideoMinutes: 10,
};

export function normalizeSettings(settings: SettingsState): SettingsState {
  return {
    ...defaultSettings,
    ...settings,
    listeningDifficulty: "basic",
    speakingDifficulty: "basic",
    phraseDifficulty: "basic",
  };
}

export const defaultProgress: LearningProgressState = {
  listenedIds: [],
  spokenIds: [],
  solvedWordIds: [],
  completedPhraseIds: [],
  pocketWordIds: [],
  pocketPhraseIds: [],
  rewards: {
    stars: 0,
    badges: 0,
  },
  phraseRotationSeed: "",
  recommendedPhraseIds: [],
  moduleState: {
    listening: {
      category: "全部",
      currentId: null,
    },
    speakingCurrentId: null,
    phrases: {
      category: "推荐",
      currentId: null,
    },
    words: {
      mode: "pick",
      cursorByCategory: {},
    },
    pocket: {
      tab: "words",
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
      listening: {
        ...defaultProgress.moduleState.listening,
        ...progress.moduleState?.listening,
        currentId:
          progress.moduleState?.listening?.currentId ??
          (progress.moduleState as { listeningCurrentId?: string | null } | undefined)?.listeningCurrentId ??
          defaultProgress.moduleState.listening.currentId,
      },
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
      pocket: {
        ...defaultProgress.moduleState.pocket,
        ...progress.moduleState?.pocket,
      },
    },
  };
}
