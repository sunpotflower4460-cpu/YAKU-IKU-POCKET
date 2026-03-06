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
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
}
