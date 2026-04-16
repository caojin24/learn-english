import { useEffect, useMemo, useState } from "react";
import { SettingsState, VideoItem } from "../types";

interface VideosPageProps {
  videos: VideoItem[];
  settings: SettingsState;
  onReward: (message: string, options?: { stars?: number; badge?: boolean }) => void;
}

export function VideosPage({ videos, settings, onReward }: VideosPageProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isBlockedByLimit, setIsBlockedByLimit] = useState(false);

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) ?? null,
    [selectedVideoId, videos],
  );

  useEffect(() => {
    if (!selectedVideo || !startedAt) {
      return;
    }

    const timer = window.setInterval(() => {
      const elapsedMinutes = (Date.now() - startedAt) / 60000;
      if (elapsedMinutes >= settings.maxVideoMinutes) {
        setIsBlockedByLimit(true);
        onReward("休息一下吧，动画先暂停啦。");
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [onReward, selectedVideo, settings.maxVideoMinutes, startedAt]);

  if (!selectedVideo) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => {
              setSelectedVideoId(video.id);
              setIsBlockedByLimit(false);
              setStartedAt(null);
            }}
            className="rounded-[30px] bg-white/80 p-5 text-left shadow-bubble transition active:scale-[0.98]"
          >
            <div className="flex aspect-[16/10] items-center justify-center rounded-[24px] bg-cream text-7xl shadow-bubble">
              {video.cover}
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold">{video.title}</h2>
            <p className="mt-1 text-sm font-semibold text-ink/60">{video.titleZh}</p>
            <p className="mt-2 text-sm text-ink/70">{video.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-cream px-4 py-2 text-sm font-semibold">{video.durationLabel}</span>
              <span className="inline-flex rounded-full bg-skysoft px-4 py-2 text-sm font-semibold">B站外链</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          setSelectedVideoId(null);
          setStartedAt(null);
          setIsBlockedByLimit(false);
        }}
        className="min-h-[48px] rounded-full bg-white/80 px-5 font-semibold shadow-bubble transition active:scale-95"
      >
        ← 返回动画列表
      </button>

      <section className="rounded-[32px] bg-white/85 p-4 shadow-bubble">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">{selectedVideo.title}</h2>
            <p className="text-sm text-ink/70">
              {selectedVideo.titleZh} · 单次观看上限：{settings.maxVideoMinutes} 分钟
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-cream px-4 py-2 text-sm font-semibold">{selectedVideo.durationLabel}</span>
            <span className="rounded-full bg-skysoft px-4 py-2 text-sm font-semibold">{selectedVideo.bvid}</span>
          </div>
        </div>

        {!isBlockedByLimit ? (
          <div className="overflow-hidden rounded-[28px] bg-slate-900">
            <iframe
              key={selectedVideo.id}
              src={`https://player.bilibili.com/player.html?bvid=${selectedVideo.bvid}&autoplay=0&danmaku=0&poster=1`}
              title={selectedVideo.title}
              className="aspect-video w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => {
                setStartedAt((current) => current ?? Date.now());
                setIsBlockedByLimit(false);
              }}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] bg-butter/80 p-4 text-sm leading-6 text-ink">
            已到家长设置的观看时长上限，这一轮先休息一下。你可以返回列表，或者稍后继续打开这段动画。
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={selectedVideo.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-peach px-5 font-semibold text-ink shadow-bubble transition active:scale-95"
            onClick={() => onReward("去 B站继续看动画啦！")}
          >
            ↗ 去 B站播放
          </a>
          <div className="inline-flex min-h-[48px] items-center rounded-full bg-white/80 px-5 text-sm font-semibold text-ink/75 shadow-bubble">
            站内用 iframe 播放，异常时可直接跳转 B站。
          </div>
        </div>
      </section>
    </div>
  );
}
