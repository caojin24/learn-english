import { PhraseItem } from "../types";

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function pickRecommendedPhraseIds(
  phrases: PhraseItem[],
  completedIds: string[],
  currentIds: string[],
): { ids: string[]; seed: string } {
  const seed = todayKey();
  const incomplete = phrases.filter((item) => !completedIds.includes(item.id));
  const source = incomplete.length >= 5 ? incomplete : phrases;

  if (currentIds.length === 5 && currentIds.every((id) => source.some((item) => item.id === id))) {
    return { ids: currentIds, seed };
  }

  const start = Math.abs(seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % source.length;
  const ids: string[] = [];

  for (let index = 0; index < source.length && ids.length < Math.min(5, source.length); index += 1) {
    ids.push(source[(start + index) % source.length].id);
  }

  return { ids, seed };
}
