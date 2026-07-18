import { TraitCheck } from './traitCheck';
import { SourceOrigin } from './plantUse';

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
  /** The user's 現物確認 checklist against this candidate, if they used it (v3 §7.3, PR18). */
  traitChecks?: TraitCheck[];
  /** How this specimen was obtained — gates which 暮らし content categories can be shown (v3 §10.2/10.3, PR22). */
  sourceOrigin?: SourceOrigin;
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

/**
 * A personal journal entry for something the user actually did with a plant
 * (pressed it, sketched it, grew it, cooked with a store-bought version...).
 * Free-form and user-authored — the app never generates the content of a
 * PracticeRecord (v3 §9.1/§11.3, PR22).
 */
export interface PracticeRecord {
  id: string;
  plantId: string;
  category: string;
  createdAt: string; // ISO string
  note: string;
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
}
