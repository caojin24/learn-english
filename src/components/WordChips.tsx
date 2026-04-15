interface WordChipsProps {
  words: string[];
  activeIndex: number | null;
}

export function WordChips({ words, activeIndex }: WordChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={`rounded-full px-4 py-2 text-lg font-semibold transition sm:text-xl ${
            activeIndex === index ? "bg-butter text-ink shadow-bubble" : "bg-white/80 text-ink/70"
          }`}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
