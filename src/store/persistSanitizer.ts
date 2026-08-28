import { PLANTS } from '../data/plants';
import { CHALLENGES, SEASONAL_CHALLENGES } from '../data/challenges';
import { ScanRecord, UnidentifiedObservation, PracticeRecord } from '../types';
import { SourceOrigin } from '../types/plantUse';
import { TraitCheck, TraitCheckState } from '../types/traitCheck';

const KNOWN_PLANT_IDS = new Set(PLANTS.map((plant) => plant.id));
const KNOWN_CHALLENGE_IDS = new Set([
  ...CHALLENGES.map((challenge) => challenge.id),
  ...Object.values(SEASONAL_CHALLENGES).flat().map((challenge) => challenge.id),
]);
const DANGER_LEVELS = new Set(['GREEN', 'YELLOW', 'RED']);
const PLANT_CATEGORIES = new Set(['野草', 'スパイス・ハーブ']);
const THEME_MODES = new Set(['system', 'light', 'dark']);
const TRAIT_STATES = new Set<TraitCheckState>(['match', 'mismatch', 'unknown']);
const SOURCE_ORIGINS = new Set<SourceOrigin>([
  'wild_observed',
  'wild_collected',
  'home_grown_verified',
  'nursery_plant',
  'store_bought_food',
  'store_bought_herb',
  'unknown',
]);

export interface PersistedUserData {
  discoveredPlantIds: string[];
  scanHistory: ScanRecord[];
  playerName: string;
  xp: number;
  streak: number;
  lastLoginDate: string;
  todayDate: string;
  todayScanCount: number;
  todayNewCount: number;
  todayMaxRarity: number;
  todayDangers: string[];
  todayCategories: string[];
  claimedChallengeIds: string[];
  hasOnboarded: boolean;
  lastCelebrated: number;
  favoritePlantIds: string[];
  plantNotes: Record<string, string>;
  claimedSeasonalQuestIds: string[];
  seasonalQuestMonth: string;
  themeOverride: 'system' | 'light' | 'dark';
  aiConsentGiven: boolean;
  viewedSafetyCardPlantIds: string[];
  hasComparedCandidates: boolean;
  unidentifiedObservations: UnidentifiedObservation[];
  practiceRecords: PracticeRecord[];
}

export type SanitizedPersistedUserData = Partial<PersistedUserData>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function finiteNonNegativeInteger(value: unknown): number | undefined {
  const number = finiteNonNegativeNumber(value);
  return number !== undefined ? Math.floor(number) : undefined;
}

function uniqueStrings(
  value: unknown,
  predicate: (item: string) => boolean = () => true,
  max = 1000
): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return [...new Set(
    value
      .filter((item): item is string => typeof item === 'string' && predicate(item))
      .slice(0, max)
  )];
}

function sanitizeTraitChecks(value: unknown): TraitCheck[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const checks: TraitCheck[] = [];
  for (const raw of value.slice(0, 50)) {
    if (!isRecord(raw) || typeof raw.traitId !== 'string' || !TRAIT_STATES.has(raw.state as TraitCheckState)) {
      continue;
    }
    checks.push({
      traitId: raw.traitId,
      state: raw.state as TraitCheckState,
      ...(typeof raw.userNote === 'string' ? { userNote: raw.userNote } : {}),
    });
  }
  return checks.length > 0 ? checks : undefined;
}

function sanitizeScanRecord(value: unknown): ScanRecord | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.plantId !== 'string' ||
    !KNOWN_PLANT_IDS.has(value.plantId) ||
    typeof value.scannedAt !== 'string'
  ) {
    return null;
  }

  const record: ScanRecord = {
    id: value.id,
    plantId: value.plantId,
    scannedAt: value.scannedAt,
  };
  if (typeof value.imageUri === 'string') record.imageUri = value.imageUri;
  if (typeof value.revisitAt === 'string') record.revisitAt = value.revisitAt;
  if (typeof value.sourceOrigin === 'string' && SOURCE_ORIGINS.has(value.sourceOrigin as SourceOrigin)) {
    record.sourceOrigin = value.sourceOrigin as SourceOrigin;
  }
  const traitChecks = sanitizeTraitChecks(value.traitChecks);
  if (traitChecks) record.traitChecks = traitChecks;
  return record;
}

function sanitizeScanHistory(value: unknown): ScanRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map(sanitizeScanRecord)
    .filter((record): record is ScanRecord => record !== null)
    .slice(0, 100);
}

function sanitizeUnidentified(value: unknown): UnidentifiedObservation[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: UnidentifiedObservation[] = [];
  for (const raw of value.slice(0, 100)) {
    if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.observedAt !== 'string') continue;
    result.push({
      id: raw.id,
      observedAt: raw.observedAt,
      ...(typeof raw.imageUri === 'string' ? { imageUri: raw.imageUri } : {}),
      ...(typeof raw.note === 'string' ? { note: raw.note } : {}),
      ...(typeof raw.revisitAt === 'string' ? { revisitAt: raw.revisitAt } : {}),
    });
  }
  return result;
}

