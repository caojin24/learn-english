interface ProgressStarsProps {
  stars: number;
  badges: number;
}

export function ProgressStars({ stars, badges }: ProgressStarsProps) {
  return (
    <div className="rounded-[24px] bg-white/80 px-4 py-3 shadow-bubble">
      <div className="text-sm font-semibold text-ink/70">小奖励</div>
      <div className="mt-1 flex items-center gap-4 text-base font-bold">
        <span>⭐ {stars}</span>
        <span>🏅 {badges}</span>
      </div>
    </div>
  );
}
