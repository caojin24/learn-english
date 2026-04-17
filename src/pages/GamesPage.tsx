import { useEffect, useMemo, useRef, useState } from "react";
import { playAudioWithFallback } from "../lib/audio";
import { GameWordItem } from "../types";

interface GamesPageProps {
  words: GameWordItem[];
}

type BoardCard = {
  id: string;
  pairId: string;
  side: "english" | "meaning";
  label: string;
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
  }

  return result;
}

function pickRoundWords(words: GameWordItem[], size: number): GameWordItem[] {
  const pickedWords: GameWordItem[] = [];
  const usedWords = new Set<string>();
  const usedMeanings = new Set<string>();

  for (const item of shuffle(words)) {
    const normalizedWord = item.word.trim().toLowerCase();
    const normalizedMeaning = item.meaningZh.trim();

    if (usedWords.has(normalizedWord) || usedMeanings.has(normalizedMeaning)) {
      continue;
    }

    pickedWords.push(item);
    usedWords.add(normalizedWord);
    usedMeanings.add(normalizedMeaning);

    if (pickedWords.length >= size) {
      break;
    }
  }

  return pickedWords;
}

function buildCards(roundWords: GameWordItem[], side: BoardCard["side"]): BoardCard[] {
  return shuffle(
    roundWords.map((item) => ({
      id: `${item.id}-${side}`,
      pairId: item.id,
      side,
      label: side === "english" ? item.word : item.meaningZh,
    })),
  );
}

