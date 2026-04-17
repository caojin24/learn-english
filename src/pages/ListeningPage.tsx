import { useEffect, useMemo, useState } from "react";
import { WordChips } from "../components/WordChips";
import { ListeningItem, SettingsState } from "../types";
import { isPlaybackAbortError, speakEdge, speakText, stopPlayback } from "../lib/audio";

interface ListeningPageProps {
  items: ListeningItem[];
  settings: SettingsState;
  onReward: (message: string, options?: { stars?: number; badge?: boolean }) => void;
  initialCategory: string;
  initialCurrentId: string | null;
  onPositionChange: (category: string, id: string | null) => void;
  listenedIds: string[];
  onListenComplete: (id: string) => void;
}

export function ListeningPage({
  items,
  settings,
  onReward,
  initialCategory,
  initialCurrentId,
  onPositionChange,
  listenedIds,
  onListenComplete,
}: ListeningPageProps) {
  const [category, setCategory] = useState(initialCategory);
  const [currentId, setCurrentId] = useState<string | null>(initialCurrentId);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [forwardCountSinceReview, setForwardCountSinceReview] = useState(0);

  const availableItems = useMemo(
    () => items.filter((item) => item.difficulty === settings.listeningDifficulty),
    [items, settings.listeningDifficulty],
  );
  const categories = useMemo(() => ["全部", ...new Set(availableItems.map((item) => item.category))], [availableItems]);
  const safeCategory = categories.includes(category) ? category : "全部";
  const filteredItems = useMemo(
    () => (safeCategory === "全部" ? availableItems : availableItems.filter((item) => item.category === safeCategory)),
    [availableItems, safeCategory],
  );

  const currentIndex = filteredItems.findIndex((item) => item.id === currentId);
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentItem = filteredItems[resolvedIndex] ?? filteredItems[0];
  const globalIndex = currentItem ? availableItems.findIndex((item) => item.id === currentItem.id) : -1;
  const reviewCandidates = filteredItems.filter((item) => item.id !== currentItem?.id && listenedIds.includes(item.id));
  const isLastInCategory = safeCategory !== "全部" && resolvedIndex === filteredItems.length - 1;
  const nextCategoryName = isLastInCategory
    ? categories[categories.indexOf(safeCategory) + 1] ?? categories[1] ?? safeCategory
    : null;

  useEffect(() => {
    if (safeCategory !== category) {
      setCategory(safeCategory);
    }
  }, [category, safeCategory]);

  useEffect(() => {
    setCurrentId((value) => {
      if (filteredItems.some((item) => item.id === value)) {
        return value;
      }

      return filteredItems[0]?.id ?? null;
    });
  }, [filteredItems]);

  useEffect(() => {
    onPositionChange(safeCategory, currentItem?.id ?? null);
  }, [currentItem?.id, onPositionChange, safeCategory]);

  useEffect(() => () => stopPlayback(), []);

  function switchSentence(nextId: string | null) {
    stopPlayback();
    setIsPlaying(false);
    setActiveWordIndex(null);
    setCurrentId(nextId);
  }

  function getNextItemId() {
    if (!currentItem) {
      return { id: null, mode: "forward" as const };
    }

    if (safeCategory !== "全部" && resolvedIndex === filteredItems.length - 1) {
      const currentCategoryIndex = categories.indexOf(safeCategory);
      const nextCategory = categories[currentCategoryIndex + 1] ?? categories[1] ?? safeCategory;
      const nextCategoryItems = availableItems.filter((item) => item.category === nextCategory);
      return { id: nextCategoryItems[0]?.id ?? currentItem.id, mode: "forward" as const };
    }

    const shouldReview = reviewCandidates.length > 0 && forwardCountSinceReview >= 4;
    if (shouldReview) {
      const reviewIndex = Math.floor(Math.random() * reviewCandidates.length);
      const reviewItem = reviewCandidates[reviewIndex];
      return { id: reviewItem?.id ?? currentItem.id, mode: "review" as const };
    }

    return { id: filteredItems[(resolvedIndex + 1) % filteredItems.length]?.id ?? null, mode: "forward" as const };
  }

  function handleCategoryChange(nextCategory: string) {
    stopPlayback();
    setIsPlaying(false);
    setActiveWordIndex(null);
    setForwardCountSinceReview(0);
    setCategory(nextCategory);
    setCurrentId(null);
  }

  function handleNext() {
    const nextStep = getNextItemId();
    const nextId = nextStep.id;
    if (!nextId) {
      return;
    }

    setForwardCountSinceReview((current) => (nextStep.mode === "review" ? 0 : current + 1));

    const nextItem = availableItems.find((item) => item.id === nextId);
    if (nextItem && safeCategory !== "全部" && nextItem.category !== safeCategory) {
      stopPlayback();
      setIsPlaying(false);
      setActiveWordIndex(null);
      setCategory(nextItem.category);
      setCurrentId(nextId);
      return;
    }

    switchSentence(nextId);
  }

  async function handlePlay() {
    if (!currentItem || isPlaying) {
      return;
    }

    const words = currentItem.text.split(" ");
    let wasAborted = false;
    setIsPlaying(true);

    try {
      try {
        console.log("[Listening] Using stable TTS API", currentItem.text);
        await speakEdge(currentItem.text);
      } catch (error) {
        if (isPlaybackAbortError(error)) {
          throw error;
        }
        console.warn("[Listening] Stable TTS API failed, fallback to speechSynthesis", error);
        await speakText(currentItem.text, settings.accent, {
          rate: 0.85,
          pitch: 1.1,
          volume: 1,
          onBoundary: (wordIndex) => setActiveWordIndex(Math.min(wordIndex, words.length - 1)),
        });
      }
    } catch (error) {
      wasAborted = isPlaybackAbortError(error);
      if (!wasAborted) {
        console.warn("[Listening] playback failed", error);
      }
      setActiveWordIndex(null);
    } finally {
      setIsPlaying(false);
      setActiveWordIndex(null);
      if (!wasAborted) {
        onListenComplete(currentItem.id);
        if ((resolvedIndex + 1) % 5 === 0) {
          onReward("听完 5 句啦，送你一颗星星！", { stars: 1 });
        }
      }
    }
  }

  if (!currentItem) {
    return <div className="rounded-[28px] bg-white/80 p-6 shadow-bubble">还没有可播放内容。</div>;
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap gap-3">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleCategoryChange(item)}
            className={`min-h-[48px] rounded-full px-5 font-semibold shadow-bubble transition active:scale-95 ${
              safeCategory === item ? "bg-skysoft" : "bg-white/80"
            }`}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
        <div className={`text-7xl ${isPlaying ? "animate-playbackPop" : "animate-bounceSoft"}`}>{currentItem.image}</div>
        <p className="mt-4 text-sm font-semibold text-ink/60">
          {safeCategory === "全部"
            ? `全部分类 · 第 ${globalIndex + 1} / ${availableItems.length} 句`
            : `${currentItem.category} · 第 ${resolvedIndex + 1} / ${filteredItems.length} 句`}
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{currentItem.text}</h2>
        {currentItem.meaningZh ? (
          <p className="mt-3 text-lg font-semibold text-ink/70">{currentItem.meaningZh}</p>
        ) : null}
        <div className="mt-4">
          <WordChips words={currentItem.text.split(" ")} activeIndex={activeWordIndex} />
        </div>
        <button
          type="button"
          onClick={handlePlay}
          className={`mt-6 inline-flex min-h-[64px] min-w-[160px] items-center justify-center rounded-full bg-skysoft px-6 text-xl font-bold shadow-bubble transition active:scale-95 disabled:opacity-60 ${
            isPlaying ? "animate-playbackPulse ring-4 ring-skysoft/60" : ""
          }`}
          disabled={isPlaying}
        >
          {isPlaying ? "♫ 播放中..." : "▶ 播放发音"}
        </button>
      </section>

      <section className="space-y-3">
        {isLastInCategory && nextCategoryName ? (
          <div className="rounded-[24px] bg-peach/70 px-4 py-3 text-center text-sm font-semibold text-ink/75 shadow-bubble">
            这一类已经到最后一句啦，点“下一句”会进入“{nextCategoryName}”。
          </div>
        ) : null}

        <div className="flex gap-4">
        <button
          type="button"
          onClick={() => {
            setForwardCountSinceReview(0);
            switchSentence(filteredItems[(resolvedIndex === 0 ? filteredItems.length : resolvedIndex) - 1]?.id ?? null);
          }}
          className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
        >
          ← 上一句
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
        >
          下一句 →
        </button>
        </div>
      </section>
    </div>
  );
}
