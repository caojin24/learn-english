import { useEffect, useMemo, useState } from "react";
import { WordChips } from "../components/WordChips";
import { ListeningItem, SettingsState } from "../types";
import { speakEdge, speakText } from "../lib/audio";

interface ListeningPageProps {
  items: ListeningItem[];
  settings: SettingsState;
  onReward: (message: string, options?: { stars?: number; badge?: boolean }) => void;
  initialCurrentId: string | null;
  onPositionChange: (id: string | null) => void;
  onListenComplete: (id: string) => void;
}

export function ListeningPage({
  items,
  settings,
  onReward,
  initialCurrentId,
  onPositionChange,
  onListenComplete,
}: ListeningPageProps) {
  const [currentId, setCurrentId] = useState<string | null>(initialCurrentId);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  const filteredItems = useMemo(
    () => items.filter((item) => item.difficulty === settings.listeningDifficulty),
    [items, settings.listeningDifficulty],
  );

  const currentIndex = filteredItems.findIndex((item) => item.id === currentId);
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentItem = filteredItems[resolvedIndex] ?? filteredItems[0];

  useEffect(() => {
    setCurrentId((value) => {
      if (filteredItems.some((item) => item.id === value)) {
        return value;
      }

      return filteredItems[0]?.id ?? null;
    });
  }, [filteredItems]);

  useEffect(() => {
    onPositionChange(currentItem?.id ?? null);
  }, [currentItem?.id, onPositionChange]);

  async function handlePlay() {
    if (!currentItem) {
      return;
    }

    const words = currentItem.text.split(" ");

    try {
      try {
        console.log("[Listening] Using stable TTS API", currentItem.text);
        await speakEdge(currentItem.text);
      } catch (error) {
        console.warn("[Listening] Stable TTS API failed, fallback to speechSynthesis", error);
        await speakText(currentItem.text, settings.accent, {
          rate: 0.85,
          pitch: 1.1,
          volume: 1,
          onBoundary: (wordIndex) => setActiveWordIndex(Math.min(wordIndex, words.length - 1)),
        });
      }
    } catch (error) {
      console.warn("[Listening] playback failed", error);
      setActiveWordIndex(null);
    } finally {
      setActiveWordIndex(null);
      onListenComplete(currentItem.id);
      if ((resolvedIndex + 1) % 5 === 0) {
        onReward("听完 5 句啦，送你一颗星星！", { stars: 1 });
      }
    }
  }

  if (!currentItem) {
    return <div className="rounded-[28px] bg-white/80 p-6 shadow-bubble">还没有可播放内容。</div>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
        <div className="text-7xl animate-bounceSoft">{currentItem.image}</div>
        <p className="mt-4 text-sm font-semibold text-ink/60">{currentItem.hint}</p>
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
          className="mt-6 inline-flex min-h-[64px] min-w-[160px] items-center justify-center rounded-full bg-skysoft px-6 text-xl font-bold shadow-bubble transition active:scale-95"
        >
          ▶ 播放发音
        </button>
      </section>

      <section className="flex gap-4">
        <button
          type="button"
          onClick={() =>
            setCurrentId(filteredItems[(resolvedIndex === 0 ? filteredItems.length : resolvedIndex) - 1]?.id ?? null)
          }
          className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
        >
          ← 上一句
        </button>
        <button
          type="button"
          onClick={() => setCurrentId(filteredItems[(resolvedIndex + 1) % filteredItems.length]?.id ?? null)}
          className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
        >
          下一句 →
        </button>
      </section>
    </div>
  );
}
