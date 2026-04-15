import { useEffect, useMemo, useState } from "react";
import { wordCategoryLabels } from "../data/content";
import { playAudioWithFallback, speakText } from "../lib/audio";
import { SettingsState, WordGameMode, WordItem } from "../types";

interface WordsPageProps {
  words: WordItem[];
  settings: SettingsState;
  onChangeSettings: (next: SettingsState) => void;
  onReward: (message: string, options?: { stars?: number; badge?: boolean }) => void;
  initialMode: WordGameMode;
  initialCursor: number;
  onViewChange: (mode: WordGameMode, cursor: number) => void;
  onSolve: (id: string) => void;
}

function getSafeCursor(length: number, cursor: number) {
  if (length <= 0) {
    return 0;
  }

  return ((cursor % length) + length) % length;
}

function getGroup(words: WordItem[], cursor: number) {
  if (words.length === 0) {
    return [];
  }

  const size = Math.min(3, words.length);
  return Array.from({ length: size }, (_, index) => words[(cursor + index) % words.length]);
}

export function WordsPage({
  words,
  settings,
  onChangeSettings,
  onReward,
  initialMode,
  initialCursor,
  onViewChange,
  onSolve,
}: WordsPageProps) {
  const [mode, setMode] = useState<WordGameMode>(initialMode);
  const [cursor, setCursor] = useState(initialCursor);
  const [group, setGroup] = useState<WordItem[]>([]);
  const [target, setTarget] = useState<WordItem | null>(null);
  const [feedback, setFeedback] = useState("点一点图片和单词，一起认识新朋友。");
  const [matchTargetId, setMatchTargetId] = useState<string | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const filteredWords = useMemo(() => {
    if (settings.selectedWordCategory === "all") {
      return words;
    }

    return words.filter((word) => word.category === settings.selectedWordCategory);
  }, [settings.selectedWordCategory, words]);

  function buildRound(nextMode: WordGameMode = mode, nextCursor = cursor) {
    const safeCursor = getSafeCursor(filteredWords.length, nextCursor);
    const pool = getGroup(filteredWords, safeCursor);
    setGroup(pool);
    setTarget(pool[0] ?? null);
    setMatchTargetId(null);
    setMode(nextMode);
    setCursor(safeCursor);
  }

  useEffect(() => {
    buildRound(initialMode, initialCursor);
  }, [initialCursor, initialMode, settings.selectedWordCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onViewChange(mode, cursor);
  }, [cursor, mode, onViewChange]);

  async function playWord(word: WordItem) {
    await playAudioWithFallback(
      [
        settings.accent === "british" ? word.audio.british : word.audio.american,
        word.audio.local,
      ],
      () => speakText(word.text, settings.accent, { rate: 0.75 }),
    );
  }

  async function handlePick(word: WordItem) {
    await playWord(word);

    if (word.id === target?.id) {
      const nextSolvedCount = solvedCount + 1;
      setSolvedCount(nextSolvedCount);
      setFeedback("答对啦，真棒！");
      onSolve(word.id);

      if (nextSolvedCount % 3 === 0) {
        const badge = nextSolvedCount % 15 === 0;
        onReward(badge ? "连续完成 15 个单词，得到小勋章！" : "完成 3 个单词，送你一颗星星！", {
          stars: 1,
          badge,
        });
      }

      window.setTimeout(() => buildRound(mode, cursor + group.length), 500);
    } else {
      setFeedback("再试一次吧，听听发音再选。");
    }
  }

  async function handleMatch(word: WordItem) {
    setMatchTargetId(word.id);
    await playWord(word);

    if (word.id === target?.id) {
      const nextSolvedCount = solvedCount + 1;
      setSolvedCount(nextSolvedCount);
      setFeedback("配对成功啦！");
      onSolve(word.id);
      if (nextSolvedCount % 3 === 0) {
        const badge = nextSolvedCount % 15 === 0;
        onReward(badge ? "小勋章到手啦！" : "又收下一颗星星！", { stars: 1, badge });
      }
      window.setTimeout(() => buildRound(mode, cursor + group.length), 500);
    } else {
      setFeedback("还没配对成功，换一个试试。");
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap gap-3">
        {(["pick", "match"] as WordGameMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => buildRound(item, cursor)}
            className={`min-h-[48px] rounded-full px-5 font-semibold shadow-bubble transition active:scale-95 ${
              mode === item ? "bg-skysoft" : "bg-white/80"
            }`}
          >
            {item === "pick" ? "点击识词" : "配对游戏"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCategoryPickerOpen((current) => !current)}
          className="min-h-[48px] rounded-full bg-white/80 px-4 py-3 text-sm font-semibold shadow-bubble transition active:scale-95"
          aria-label="切换单词分类"
        >
          当前分类：{wordCategoryLabels[settings.selectedWordCategory]}
        </button>
      </section>

      {categoryPickerOpen ? (
        <section className="rounded-[28px] bg-white/80 p-4 shadow-bubble">
          <div className="flex flex-wrap gap-2">
            {Object.entries(wordCategoryLabels).map(([key, label]) => {
              const selected = settings.selectedWordCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChangeSettings({
                      ...settings,
                      selectedWordCategory: key as SettingsState["selectedWordCategory"],
                    });
                    setCategoryPickerOpen(false);
                    setFeedback("分类已切换，来试试新的单词吧！");
                  }}
                  className={`min-h-[44px] rounded-full px-4 text-sm font-semibold shadow-bubble transition active:scale-95 ${
                    selected ? "bg-skysoft" : "bg-white/90"
                  }`}
                  aria-pressed={selected}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-ink/60">提示：切换分类会自动换一组单词。</div>
        </section>
      ) : null}

      <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
        <div className="text-7xl">{target?.image ?? "🧸"}</div>
        <h2 className="mt-3 flex items-center justify-center gap-3 font-display text-3xl font-bold sm:text-4xl">
          <span>{mode === "pick" ? "找到正确单词" : "把单词和图片配在一起"}</span>
          <button
            type="button"
            onClick={() => {
              if (target) {
                void playWord(target);
              }
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-2xl shadow-bubble transition active:scale-95 disabled:opacity-50"
            aria-label="播放发音"
            disabled={!target}
          >
            🔊
          </button>
        </h2>
        <p className="mt-3 text-sm text-ink/70">{feedback}</p>

        {mode === "pick" ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {group.map((word) => (
              <button
                key={word.id}
                type="button"
                onClick={() => handlePick(word)}
                className="min-h-[92px] rounded-[24px] bg-cream px-4 py-3 text-2xl font-bold shadow-bubble transition active:scale-95"
              >
                {word.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {group.map((word) => (
              <button
                key={word.id}
                type="button"
                onClick={() => handleMatch(word)}
                className={`min-h-[92px] rounded-[24px] px-4 py-3 text-2xl font-bold shadow-bubble transition active:scale-95 ${
                  matchTargetId === word.id ? "bg-butter" : "bg-mint"
                }`}
              >
                {word.text}
              </button>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => buildRound(mode, cursor + group.length)}
        className="min-h-[52px] w-full rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
      >
        换一组
      </button>
    </div>
  );
}
