import rawWordItems from "./word.json";
import { GameWordItem, WordJsonItem } from "../types";
import { buildYoudaoVoiceUrl } from "../lib/audio";

function slugifyWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const wordJsonItems = rawWordItems as WordJsonItem[];

export const gameWordItems: GameWordItem[] = wordJsonItems.map((item, index) => ({
  id: `game-word-${index + 1}-${slugifyWord(item.word)}`,
  word: item.word,
  meaningZh: item.gameMeaningZh,
  audio: {
    american: buildYoudaoVoiceUrl(item.word, "american"),
    british: buildYoudaoVoiceUrl(item.word, "british"),
  },
}));
