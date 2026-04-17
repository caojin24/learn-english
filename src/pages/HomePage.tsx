import { useState } from "react";
import { ModuleCard } from "../components/ModuleCard";
import { ProgressStars } from "../components/ProgressStars";
import { moduleCards } from "../data/content";
import { RouteKey } from "../types";

const homeAvatarUrl =
  "https://caojin24-1258355309.cos.ap-guangzhou.myqcloud.com/images/2026-04-16/9a275937-05cd-4f88-b6cc-6ed77fe7feae.jpg";

interface HomePageProps {
  onNavigate: (route: RouteKey) => void;
  onOpenSettings: () => void;
  stars: number;
  badges: number;
}

export function HomePage({ onNavigate, onOpenSettings, stars, badges }: HomePageProps) {
  const [showRewards, setShowRewards] = useState(false);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[36px] bg-white/80 p-6 shadow-bubble">
        <div className="absolute -right-10 top-4 h-28 w-28 rounded-full bg-butter/55 blur-2xl" />
        <div className="absolute left-6 top-6 h-16 w-16 rounded-full bg-skysoft/40 blur-xl" />
        <div className="absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-mint/40 blur-2xl" />
        <div className="relative">
          <div className="absolute right-0 top-0 z-10">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRewards((current) => !current)}
                className="flex h-12 min-w-[48px] items-center justify-center rounded-full bg-white/90 px-3 text-xl shadow-bubble transition active:scale-95"
                aria-label="查看今日成就"
                aria-expanded={showRewards}
              >
                ⭐
              </button>
              {showRewards ? (
                <div className="absolute right-0 top-14 z-10 w-[220px] rounded-[24px] bg-white/95 p-4 shadow-bubble ring-1 ring-white/70">
                  <div className="text-sm font-semibold text-ink/65">今日成就</div>
                  <div className="mt-3">
                    <ProgressStars stars={stars} badges={badges} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/65">今天也在一点点变厉害，继续轻松学就好。</p>
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <div className="mb-4 flex justify-center sm:justify-start">
              <button
                type="button"
                onClick={onOpenSettings}
                className="relative transition active:scale-95"
                aria-label="打开设置"
              >
                <div className="absolute -left-2 -top-2 h-6 w-6 rounded-full bg-butter/90" />
                <div className="absolute -bottom-1 -right-2 h-7 w-7 rounded-full bg-mint/85" />
                <div className="overflow-hidden rounded-full bg-white p-2 shadow-bubble ring-4 ring-white/70">
                  <img
                    src={homeAvatarUrl}
                    alt="小朋友头像"
                    className="h-24 w-24 rounded-full object-cover sm:h-28 sm:w-28"
                  />
                </div>
                <div className="absolute -right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm shadow-bubble">
                  ⚙️
                </div>
              </button>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full bg-peach px-4 py-2 text-sm font-semibold">宝贝英语启蒙</div>
              <div className="inline-flex rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-ink/70 shadow-bubble">
                今日轻松学一点
              </div>
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              轻轻一点，
              <br />
              听一听、说一说、玩一玩。
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink/70 sm:text-base">
              现在有 {moduleCards.length} 个学习模块啦。遇到暂时不会的单词和短句，可以先放进魔法口袋，之后再回来轻松复习。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink/75 shadow-bubble">听力小耳朵</div>
              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink/75 shadow-bubble">消消乐游戏站</div>
              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink/75 shadow-bubble">识词小游戏</div>
              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink/75 shadow-bubble">口袋复习站</div>
            </div>
          </div>
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
