import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { RewardToast } from "./components/RewardToast";
import { defaultProgress, defaultSettings, normalizeProgress, storageKeys } from "./config/storage";
import { listeningItems, phraseItems, videoItems, wordItems } from "./data/content";
import { usePersistentState } from "./hooks/usePersistentState";
import { pickRecommendedPhraseIds } from "./lib/recommendations";
import { HomePage } from "./pages/HomePage";
import { ListeningPage } from "./pages/ListeningPage";
import { PhrasesPage } from "./pages/PhrasesPage";
import { PocketPage } from "./pages/PocketPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SpeakingPage } from "./pages/SpeakingPage";
import { VideosPage } from "./pages/VideosPage";
import { WordsPage } from "./pages/WordsPage";
import { LearningProgressState, RouteKey } from "./types";

const pageMeta: Record<RouteKey, { title: string; subtitle: string }> = {
  home: { title: "宝贝英语启蒙", subtitle: "听、说、玩，一起轻松开始。" },
  settings: { title: "家长设置", subtitle: "轻量调节，不打扰孩子学习。" },
  listening: { title: "分级听力", subtitle: "慢速清晰播放，支持反复听。" },
  speaking: { title: "跟读练习", subtitle: "录音回放 + 鼓励反馈，不评分。" },
  words: { title: "看图识词", subtitle: "点击识词和配对游戏都能玩。" },
  phrases: { title: "日常短句", subtitle: "每天 5 句，学完就能换新。" },
  pocket: { title: "魔法口袋", subtitle: "把暂时不会的内容留在这里，随时回来复习。" },
  videos: { title: "绘本动画", subtitle: "本地视频占位已接好，后续可直接替换。" },
};

function uniquePush(items: string[], id: string): string[] {
  return items.includes(id) ? items : [...items, id];
}

