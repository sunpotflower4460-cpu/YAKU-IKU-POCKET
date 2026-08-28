import { sanitizePersistedGameState } from '../persistSanitizer';
import { PLANTS } from '../../data/plants';

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
    const scans = safe.scanHistory as Array<Record<string, unknown>>;

    expect(scans).toHaveLength(100);
    expect(scans[0].sourceOrigin).toBeUndefined();
    expect(scans[1].sourceOrigin).toBe('wild_observed');
    expect(scans[0].traitChecks).toEqual([{ traitId: 'leaf', state: 'match', userNote: 'ok' }]);
  });
});
