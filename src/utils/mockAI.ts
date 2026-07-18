import { Plant, Rarity } from '../types';
import { PLANTS } from '../data/plants';
import { getCurrentSeason, isPlantInSeason } from './season';

// Rarity weights: common plants appear more frequently.
// NOTE: the dataset currently contains no rarity-1 plants, so its weight is 0
// to avoid selecting an empty candidate pool (see pickRarity fallback below).
const RARITY_WEIGHTS: Record<Rarity, number> = {
  1: 0,  // ★ (no rarity-1 plants in dataset)
  2: 38, // ★★ common
  3: 37, // ★★★ uncommon
  4: 20, // ★★★★ rare
  5: 5,  // ★★★★★ legendary
};

function pickRarity(): Rarity {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of [1, 2, 3, 4, 5] as Rarity[]) {
    cumulative += RARITY_WEIGHTS[rarity];
    if (rand < cumulative) return rarity;
  }
  return 2;
}

export interface ScanResult {
  plant: Plant;
  confidence: number; // 0-100
  isNewDiscovery: boolean;
  reason?: string; // AI判断根拠テキスト（Claude使用時のみ）
}

/**
 * Mock AI plant recognition.
 * Returns a plant weighted by rarity and biased toward the current season.
 * Replace this function body with real API call in Phase 2.
 */
export async function recognizePlant(
  discoveredIds: string[]
): Promise<ScanResult> {
  // Simulate network delay (1.5s – 3s)
  const delay = 1500 + Math.random() * 1500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const season = getCurrentSeason();
  const rarity = pickRarity();
  // Fall back to the full list if the chosen rarity has no plants, so the
  // pool is never empty (prevents `undefined.id` crashes).
  const candidates = PLANTS.filter((p) => p.rarity === rarity);
  const pool = candidates.length > 0 ? candidates : PLANTS;

  // 65% chance to pick an in-season plant when available
  const inSeason = pool.filter((p) => isPlantInSeason(p.season, season));
  let plant: Plant;
  if (inSeason.length > 0 && Math.random() < 0.65) {
    plant = inSeason[Math.floor(Math.random() * inSeason.length)];
  } else {
    plant = pool[Math.floor(Math.random() * pool.length)];
  }

  const confidence = Math.floor(72 + Math.random() * 28); // 72-99%
  const isNewDiscovery = !discoveredIds.includes(plant.id);

  return { plant, confidence, isNewDiscovery };
}
