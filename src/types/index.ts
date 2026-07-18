export type DangerLevel = 'GREEN' | 'YELLOW' | 'RED';
export type Rarity = 1 | 2 | 3 | 4 | 5;
export type PlantCategory = '野草' | 'スパイス・ハーブ';

export interface Plant {
  id: string;
  name: string;
  nameEn: string;
  nameLatin: string;
  category: PlantCategory;
  rarity: Rarity;
  danger: DangerLevel;
  emoji: string;
  description: string;
  effects: string[];
  habitat: string;
  season: string;
  warningNote?: string;
}

export interface ScanRecord {
  id: string;
  plantId: string;
  scannedAt: string; // ISO string
  imageUri?: string; // user's captured photo URI
  /** Optional self-set reminder to come back and re-observe this plant (e.g. when it flowers). PR17. */
  revisitAt?: string; // ISO date string
}

/**
 * An observation saved without a plant match (v3 §6.1 「そのまま記録する」).
 * Kept as its own list rather than folded into ScanRecord/plantId so the
 * "picture of something I couldn't identify" case never needs a fake or
 * nullable plantId threaded through every ScanRecord consumer.
 */
export interface UnidentifiedObservation {
  id: string;
  observedAt: string; // ISO string
  imageUri?: string;
  note?: string;
  revisitAt?: string; // ISO date string
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
}
