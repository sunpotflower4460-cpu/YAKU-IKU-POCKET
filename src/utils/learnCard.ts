import { Plant } from '../types';
import { PLANTS } from '../data/plants';
import { getSafetyWarnings, hasDangerousLookalike } from '../data/safety';

export interface LearnCard {
  plant: Plant;
  /** Short, single-topic educational blurb (not a medical/edibility claim). */
  tip: string;
  isSafetyTip: boolean;
}

/** Deterministic pick for a given YYYY-MM-DD so the card is stable for the day. */
function pickForDate(dateStr: string, count: number): number {
  let seed = 0;
  for (const ch of dateStr) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(seed) % count;
}

/**
 * Today's "1分で学ぶ" (learn in a minute) card. Prioritises plants with a
 * catalogued dangerous look-alike (teaches the brand's core safety value);
 * falls back to a general observation tip when none is discovered yet.
 */
export function getTodayLearnCard(dateStr: string, discoveredPlantIds: string[]): LearnCard | null {
  const discovered = PLANTS.filter((p) => discoveredPlantIds.includes(p.id));
  const withLookalike = discovered.filter((p) => hasDangerousLookalike(p.id));

  if (withLookalike.length > 0) {
    const plant = withLookalike[pickForDate(dateStr, withLookalike.length)];
    const risk = getSafetyWarnings(plant.id)[0];
    return {
      plant,
      tip: `${plant.name}は${risk.name}と間違えられやすい植物です。${risk.note}`,
      isSafetyTip: true,
    };
  }

  if (discovered.length > 0) {
    const plant = discovered[pickForDate(dateStr, discovered.length)];
    return {
      plant,
      tip: plant.description,
      isSafetyTip: false,
    };
  }

  return null;
}
