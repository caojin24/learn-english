import { Accent } from "../types";

const TTS_API_URL = "/api/tts";
const DEFAULT_VOICE = "en-US-AvaNeural";

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
    const audio = new Audio(source);
    audio.preload = "auto";
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`Audio failed: ${source}`));

    audio
      .play()
      .then(() => {
        audio.onpause = () => resolve();
      })
      .catch(reject);
  });
}

export async function speakEdge(text: string): Promise<void> {
  const url = new URL(TTS_API_URL, window.location.origin);
  url.searchParams.set("text", text);
  url.searchParams.set("voice", DEFAULT_VOICE);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`);
  }

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);

  try {
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.volume = 1;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("TTS audio playback failed"));
      audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(audioUrl);
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
    utterance.onerror = () => reject(new Error("Speech synthesis failed"));

    const voice = selectVoice(accent);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    window.speechSynthesis.cancel();
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
