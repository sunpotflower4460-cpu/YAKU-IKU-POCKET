import { Plant, Rarity } from '../types';
import { PLANTS } from '../data/plants';
import { getCurrentSeason, isPlantInSeason } from './season';

// Rarity weights: common plants appear more frequently
const RARITY_WEIGHTS: Record<Rarity, number> = {
  1: 5,  // ★ very common
  2: 35, // ★★ common
  3: 35, // ★★★ uncommon
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
  const candidates = PLANTS.filter((p) => p.rarity === rarity);

  // 65% chance to pick an in-season plant when available
  const inSeason = candidates.filter((p) => isPlantInSeason(p.season, season));
  let plant: Plant;
  if (inSeason.length > 0 && Math.random() < 0.65) {
    plant = inSeason[Math.floor(Math.random() * inSeason.length)];
  } else {
    plant = candidates[Math.floor(Math.random() * candidates.length)];
  }

  const confidence = Math.floor(72 + Math.random() * 28); // 72-99%
  const isNewDiscovery = !discoveredIds.includes(plant.id);

  return { plant, confidence, isNewDiscovery };
}