export function GamesPage({ words }: GamesPageProps) {
  const [roundWords, setRoundWords] = useState<GameWordItem[]>([]);
  const [selectedEnglishId, setSelectedEnglishId] = useState<string | null>(null);
  const [selectedMeaningId, setSelectedMeaningId] = useState<string | null>(null);
  const [removedPairIds, setRemovedPairIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("先点英文，再点对应的中文，把它们轻轻消掉吧。");
  const [wrongPairIds, setWrongPairIds] = useState<string[]>([]);
  const [successPairId, setSuccessPairId] = useState<string | null>(null);
  const [successWord, setSuccessWord] = useState<string | null>(null);
  const [isResolvingMatch, setIsResolvingMatch] = useState(false);
  const isResolvingMatchRef = useRef(false);

  const completedCount = removedPairIds.length;
  const isRoundComplete = roundWords.length > 0 && completedCount === roundWords.length;

  const englishCards = useMemo(() => buildCards(roundWords, "english"), [roundWords]);
  const meaningCards = useMemo(() => buildCards(roundWords, "meaning"), [roundWords]);

  function resetSelections() {
    setSelectedEnglishId(null);
    setSelectedMeaningId(null);
  }

  async function playMatchedWord(word: GameWordItem) {
    await playAudioWithFallback([word.audio.american]);
  }

  function startNextRound() {
    const nextRoundWords = pickRoundWords(words, 6);
    setRoundWords(nextRoundWords);
    setRemovedPairIds([]);
    setWrongPairIds([]);
    setSuccessPairId(null);
    setSuccessWord(null);
    setIsResolvingMatch(false);
    isResolvingMatchRef.current = false;
    resetSelections();
    setFeedback("新的一局准备好啦，先点英文，再找中文。");
  }

  useEffect(() => {
    startNextRound();
  }, [words]);

  function handleEnglishPick(card: BoardCard) {
    if (removedPairIds.includes(card.pairId) || isRoundComplete || isResolvingMatchRef.current) {
      return;
    }

    setSelectedEnglishId(card.pairId);
    setSelectedMeaningId(null);
    setWrongPairIds([]);
    setFeedback(`已选中 ${card.label}，现在找找对应的中文吧。`);
  }

  async function handleMeaningPick(card: BoardCard) {
    if (removedPairIds.includes(card.pairId) || isRoundComplete || isResolvingMatchRef.current) {
      return;
    }

    if (!selectedEnglishId) {
      setFeedback("先点上面一张英文卡，再来选中文哦。");
      return;
    }

    setSelectedMeaningId(card.pairId);

    if (selectedEnglishId === card.pairId) {
      const matchedWord = roundWords.find((item) => item.id === card.pairId);
      const nextRemovedPairIds = [...removedPairIds, card.pairId];
      isResolvingMatchRef.current = true;
      setIsResolvingMatch(true);
      setSuccessPairId(card.pairId);
      setSuccessWord(matchedWord?.word ?? null);
      setWrongPairIds([]);
      resetSelections();

      if (matchedWord) {
        setFeedback(`答对啦！${matchedWord.word}`);
      } else {
        setFeedback("答对啦！");
      }

      try {
        if (matchedWord) {
          await playMatchedWord(matchedWord);
        }
      } catch {
        // Keep the game flow moving even if audio playback fails.
      }

      setRemovedPairIds(nextRemovedPairIds);
      setSuccessPairId(null);
      setSuccessWord(null);
      setIsResolvingMatch(false);
      isResolvingMatchRef.current = false;

      if (nextRemovedPairIds.length === roundWords.length) {
        setFeedback("本局完成啦，太棒了！再来一局继续玩吧。");
      } else {
        setFeedback("配对成功，继续找下一组吧。");
      }

      return;
    }

    setWrongPairIds([selectedEnglishId, card.pairId]);
    setFeedback("这两个还不是一对，想一想再试试。");
    window.setTimeout(() => {
      setWrongPairIds([]);
      resetSelections();
    }, 650);
  }

  function getCardClass(pairId: string, isSelected: boolean) {
    if (removedPairIds.includes(pairId)) {
      return "opacity-0 pointer-events-none scale-90";
    }

    if (successPairId === pairId) {
      return "bg-butter ring-4 ring-butter/70";
    }

    if (wrongPairIds.includes(pairId)) {
      return "bg-peach ring-4 ring-peach/60";
    }

    if (isSelected) {
      return "bg-skysoft ring-4 ring-skysoft/60";
    }

    return "bg-white/90";
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] bg-white/80 p-6 shadow-bubble">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full bg-peach px-4 py-2 text-sm font-semibold">中英配对消消乐</div>
            <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">先看英文，再找到对应中文</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70 sm:text-base">
              每一局会出现 6 组单词。配对成功后，中英文会一起消失；全部消掉就能开启新一局。
            </p>
          </div>
          <div className="rounded-[24px] bg-cream px-5 py-4 text-center shadow-bubble">
            <div className="text-sm font-semibold text-ink/60">当前进度</div>
            <div className="mt-2 text-3xl font-bold text-ink">
              {completedCount}/{roundWords.length || 6}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[24px] bg-butter/60 px-4 py-3 text-sm font-semibold text-ink/75">
          {successWord ? (
            <div className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-base font-bold text-ink shadow-bubble">
              <span className="text-xl">✅</span>
              <span>{successWord}</span>
            </div>
          ) : null}
          <div>{feedback}</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[32px] bg-white/80 p-5 shadow-bubble">
          <div className="mb-4 inline-flex rounded-full bg-skysoft px-4 py-2 text-sm font-semibold">英文卡</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {englishCards.map((card) => {
              const isSelected = selectedEnglishId === card.pairId;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleEnglishPick(card)}
                  disabled={isResolvingMatch}
                  className={`min-h-[96px] rounded-[24px] px-4 py-5 text-left shadow-bubble transition duration-200 active:scale-[0.98] ${getCardClass(card.pairId, isSelected)}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">English</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-2xl font-bold text-ink">{card.label}</div>
                    {successPairId === card.pairId ? <span className="text-2xl">✅</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 shadow-bubble">
          <div className="mb-4 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-semibold">中文卡</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {meaningCards.map((card) => {
              const isSelected = selectedMeaningId === card.pairId;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleMeaningPick(card)}
                  disabled={isResolvingMatch}
                  className={`min-h-[96px] rounded-[24px] px-4 py-5 text-left shadow-bubble transition duration-200 active:scale-[0.98] ${getCardClass(card.pairId, isSelected)}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">中文</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xl font-bold leading-8 text-ink">{card.label}</div>
                    {successPairId === card.pairId ? <span className="text-2xl">✅</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startNextRound}
          className="min-h-[52px] rounded-full bg-white/90 px-6 font-semibold shadow-bubble transition active:scale-95"
        >
          {isRoundComplete ? "再来一局" : "换一局"}
        </button>
        <div className="inline-flex min-h-[52px] items-center rounded-full bg-white/70 px-5 text-sm font-semibold text-ink/70 shadow-bubble">
          小提示：英文区和中文区顺序都打乱啦，可以先轻轻读一遍英文。
        </div>
      </section>
    </div>
  );
}