function sanitizePracticeRecords(value: unknown): PracticeRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: PracticeRecord[] = [];
  for (const raw of value.slice(0, 200)) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== 'string' ||
      typeof raw.plantId !== 'string' ||
      !KNOWN_PLANT_IDS.has(raw.plantId) ||
      typeof raw.category !== 'string' ||
      typeof raw.createdAt !== 'string' ||
      typeof raw.note !== 'string'
    ) {
      continue;
    }
    result.push({
      id: raw.id,
      plantId: raw.plantId,
      category: raw.category,
      createdAt: raw.createdAt,
      note: raw.note,
    });
  }
  return result;
}

function sanitizePlantNotes(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const notes: Record<string, string> = {};
  for (const [plantId, note] of Object.entries(value)) {
    if (KNOWN_PLANT_IDS.has(plantId) && typeof note === 'string') notes[plantId] = note;
  }
  return notes;
}

/**
 * Treat persisted storage as untrusted input. JSON can be syntactically valid
 * while fields have the wrong runtime shape (manual edits, partial writes,
 * old/broken app versions). Returning only validated fields lets Zustand merge
 * them over today's safe defaults instead of hydrating crash-prone values.
 */
export function sanitizePersistedGameState(value: unknown): SanitizedPersistedUserData {
  if (!isRecord(value)) return {};
  const out: SanitizedPersistedUserData = {};

  const discoveredPlantIds = uniqueStrings(value.discoveredPlantIds, (id) => KNOWN_PLANT_IDS.has(id));
  if (discoveredPlantIds) out.discoveredPlantIds = discoveredPlantIds;
  const scanHistory = sanitizeScanHistory(value.scanHistory);
  if (scanHistory) out.scanHistory = scanHistory;
  if (typeof value.playerName === 'string') out.playerName = value.playerName;

  const xp = finiteNonNegativeInteger(value.xp);
  if (xp !== undefined) out.xp = xp;
  const streak = finiteNonNegativeInteger(value.streak);
  if (streak !== undefined) out.streak = streak;
  const todayScanCount = finiteNonNegativeInteger(value.todayScanCount);
  if (todayScanCount !== undefined) out.todayScanCount = todayScanCount;
  const todayNewCount = finiteNonNegativeInteger(value.todayNewCount);
  if (todayNewCount !== undefined) out.todayNewCount = todayNewCount;
  const todayMaxRarity = finiteNonNegativeInteger(value.todayMaxRarity);
  if (todayMaxRarity !== undefined) out.todayMaxRarity = todayMaxRarity;
  const lastCelebrated = finiteNonNegativeInteger(value.lastCelebrated);
  if (lastCelebrated !== undefined) out.lastCelebrated = lastCelebrated;

  if (typeof value.lastLoginDate === 'string') out.lastLoginDate = value.lastLoginDate;
  if (typeof value.todayDate === 'string') out.todayDate = value.todayDate;
  if (typeof value.seasonalQuestMonth === 'string') out.seasonalQuestMonth = value.seasonalQuestMonth;

  const todayDangers = uniqueStrings(value.todayDangers, (item) => DANGER_LEVELS.has(item), 3);
  if (todayDangers) out.todayDangers = todayDangers;
  const todayCategories = uniqueStrings(value.todayCategories, (item) => PLANT_CATEGORIES.has(item), 2);
  if (todayCategories) out.todayCategories = todayCategories;

  const claimedChallengeIds = uniqueStrings(
    value.claimedChallengeIds,
    (id) => KNOWN_CHALLENGE_IDS.has(id),
    CHALLENGES.length
  );
  if (claimedChallengeIds) out.claimedChallengeIds = claimedChallengeIds;
  const claimedSeasonalQuestIds = uniqueStrings(
    value.claimedSeasonalQuestIds,
    (id) => KNOWN_CHALLENGE_IDS.has(id),
    20
  );
  if (claimedSeasonalQuestIds) out.claimedSeasonalQuestIds = claimedSeasonalQuestIds;

  if (typeof value.hasOnboarded === 'boolean') out.hasOnboarded = value.hasOnboarded;
  if (typeof value.aiConsentGiven === 'boolean') out.aiConsentGiven = value.aiConsentGiven;
  if (typeof value.hasComparedCandidates === 'boolean') out.hasComparedCandidates = value.hasComparedCandidates;

  const favoritePlantIds = uniqueStrings(value.favoritePlantIds, (id) => KNOWN_PLANT_IDS.has(id));
  if (favoritePlantIds) out.favoritePlantIds = favoritePlantIds;
  const viewedSafetyCardPlantIds = uniqueStrings(
    value.viewedSafetyCardPlantIds,
    (id) => KNOWN_PLANT_IDS.has(id)
  );
  if (viewedSafetyCardPlantIds) out.viewedSafetyCardPlantIds = viewedSafetyCardPlantIds;

  const plantNotes = sanitizePlantNotes(value.plantNotes);
  if (plantNotes) out.plantNotes = plantNotes;
  if (typeof value.themeOverride === 'string' && THEME_MODES.has(value.themeOverride)) {
    out.themeOverride = value.themeOverride as PersistedUserData['themeOverride'];
  }

  const unidentifiedObservations = sanitizeUnidentified(value.unidentifiedObservations);
  if (unidentifiedObservations) out.unidentifiedObservations = unidentifiedObservations;
  const practiceRecords = sanitizePracticeRecords(value.practiceRecords);
  if (practiceRecords) out.practiceRecords = practiceRecords;

  return out;
}
