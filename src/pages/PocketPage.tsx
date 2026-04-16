import { useEffect, useMemo, useState } from "react";
import { WordChips } from "../components/WordChips";
import { playAudioWithFallback, speakEdge, speakText } from "../lib/audio";
import { PhraseItem, SettingsState, WordItem } from "../types";

interface PocketPageProps {
  words: WordItem[];
  phrases: PhraseItem[];
  settings: SettingsState;
  pocketWordIds: string[];
  pocketPhraseIds: string[];
  initialTab: "words" | "phrases";
  onTabChange: (tab: "words" | "phrases") => void;
  onRemoveWord: (id: string) => void;
  onRemovePhrase: (id: string) => void;
}

export function PocketPage({
  words,
  phrases,
  settings,
  pocketWordIds,
  pocketPhraseIds,
  initialTab,
  onTabChange,
  onRemoveWord,
  onRemovePhrase,
}: PocketPageProps) {
  const [tab, setTab] = useState<"words" | "phrases">(initialTab);
  const [wordCursor, setWordCursor] = useState(0);
  const [phraseCursor, setPhraseCursor] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const savedWords = useMemo(
    () => pocketWordIds.map((id) => words.find((item) => item.id === id)).filter(Boolean) as WordItem[],
    [pocketWordIds, words],
  );
  const savedPhrases = useMemo(
    () => pocketPhraseIds.map((id) => phrases.find((item) => item.id === id)).filter(Boolean) as PhraseItem[],
    [pocketPhraseIds, phrases],
  );

  const currentWord = savedWords[wordCursor] ?? null;
  const currentPhrase = savedPhrases[phraseCursor] ?? null;

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    onTabChange(tab);
  }, [onTabChange, tab]);

  useEffect(() => {
    if (wordCursor > Math.max(savedWords.length - 1, 0)) {
      setWordCursor(Math.max(savedWords.length - 1, 0));
    }
  }, [savedWords.length, wordCursor]);

  useEffect(() => {
    if (phraseCursor > Math.max(savedPhrases.length - 1, 0)) {
      setPhraseCursor(Math.max(savedPhrases.length - 1, 0));
    }
  }, [savedPhrases.length, phraseCursor]);

  async function playWord(word: WordItem) {
    await playAudioWithFallback(
      [
        settings.accent === "british" ? word.audio.british : word.audio.american,
        word.audio.local,
      ],
      () => speakText(word.text, settings.accent, { rate: 0.75 }),
    );
  }

  async function playPhrase(phrase: PhraseItem) {
    const wordsInPhrase = phrase.text.split(" ");

    try {
      try {
        await speakEdge(phrase.text);
      } catch {
        await speakText(phrase.text, settings.accent, {
          rate: 0.85,
          pitch: 1.1,
          volume: 1,
          onBoundary: (wordIndex) => setActiveWordIndex(Math.min(wordIndex, wordsInPhrase.length - 1)),
        });
      }
    } finally {
      setActiveWordIndex(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] bg-white/80 p-6 shadow-bubble">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full bg-peach px-4 py-2 text-sm font-semibold">魔法口袋</div>
            <h2 className="mt-3 font-display text-3xl font-bold">把暂时不会的内容，留到这里慢慢练。</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              遇到有点难的单词和短句，先放进口袋。等你准备好了，再回来听一听、读一读。
            </p>
          </div>
          <div className="rounded-[24px] bg-cream px-4 py-3 text-sm font-semibold text-ink/75">
            单词 {savedWords.length} 条 · 短句 {savedPhrases.length} 条
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setTab("words")}
          className={`min-h-[48px] rounded-full px-5 font-semibold shadow-bubble transition active:scale-95 ${
            tab === "words" ? "bg-skysoft" : "bg-white/80"
          }`}
        >
          单词口袋
        </button>
        <button
          type="button"
          onClick={() => setTab("phrases")}
          className={`min-h-[48px] rounded-full px-5 font-semibold shadow-bubble transition active:scale-95 ${
            tab === "phrases" ? "bg-skysoft" : "bg-white/80"
          }`}
        >
          短句口袋
        </button>
      </section>

      {tab === "words" ? (
        currentWord ? (
          <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
            <div className="text-7xl">{currentWord.image}</div>
            <p className="mt-3 text-sm font-semibold text-ink/60">
              第 {wordCursor + 1} 个 / 共 {savedWords.length} 个
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{currentWord.text}</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void playWord(currentWord)}
                className="min-h-[52px] rounded-full bg-skysoft px-6 font-semibold shadow-bubble transition active:scale-95"
              >
                🔊 再听一遍
              </button>
              <button
                type="button"
                onClick={() => onRemoveWord(currentWord.id)}
                className="min-h-[52px] rounded-full bg-white px-6 font-semibold shadow-bubble transition active:scale-95"
              >
                我会啦，从口袋拿出来
              </button>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={() => setWordCursor((current) => (current === 0 ? savedWords.length - 1 : current - 1))}
                className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
              >
                ← 上一个
              </button>
              <button
                type="button"
                onClick={() => setWordCursor((current) => (current + 1) % savedWords.length)}
                className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
              >
                下一个 →
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
            <div className="text-7xl">🧸</div>
            <h2 className="mt-4 font-display text-3xl font-bold">单词口袋还是空的</h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">在看图识词页遇到有点难的单词时，点一下“放进魔法口袋”就会收进来啦。</p>
          </section>
        )
      ) : currentPhrase ? (
        <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
          <div className="text-7xl">{currentPhrase.image}</div>
          <p className="mt-3 text-sm font-semibold text-ink/60">
            第 {phraseCursor + 1} 句 / 共 {savedPhrases.length} 句
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{currentPhrase.text}</h2>
          {currentPhrase.meaningZh ? <p className="mt-3 text-lg font-semibold text-ink/70">{currentPhrase.meaningZh}</p> : null}
          <div className="mt-4">
            <WordChips words={currentPhrase.text.split(" ")} activeIndex={activeWordIndex} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void playPhrase(currentPhrase)}
              className="min-h-[52px] rounded-full bg-skysoft px-6 font-semibold shadow-bubble transition active:scale-95"
            >
              ▶ 再听一遍
            </button>
            <button
              type="button"
              onClick={() => onRemovePhrase(currentPhrase.id)}
              className="min-h-[52px] rounded-full bg-white px-6 font-semibold shadow-bubble transition active:scale-95"
            >
              我会啦，从口袋拿出来
            </button>
          </div>
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => setPhraseCursor((current) => (current === 0 ? savedPhrases.length - 1 : current - 1))}
              className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
            >
              ← 上一句
            </button>
            <button
              type="button"
              onClick={() => setPhraseCursor((current) => (current + 1) % savedPhrases.length)}
              className="min-h-[52px] flex-1 rounded-full bg-white/80 font-semibold shadow-bubble transition active:scale-95"
            >
              下一句 →
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
          <div className="text-7xl">💬</div>
          <h2 className="mt-4 font-display text-3xl font-bold">短句口袋还是空的</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">在日常短句页遇到想多练几次的句子时，点一下“放进魔法口袋”就可以啦。</p>
        </section>
      )}
    </div>
  );
}
