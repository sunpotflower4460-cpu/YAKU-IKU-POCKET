import { PLANTS } from '../data/plants';
import { CHALLENGES, SEASONAL_CHALLENGES } from '../data/challenges';
import { ScanRecord, UnidentifiedObservation, PracticeRecord } from '../types';
import { SourceOrigin } from '../types/plantUse';
import { TraitCheck, TraitCheckState } from '../types/traitCheck';

const KNOWN_PLANT_IDS = new Set(PLANTS.map((plant) => plant.id));
const DAILY_CHALLENGE_IDS = new Set(CHALLENGES.map((challenge) => challenge.id));
const SEASONAL_CHALLENGE_IDS = new Set(
  Object.values(SEASONAL_CHALLENGES).flat().map((challenge) => challenge.id)
);
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
const LOCAL_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_MONTH_RE = /^\d{4}-\d{2}$/;
const MAX_RAW_RECORDS_TO_INSPECT = 1000;

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

function nonNegativeSafeInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

function uniqueStrings(
  value: unknown,
  predicate: (item: string) => boolean = () => true,
  max = 1000
): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value.slice(0, MAX_RAW_RECORDS_TO_INSPECT)) {
    if (typeof item !== 'string' || !predicate(item) || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
    if (result.length >= max) break;
  }
  return result;
}

function sanitizeTraitChecks(value: unknown): TraitCheck[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const checks: TraitCheck[] = [];
  const seenTraitIds = new Set<string>();
  for (const raw of value.slice(0, 50)) {
    if (
      !isRecord(raw) ||
      typeof raw.traitId !== 'string' ||
      seenTraitIds.has(raw.traitId) ||
      !TRAIT_STATES.has(raw.state as TraitCheckState)
    ) {
      continue;
    }
    seenTraitIds.add(raw.traitId);
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
    value.id.length === 0 ||
    typeof value.plantId !== 'string' ||
    !KNOWN_PLANT_IDS.has(value.plantId) ||
    typeof value.scannedAt !== 'string' ||
    value.scannedAt.length === 0
  ) {
    return null;
  }

  const record: ScanRecord = {
    id: value.id,
    plantId: value.plantId,
    scannedAt: value.scannedAt,
  };
  if (typeof value.imageUri === 'string' && value.imageUri.length > 0) record.imageUri = value.imageUri;
  if (typeof value.revisitAt === 'string' && LOCAL_DAY_RE.test(value.revisitAt)) record.revisitAt = value.revisitAt;
  if (typeof value.sourceOrigin === 'string' && SOURCE_ORIGINS.has(value.sourceOrigin as SourceOrigin)) {
    record.sourceOrigin = value.sourceOrigin as SourceOrigin;
  }
  const traitChecks = sanitizeTraitChecks(value.traitChecks);
  if (traitChecks) record.traitChecks = traitChecks;
  return record;
}

function sanitizeScanHistory(value: unknown): ScanRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: ScanRecord[] = [];
  const seenIds = new Set<string>();
  const seenImageUris = new Set<string>();

  // Persisted history is newest-first. On duplicate IDs or image URIs, keep the
  // newest valid entry so future updates/deletes have one unambiguous owner.
  for (const raw of value.slice(0, MAX_RAW_RECORDS_TO_INSPECT)) {
    const record = sanitizeScanRecord(raw);
    if (!record || seenIds.has(record.id)) continue;
    if (record.imageUri && seenImageUris.has(record.imageUri)) continue;
    seenIds.add(record.id);
    if (record.imageUri) seenImageUris.add(record.imageUri);
    result.push(record);
    if (result.length >= 100) break;
  }
  return result;
}

function sanitizeUnidentified(
  value: unknown,
  reservedImageUris: ReadonlySet<string>
): UnidentifiedObservation[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: UnidentifiedObservation[] = [];
  const seenIds = new Set<string>();
  const seenImageUris = new Set<string>();

  for (const raw of value.slice(0, MAX_RAW_RECORDS_TO_INSPECT)) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== 'string' ||
      raw.id.length === 0 ||
      seenIds.has(raw.id) ||
      typeof raw.observedAt !== 'string' ||
      raw.observedAt.length === 0
    ) {
      continue;
    }
    const imageUri = typeof raw.imageUri === 'string' && raw.imageUri.length > 0
      ? raw.imageUri
      : undefined;
    // If an old/corrupt save assigned one photo to both an identified and an
    // unidentified entry, prefer the identified history owner. This restores
    // the same one-photo/one-observation invariant enforced by new writes.
    if (imageUri && (reservedImageUris.has(imageUri) || seenImageUris.has(imageUri))) continue;

    seenIds.add(raw.id);
    if (imageUri) seenImageUris.add(imageUri);
    result.push({
      id: raw.id,
      observedAt: raw.observedAt,
      ...(imageUri ? { imageUri } : {}),
      ...(typeof raw.note === 'string' ? { note: raw.note } : {}),
      ...(typeof raw.revisitAt === 'string' && LOCAL_DAY_RE.test(raw.revisitAt)
        ? { revisitAt: raw.revisitAt }
        : {}),
    });
    if (result.length >= 100) break;
  }
  return result;
}

