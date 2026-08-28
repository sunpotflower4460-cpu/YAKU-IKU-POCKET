import { sanitizePersistedGameState } from '../persistSanitizer';
import { PLANTS } from '../../data/plants';
import { CHALLENGES, SEASONAL_CHALLENGES } from '../../data/challenges';

describe('sanitizePersistedGameState', () => {
  it('returns no persisted overrides for non-object payloads', () => {
    expect(sanitizePersistedGameState(null)).toEqual({});
    expect(sanitizePersistedGameState('corrupt')).toEqual({});
    expect(sanitizePersistedGameState([])).toEqual({});
  });

  it('drops wrong runtime shapes instead of hydrating values that will crash consumers', () => {
    const safe = sanitizePersistedGameState({
      discoveredPlantIds: 'not-an-array',
      scanHistory: { bad: true },
      xp: Number.NaN,
      todayScanCount: -10,
      favoritePlantIds: 42,
      plantNotes: [],
      themeOverride: 'neon',
      aiConsentGiven: 'yes',
    });

    expect(safe).toEqual({});
  });

  it('filters ghost plant ids and malformed records while preserving valid user data', () => {
    const plant = PLANTS[0];
    const safe = sanitizePersistedGameState({
      discoveredPlantIds: [plant.id, '__ghost__', plant.id],
      scanHistory: [
        { id: 'ok', plantId: plant.id, scannedAt: '2026-08-28T00:00:00.000Z', imageUri: 'file://ok.jpg' },
        { id: 'ghost', plantId: '__ghost__', scannedAt: '2026-08-28T00:00:00.000Z' },
        null,
      ],
      favoritePlantIds: ['__ghost__', plant.id],
      viewedSafetyCardPlantIds: [plant.id, '__ghost__'],
      plantNotes: { [plant.id]: 'memo', __ghost__: 'bad' },
      xp: 123,
      themeOverride: 'dark',
      aiConsentGiven: true,
    });

    expect(safe.discoveredPlantIds).toEqual([plant.id]);
    expect(safe.scanHistory).toEqual([
      { id: 'ok', plantId: plant.id, scannedAt: '2026-08-28T00:00:00.000Z', imageUri: 'file://ok.jpg' },
    ]);
    expect(safe.favoritePlantIds).toEqual([plant.id]);
    expect(safe.viewedSafetyCardPlantIds).toEqual([plant.id]);
    expect(safe.plantNotes).toEqual({ [plant.id]: 'memo' });
    expect(safe.xp).toBe(123);
    expect(safe.themeOverride).toBe('dark');
    expect(safe.aiConsentGiven).toBe(true);
  });

  it('caps persisted record arrays and rejects invalid nested trait/source values', () => {
    const plant = PLANTS[0];
    const scanHistory = Array.from({ length: 130 }, (_, index) => ({
      id: `scan_${index}`,
      plantId: plant.id,
      scannedAt: '2026-08-28T00:00:00.000Z',
      sourceOrigin: index === 0 ? 'made_up_origin' : 'wild_observed',
      traitChecks: [
        { traitId: 'leaf', state: 'match', userNote: 'ok' },
        { traitId: 'bad', state: 'definitely' },
      ],
    }));

    const safe = sanitizePersistedGameState({ scanHistory });
    const scans = safe.scanHistory;

    expect(scans).toBeDefined();
    expect(scans).toHaveLength(100);
    expect(scans?.[0].sourceOrigin).toBeUndefined();
    expect(scans?.[1].sourceOrigin).toBe('wild_observed');
    expect(scans?.[0].traitChecks).toEqual([{ traitId: 'leaf', state: 'match', userNote: 'ok' }]);
  });

  it('repairs a partial write by restoring plants referenced by valid scan history to the collection', () => {
    const [a, b] = PLANTS;
    const safe = sanitizePersistedGameState({
      discoveredPlantIds: [a.id],
      scanHistory: [
        { id: 'scan_b', plantId: b.id, scannedAt: '2026-08-28T00:00:00.000Z' },
      ],
    });

    expect(safe.discoveredPlantIds).toEqual([a.id, b.id]);
  });

  it('deduplicates record ids and photo ownership, preferring the newest identified record', () => {
    const [a, b] = PLANTS;
    const shared = 'file:///documents/observations/shared.jpg';
    const safe = sanitizePersistedGameState({
      scanHistory: [
        { id: 'same-id', plantId: a.id, scannedAt: '2026-08-28T02:00:00.000Z', imageUri: shared },
        { id: 'same-id', plantId: b.id, scannedAt: '2026-08-28T01:00:00.000Z' },
        { id: 'other-id', plantId: b.id, scannedAt: '2026-08-28T00:00:00.000Z', imageUri: shared },
      ],
      unidentifiedObservations: [
        { id: 'unid-shared', observedAt: '2026-08-28T00:00:00.000Z', imageUri: shared },
        { id: 'unid-unique', observedAt: '2026-08-28T00:00:00.000Z', imageUri: 'file://unique.jpg' },
        { id: 'unid-unique-2', observedAt: '2026-08-28T00:00:00.000Z', imageUri: 'file://unique.jpg' },
      ],
    });

    expect(safe.scanHistory).toHaveLength(1);
    expect(safe.scanHistory?.[0].plantId).toBe(a.id);
    expect(safe.unidentifiedObservations).toEqual([
      { id: 'unid-unique', observedAt: '2026-08-28T00:00:00.000Z', imageUri: 'file://unique.jpg' },
    ]);
  });

  it('rejects unsafe numeric extremes and impossible rarity counters', () => {
    const safe = sanitizePersistedGameState({
      xp: Number.MAX_SAFE_INTEGER + 1,
      streak: Infinity,
      todayScanCount: 1.5,
      todayMaxRarity: 6,
      lastCelebrated: 999999,
    });

    expect(safe.xp).toBeUndefined();
    expect(safe.streak).toBeUndefined();
    expect(safe.todayScanCount).toBeUndefined();
    expect(safe.todayMaxRarity).toBeUndefined();
    expect(safe.lastCelebrated).toBe(PLANTS.length);
  });

  it('keeps daily and seasonal claimed ids in their own namespaces only', () => {
    const daily = CHALLENGES[0];
    const seasonal = Object.values(SEASONAL_CHALLENGES).flat()[0];
    const safe = sanitizePersistedGameState({
      claimedChallengeIds: [daily.id, seasonal.id],
      claimedSeasonalQuestIds: [seasonal.id, daily.id],
    });

    expect(safe.claimedChallengeIds).toEqual([daily.id]);
    expect(safe.claimedSeasonalQuestIds).toEqual([seasonal.id]);
  });

  it('drops malformed persisted day/month strings that could poison rollover logic', () => {
    const safe = sanitizePersistedGameState({
      lastLoginDate: 'yesterday',
      todayDate: '2026-99',
      seasonalQuestMonth: 'August',
    });

    expect(safe.lastLoginDate).toBeUndefined();
    expect(safe.todayDate).toBeUndefined();
    expect(safe.seasonalQuestMonth).toBeUndefined();
  });
});
