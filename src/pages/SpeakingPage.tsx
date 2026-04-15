import { useEffect, useMemo, useRef, useState } from "react";
import { ListeningItem, SettingsState } from "../types";

interface SpeakingPageProps {
  items: ListeningItem[];
  settings: SettingsState;
  onReward: (message: string, options?: { stars?: number; badge?: boolean }) => void;
  initialCurrentId: string | null;
  onPositionChange: (id: string | null) => void;
  onSpokenComplete: (id: string) => void;
}

export function SpeakingPage({
  items,
  settings,
  onReward,
  initialCurrentId,
  onPositionChange,
  onSpokenComplete,
}: SpeakingPageProps) {
  const filteredItems = useMemo(
    () => items.filter((item) => item.difficulty === settings.speakingDifficulty),
    [items, settings.speakingDifficulty],
  );
  const [currentId, setCurrentId] = useState<string | null>(initialCurrentId);
  const [status, setStatus] = useState("点击麦克风开始跟读");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  async function startRecording() {
    try {
      setPermissionError(null);
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        if (chunksRef.current.length === 0) {
          setStatus("没有录到声音，再试一次吧");
          return;
        }

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 900) {
          setStatus("声音太小啦，再试一次吧");
          return;
        }

        const nextUrl = URL.createObjectURL(blob);
        setRecordingUrl(nextUrl);
        setStatus("录音完成，来听听自己的声音吧");
        onSpokenComplete(currentItem.id);
        onReward("Great! 你勇敢开口啦！", { stars: 1 });
      };

      recorder.start();
      setIsRecording(true);
      setStatus("录音中，请大声跟读");
      timeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, 5000);
    } catch {
      setPermissionError("请允许麦克风权限哦");
      setStatus("请允许麦克风权限哦");
    }
  }

  function stopRecording() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  if (!currentItem) {
    return <div className="rounded-[28px] bg-white/80 p-6 shadow-bubble">还没有可跟读的内容。</div>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] bg-white/80 p-6 text-center shadow-bubble">
        <div className="text-7xl">{currentItem.image}</div>
        <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{currentItem.text}</h2>
        <p className="mt-3 text-base text-ink/70">{status}</p>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`mt-6 inline-flex h-28 w-28 items-center justify-center rounded-full text-5xl shadow-bubble transition active:scale-95 ${
            isRecording ? "animate-bounceSoft bg-peach" : "bg-skysoft"
          }`}
          aria-label="麦克风"
        >
          🎤
        </button>
        {permissionError ? <p className="mt-4 text-sm font-semibold text-rose-500">{permissionError}</p> : null}
        {recordingUrl ? (
          <div className="mt-5 rounded-[24px] bg-cream p-4">
            <p className="mb-2 text-sm font-semibold text-ink/70">录音回放</p>
            <audio controls className="w-full" src={recordingUrl} />
          </div>
        ) : null}
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