export default function App() {
  const [route, setRoute] = useState<RouteKey>("home");
  const [settings, setSettings] = usePersistentState(storageKeys.settings, defaultSettings);
  const [progress, setProgress] = usePersistentState<LearningProgressState>(storageKeys.progress, defaultProgress);
  const [toast, setToast] = useState<string | null>(null);
  const safeProgress = useMemo(() => normalizeProgress(progress), [progress]);

  const recommendedPhraseIds = useMemo(() => {
    const result = pickRecommendedPhraseIds(
      phraseItems.filter((item) => item.difficulty === settings.phraseDifficulty),
      safeProgress.completedPhraseIds,
      safeProgress.recommendedPhraseIds,
    );

    return result.ids;
  }, [safeProgress.completedPhraseIds, safeProgress.recommendedPhraseIds, settings.phraseDifficulty]);

  useEffect(() => {
    setProgress((current) => normalizeProgress(current));
  }, [setProgress]);

  useEffect(() => {
    setProgress((current) => ({
      ...normalizeProgress(current),
      recommendedPhraseIds,
    }));
  }, [recommendedPhraseIds, setProgress]);

  function showReward(message: string, options?: { stars?: number; badge?: boolean }) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);

    if (!options?.stars && !options?.badge) {
      return;
    }

    setProgress((current) => ({
      ...normalizeProgress(current),
      rewards: {
        stars: normalizeProgress(current).rewards.stars + (options?.stars ?? 0),
        badges: normalizeProgress(current).rewards.badges + (options?.badge ? 1 : 0),
      },
    }));
  }

  function refreshRecommendations() {
    const pool = phraseItems.filter((item) => item.difficulty === settings.phraseDifficulty);
    const nextIds = pool
      .filter((item) => !safeProgress.completedPhraseIds.includes(item.id))
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(5, pool.length))
      .map((item) => item.id);

    setProgress((current) => ({
      ...normalizeProgress(current),
      recommendedPhraseIds: nextIds,
    }));
    showReward("今天的推荐句子换新啦！");
  }

  const handleListeningPositionChange = useCallback(
    (id: string | null) => {
      setProgress((current) => {
        const next = normalizeProgress(current);
        if (next.moduleState.listeningCurrentId === id) {
          return current;
        }

        return {
          ...next,
          moduleState: {
            ...next.moduleState,
            listeningCurrentId: id,
          },
        };
      });
    },
    [setProgress],
  );

  const handleSpeakingPositionChange = useCallback(
    (id: string | null) => {
      setProgress((current) => {
        const next = normalizeProgress(current);
        if (next.moduleState.speakingCurrentId === id) {
          return current;
        }

        return {
          ...next,
          moduleState: {
            ...next.moduleState,
            speakingCurrentId: id,
          },
        };
      });
    },
    [setProgress],
  );

  const handleWordsViewChange = useCallback(
    (mode: "pick" | "match", category: typeof settings.selectedWordCategory, cursor: number) => {
      setProgress((current) => {
        const next = normalizeProgress(current);
        const currentCursor = next.moduleState.words.cursorByCategory[category] ?? 0;
        if (next.moduleState.words.mode === mode && currentCursor === cursor) {
          return current;
        }

        return {
          ...next,
          moduleState: {
            ...next.moduleState,
            words: {
              mode,
              cursorByCategory: {
                ...next.moduleState.words.cursorByCategory,
                [category]: cursor,
              },
            },
          },
        };
      });
    },
    [setProgress],
  );

  const handlePhrasesPositionChange = useCallback(
    (category: string, id: string | null) => {
      setProgress((current) => {
        const next = normalizeProgress(current);
        if (
          next.moduleState.phrases.category === category &&
          next.moduleState.phrases.currentId === id
        ) {
          return current;
        }

        return {
          ...next,
          moduleState: {
            ...next.moduleState,
            phrases: {
              category,
              currentId: id,
            },
          },
        };
      });
    },
    [setProgress],
  );

  const handlePocketTabChange = useCallback(
    (tab: "words" | "phrases") => {
      setProgress((current) => {
        const next = normalizeProgress(current);
        if (next.moduleState.pocket.tab === tab) {
          return current;
        }

        return {
          ...next,
          moduleState: {
            ...next.moduleState,
            pocket: {
              tab,
            },
          },
        };
      });
    },
    [setProgress],
  );

  const rightSlot = null;

  return (
    <>
      {toast ? <RewardToast message={toast} /> : null}
      <AppShell
        title={pageMeta[route].title}
        subtitle={pageMeta[route].subtitle}
        onBack={route === "home" ? undefined : () => setRoute("home")}
        rightSlot={rightSlot}
        hideHeaderText={route === "home"}
      >
        {route === "home" ? (
          <HomePage
            onNavigate={setRoute}
            onOpenSettings={() => setRoute("settings")}
            stars={safeProgress.rewards.stars}
            badges={safeProgress.rewards.badges}
          />
        ) : null}

        {route === "settings" ? <SettingsPage settings={settings} onChange={setSettings} /> : null}

        {route === "listening" ? (
          <ListeningPage
            items={listeningItems}
            settings={settings}
            onReward={showReward}
            initialCurrentId={safeProgress.moduleState.listeningCurrentId}
            onPositionChange={handleListeningPositionChange}
            onListenComplete={(id) =>
              setProgress((current) => {
                const next = normalizeProgress(current);
                return {
                  ...next,
                  listenedIds: uniquePush(next.listenedIds, id),
                };
              })
            }
          />
        ) : null}

        {route === "speaking" ? (
          <SpeakingPage
            items={listeningItems}
            settings={settings}
            onReward={showReward}
            initialCurrentId={safeProgress.moduleState.speakingCurrentId}
            onPositionChange={handleSpeakingPositionChange}
            onSpokenComplete={(id) =>
              setProgress((current) => {
                const next = normalizeProgress(current);
                return {
                  ...next,
                  spokenIds: uniquePush(next.spokenIds, id),
                };
              })
            }
          />
        ) : null}

        {route === "words" ? (
          <WordsPage
            words={wordItems}
            settings={settings}
            onChangeSettings={setSettings}
            onReward={showReward}
            initialMode={safeProgress.moduleState.words.mode}
            initialCursor={safeProgress.moduleState.words.cursorByCategory[settings.selectedWordCategory] ?? 0}
            onViewChange={(mode, cursor) => handleWordsViewChange(mode, settings.selectedWordCategory, cursor)}
            onSolve={(id) =>
              setProgress((current) => {
                const next = normalizeProgress(current);
                return {
                  ...next,
                  solvedWordIds: uniquePush(next.solvedWordIds, id),
                };
              })
            }
            pocketWordIds={safeProgress.pocketWordIds}
            onTogglePocketWord={(id) =>
              setProgress((current) => {
                const next = normalizeProgress(current);
                const hasId = next.pocketWordIds.includes(id);

                return {
                  ...next,
                  pocketWordIds: hasId ? next.pocketWordIds.filter((item) => item !== id) : [...next.pocketWordIds, id],
                };
              })
            }
          />
        ) : null}

        {route === "phrases" ? (
          <PhrasesPage
            phrases={phraseItems}
            settings={settings}
            recommendedIds={safeProgress.recommendedPhraseIds}
            onReward={showReward}
            initialCategory={safeProgress.moduleState.phrases.category}
            initialCurrentId={safeProgress.moduleState.phrases.currentId}
            onPositionChange={handlePhrasesPositionChange}
            onPhraseComplete={(id) =>
              setProgress((current) => {
                const next = normalizeProgress(current);
                return {
                  ...next,
                  completedPhraseIds: uniquePush(next.completedPhraseIds, id),
                };
              })
            }
            onRefreshRecommendations={refreshRecommendations}
            pocketPhraseIds={safeProgress.pocketPhraseIds}
            onTogglePocketPhrase={(id) =>
              setProgress((current) => {
                const next = normalizeProgress(current);
                const hasId = next.pocketPhraseIds.includes(id);

                return {
                  ...next,
                  pocketPhraseIds: hasId
                    ? next.pocketPhraseIds.filter((item) => item !== id)
                    : [...next.pocketPhraseIds, id],
                };
              })
            }
          />
        ) : null}

        {route === "pocket" ? (
          <PocketPage
            words={wordItems}
            phrases={phraseItems}
            settings={settings}
            pocketWordIds={safeProgress.pocketWordIds}
            pocketPhraseIds={safeProgress.pocketPhraseIds}
            initialTab={safeProgress.moduleState.pocket.tab}
            onTabChange={handlePocketTabChange}
            onRemoveWord={(id) =>
              setProgress((current) => {
                const next = normalizeProgress(current);
                return {
                  ...next,
                  pocketWordIds: next.pocketWordIds.filter((item) => item !== id),
                };
              })
            }
            onRemovePhrase={(id) =>
              setProgress((current) => {
                const next = normalizeProgress(current);
                return {
                  ...next,
                  pocketPhraseIds: next.pocketPhraseIds.filter((item) => item !== id),
                };
              })
            }
          />
        ) : null}

        {route === "videos" ? <VideosPage videos={videoItems} settings={settings} onReward={showReward} /> : null}
      </AppShell>
    </>
  );
}
