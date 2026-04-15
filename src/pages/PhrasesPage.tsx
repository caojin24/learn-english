import { useEffect, useMemo, useState } from "react";
import { WordChips } from "../components/WordChips";
import { PhraseItem, SettingsState } from "../types";
import { speakEdge, speakText } from "../lib/audio";

interface PhrasesPageProps {
  phrases: PhraseItem[];
  settings: SettingsState;
  recommendedIds: string[];
  onReward: (message: string, options?: { stars?: number; badge?: boolean }) => void;
  initialCategory: string;
  initialCurrentId: string | null;
  onPositionChange: (category: string, id: string | null) => void;
  onPhraseComplete: (id: string) => void;
  onRefreshRecommendations: () => void;
}

export function PhrasesPage({
  phrases,
  settings,
  recommendedIds,
  onReward,
  initialCategory,
  initialCurrentId,
  onPositionChange,
  onPhraseComplete,
  onRefreshRecommendations,
}: PhrasesPageProps) {
  const [category, setCategory] = useState(initialCategory);
  const [currentId, setCurrentId] = useState<string | null>(initialCurrentId);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const difficultyItems = useMemo(
    () => phrases.filter((item) => item.difficulty === settings.phraseDifficulty),
    [phrases, settings.phraseDifficulty],
  );

  const recommendedItems = useMemo(
    () => recommendedIds.map((id) => difficultyItems.find((item) => item.id === id)).filter(Boolean) as PhraseItem[],
    [difficultyItems, recommendedIds],
  );

  const categories = useMemo(() => ["推荐", ...new Set(difficultyItems.map((item) => item.category))], [difficultyItems]);
  const safeCategory = categories.includes(category) ? category : "推荐";
  const visibleItems = safeCategory === "推荐" ? recommendedItems : difficultyItems.filter((item) => item.category === safeCategory);
  const currentIndex = visibleItems.findIndex((item) => item.id === currentId);
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentItem = visibleItems[resolvedIndex] ?? visibleItems[0];

  useEffect(() => {
    if (safeCategory !== category) {
      setCategory(safeCategory);
    }
  }, [category, safeCategory]);

  useEffect(() => {
    setCurrentId((value) => {
      if (visibleItems.some((item) => item.id === value)) {
        return value;
      }

      return visibleItems[0]?.id ?? null;
    });
  }, [visibleItems]);

  useEffect(() => {
    onPositionChange(safeCategory, currentItem?.id ?? null);
  }, [currentItem?.id, onPositionChange, safeCategory]);

  async function handlePlay() {
    if (!currentItem) {
      return;
    }

    const words = currentItem.text.split(" ");

    try {
      setPlaybackError(null);
      try {
        console.log("[Phrases] Using stable TTS API", currentItem.text);
        await speakEdge(currentItem.text);
      } catch (error) {
        console.warn("[Phrases] Stable TTS API failed, fallback to speechSynthesis", error);
        await speakText(currentItem.text, settings.accent, {
          rate: 0.85,
          pitch: 1.1,
          volume: 1,
          onBoundary: (wordIndex) => setActiveWordIndex(Math.min(wordIndex, words.length - 1)),
        });
      }
      onPhraseComplete(currentItem.id);
      onReward("短句练习完成啦！", { stars: 1 });
    } catch (error) {
      console.warn("[Phrases] playback failed", error);
      setPlaybackError("这句暂时没有播出来，请检查网络后再试一次。");
    } finally {
      setActiveWordIndex(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap gap-3">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setCurrentId(null);
            }}
            className={`min-h-[48px] rounded-full px-5 font-semibold shadow-bubble transition active:scale-95 ${
              safeCategory === item ? "bg-skysoft" : "bg-white/80"
            }`}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
        <div className="text-7xl">{currentItem?.image ?? "💬"}</div>
        <p className="mt-3 text-sm font-semibold text-ink/60">{safeCategory === "推荐" ? "今天推荐 5 句，学完可提前换新" : currentItem?.category}</p>
        <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{currentItem?.text ?? "还没有短句"}</h2>
        {currentItem?.meaningZh ? <p className="mt-3 text-lg font-semibold text-ink/70">{currentItem.meaningZh}</p> : null}
        {currentItem ? <div className="mt-4"><WordChips words={currentItem.text.split(" ")} activeIndex={activeWordIndex} /></div> : null}
        {playbackError ? <p className="mt-3 text-sm font-semibold text-rose-500">{playbackError}</p> : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handlePlay}
            className="min-h-[52px] rounded-full bg-skysoft px-6 font-semibold shadow-bubble transition active:scale-95"
          >
            ▶ 播放短句
          </button>
          <button
            type="button"
            onClick={onRefreshRecommendations}
            className="min-h-[52px] rounded-full bg-white px-6 font-semibold shadow-bubble transition active:scale-95"
          >
            换今天推荐
          </button>
        </div>
      </section>

      <section className="flex gap-4">
        <button
          type="button"
          onClick={() => setCurrentId(visibleItems[(resolvedIndex === 0 ? visibleItems.length : resolvedIndex) - 1]?.id ?? null)}
          className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
        >
          ← 上一句
        </button>
        <button
          type="button"
          onClick={() => setCurrentId(visibleItems[(resolvedIndex + 1) % visibleItems.length]?.id ?? null)}
          className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
        >
          下一句 →
        </button>
      </section>
    </div>
  );
}