function sanitizePracticeRecords(value: unknown): PracticeRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: PracticeRecord[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.slice(0, MAX_RAW_RECORDS_TO_INSPECT)) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== 'string' ||
      raw.id.length === 0 ||
      seenIds.has(raw.id) ||
      typeof raw.plantId !== 'string' ||
      !KNOWN_PLANT_IDS.has(raw.plantId) ||
      typeof raw.category !== 'string' ||
      typeof raw.createdAt !== 'string' ||
      raw.createdAt.length === 0 ||
      typeof raw.note !== 'string'
    ) {
      continue;
    }
    seenIds.add(raw.id);
    result.push({
      id: raw.id,
      plantId: raw.plantId,
      category: raw.category,
      createdAt: raw.createdAt,
      note: raw.note,
    });
    if (result.length >= 200) break;
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
 *
 * Where the data is internally inconsistent but recoverable, repair it rather
 * than throwing user history away (for example, a valid scan whose plant ID is
 * missing from the discovered collection after a partial write).
 */
export function sanitizePersistedGameState(value: unknown): SanitizedPersistedUserData {
  if (!isRecord(value)) return {};
  const out: SanitizedPersistedUserData = {};

  const scanHistory = sanitizeScanHistory(value.scanHistory);
  if (scanHistory) out.scanHistory = scanHistory;

  const rawDiscovered = uniqueStrings(value.discoveredPlantIds, (id) => KNOWN_PLANT_IDS.has(id)) ?? [];
  const repairedDiscovered = [...new Set([
    ...rawDiscovered,
    ...(scanHistory?.map((record) => record.plantId) ?? []),
  ])];
  // If either persisted collection/history field was present, write the repaired
  // collection (possibly empty) so malformed ghost IDs do not survive merge.
  if (Array.isArray(value.discoveredPlantIds) || Array.isArray(value.scanHistory)) {
    out.discoveredPlantIds = repairedDiscovered;
  }

  if (typeof value.playerName === 'string') out.playerName = value.playerName;

  const xp = nonNegativeSafeInteger(value.xp);
  if (xp !== undefined) out.xp = xp;
  const streak = nonNegativeSafeInteger(value.streak);
  if (streak !== undefined) out.streak = streak;
  const todayScanCount = nonNegativeSafeInteger(value.todayScanCount);
  if (todayScanCount !== undefined) out.todayScanCount = todayScanCount;
  const todayNewCount = nonNegativeSafeInteger(value.todayNewCount);
  if (todayNewCount !== undefined) out.todayNewCount = todayNewCount;
  const todayMaxRarity = nonNegativeSafeInteger(value.todayMaxRarity);
  if (todayMaxRarity !== undefined && todayMaxRarity <= 5) out.todayMaxRarity = todayMaxRarity;
  const lastCelebrated = nonNegativeSafeInteger(value.lastCelebrated);
  if (lastCelebrated !== undefined) out.lastCelebrated = Math.min(lastCelebrated, PLANTS.length);

  if (typeof value.lastLoginDate === 'string' && LOCAL_DAY_RE.test(value.lastLoginDate)) {
    out.lastLoginDate = value.lastLoginDate;
  }
  if (typeof value.todayDate === 'string' && LOCAL_DAY_RE.test(value.todayDate)) {
    out.todayDate = value.todayDate;
  }
  if (typeof value.seasonalQuestMonth === 'string' && LOCAL_MONTH_RE.test(value.seasonalQuestMonth)) {
    out.seasonalQuestMonth = value.seasonalQuestMonth;
  }

  const todayDangers = uniqueStrings(value.todayDangers, (item) => DANGER_LEVELS.has(item), 3);
  if (todayDangers) out.todayDangers = todayDangers;
  const todayCategories = uniqueStrings(value.todayCategories, (item) => PLANT_CATEGORIES.has(item), 2);
  if (todayCategories) out.todayCategories = todayCategories;

  const claimedChallengeIds = uniqueStrings(
    value.claimedChallengeIds,
    (id) => DAILY_CHALLENGE_IDS.has(id),
    CHALLENGES.length
  );
  if (claimedChallengeIds) out.claimedChallengeIds = claimedChallengeIds;
  const claimedSeasonalQuestIds = uniqueStrings(
    value.claimedSeasonalQuestIds,
    (id) => SEASONAL_CHALLENGE_IDS.has(id),
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

  const identifiedImageUris = new Set(
    scanHistory?.flatMap((record) => record.imageUri ? [record.imageUri] : []) ?? []
  );
  const unidentifiedObservations = sanitizeUnidentified(
    value.unidentifiedObservations,
    identifiedImageUris
  );
  if (unidentifiedObservations) out.unidentifiedObservations = unidentifiedObservations;

  const practiceRecords = sanitizePracticeRecords(value.practiceRecords);
  if (practiceRecords) out.practiceRecords = practiceRecords;

  return out;
}
