import { ModuleCard } from "../components/ModuleCard";
import { ProgressStars } from "../components/ProgressStars";
import { moduleCards } from "../data/content";
import { RouteKey } from "../types";

interface HomePageProps {
  onNavigate: (route: RouteKey) => void;
  stars: number;
  badges: number;
}

export function HomePage({ onNavigate, stars, badges }: HomePageProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-[32px] bg-white/75 p-6 shadow-bubble lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="mb-3 inline-flex rounded-full bg-peach px-4 py-2 text-sm font-semibold">宝贝英语启蒙</div>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            轻轻一点，
            <br />
            听一听、说一说、玩一玩。
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink/70 sm:text-base">
            首版包含 4 个学习模块，所有内容都支持后续替换。右上角的小齿轮是给家长看的设置页，孩子平时直接点大卡片就能开始学习。
          </p>
        </div>
        <div className="flex items-end justify-start lg:justify-end">
          <ProgressStars stars={stars} badges={badges} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {moduleCards.map((card) => (
          <ModuleCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            color={card.color}
            onClick={() => onNavigate(card.key as RouteKey)}
          />
        ))}
      </section>
    </div>
  );
}
