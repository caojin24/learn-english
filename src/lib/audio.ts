import { Accent } from "../types";

const TTS_API_URL = "/api/tts";
const DEFAULT_VOICE = "en-US-AvaNeural";

let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let activeTtsRequestController: AbortController | null = null;

function createPlaybackAbortError() {
  return new DOMException("Playback aborted", "AbortError");
}

function clearActiveAudio() {
  if (!activeAudio) {
    return;
  }

  activeAudio.onended = null;
  activeAudio.onpause = null;
  activeAudio.onerror = null;
  activeAudio.pause();
  activeAudio.removeAttribute("src");
  activeAudio.load();
  activeAudio = null;
}

function revokeActiveAudioUrl() {
  if (!activeAudioUrl) {
    return;
  }

  URL.revokeObjectURL(activeAudioUrl);
  activeAudioUrl = null;
}

function clearActiveTtsRequestController() {
  activeTtsRequestController = null;
}

export function stopPlayback() {
  if (activeTtsRequestController) {
    activeTtsRequestController.abort();
    clearActiveTtsRequestController();
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  clearActiveAudio();
  revokeActiveAudioUrl();
}

export function isPlaybackAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function playAudioWithFallback(
  sources: Array<string | undefined>,
  fallback?: () => Promise<void>,
): Promise<void> {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    try {
      await playSingleAudio(source);
      return;
    } catch {
      // Try next source.
    }
  }

  if (fallback) {
    await fallback();
  }
}

function playSingleAudio(source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stopPlayback();
    const audio = new Audio(source);
    activeAudio = audio;
    let settled = false;

    function finish(handler: () => void) {
      if (settled) {
        return;
      }

      settled = true;
      handler();
    }

    audio.preload = "auto";
    audio.onended = () => {
      finish(() => {
        clearActiveAudio();
        resolve();
      });
    };
    audio.onpause = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const remaining = duration > 0 ? duration - audio.currentTime : Infinity;
      const endedNaturally = audio.ended || (duration > 0 && remaining <= 0.08);

      finish(() => {
        clearActiveAudio();
        if (endedNaturally) {
          resolve();
          return;
        }

        reject(createPlaybackAbortError());
      });
    };
    audio.onerror = () =>
      finish(() => {
        clearActiveAudio();
        reject(new Error(`Audio failed: ${source}`));
      });

    audio
      .play()
      .catch((error) =>
        finish(() => {
          clearActiveAudio();
          reject(error);
        }),
      );
  });
}

export async function speakEdge(text: string): Promise<void> {
  stopPlayback();
  const url = new URL(TTS_API_URL, window.location.origin);
  url.searchParams.set("text", text);
  url.searchParams.set("voice", DEFAULT_VOICE);
  try {
    const controller = new AbortController();
    activeTtsRequestController = controller;
    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    clearActiveTtsRequestController();
    activeAudioUrl = audioUrl;

    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(audioUrl);
      activeAudio = audio;
      let settled = false;

      function finish(handler: () => void) {
        if (settled) {
          return;
        }

        settled = true;
        handler();
      }

      audio.volume = 1;
      audio.onended = () => finish(resolve);
      audio.onpause = () => finish(() => reject(createPlaybackAbortError()));
      audio.onerror = () => finish(() => reject(new Error("TTS audio playback failed")));
      audio.play().catch((error) => finish(() => reject(error)));
    });
  } finally {
    clearActiveTtsRequestController();
    clearActiveAudio();
    revokeActiveAudioUrl();
  }
}

export function speakText(
  text: string,
  accent: Accent,
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onBoundary?: (wordIndex: number) => void;
  },
): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.reject(new Error("Speech synthesis unavailable"));
  }

  return new Promise((resolve, reject) => {
    stopPlayback();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 0.85;
    utterance.pitch = options?.pitch ?? 1.1;
    utterance.volume = options?.volume ?? 1;
    utterance.lang = accent === "british" ? "en-GB" : "en-US";

    const words = text.split(" ");
    utterance.onboundary = (event) => {
      if (event.name !== "word" && event.charIndex >= 0) {
        const passed = text.slice(0, event.charIndex).trim();
        const wordIndex = passed.length === 0 ? 0 : passed.split(/\s+/).length;
        options?.onBoundary?.(Math.min(wordIndex, words.length - 1));
      }
    };

    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") {
        reject(createPlaybackAbortError());
        return;
      }

      reject(new Error("Speech synthesis failed"));
    };

    const voice = selectVoice(accent);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    window.speechSynthesis.speak(utterance);
  });
}

export function selectVoice(accent: Accent): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const preferredLanguages = accent === "british" ? ["en-GB", "en-AU", "en_AU"] : ["en-US", "en_US"];
  const preferredNames = accent === "british" ? ["Neural", "Libby", "Sonia", "Ryan"] : ["Neural", "Jenny", "Ava", "Aria", "Guy"];

  for (const code of preferredLanguages) {
    const exactPreferredVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase() === code.toLowerCase() &&
        preferredNames.some((name) => voice.name.includes(name)),
    );
    if (exactPreferredVoice) {
      return exactPreferredVoice;
    }

    const exactVoice = voices.find((voice) => voice.lang.toLowerCase() === code.toLowerCase());
    if (exactVoice) {
      return exactVoice;
    }
  }

  const englishPreferredVoice = voices.find(
    (voice) =>
      voice.lang.toLowerCase().startsWith("en") &&
      preferredNames.some((name) => voice.name.includes(name)),
  );
  if (englishPreferredVoice) {
    return englishPreferredVoice;
  }

  return voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ?? null;
}

export function buildYoudaoVoiceUrl(word: string, accent: Accent): string {
  const type = accent === "british" ? 1 : 2;
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;
}
