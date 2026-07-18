import { buildTraitChecklist } from '../traitChecklist';
import { getPlantById } from '../../data/plants';
import { summarizeTraitChecks } from '../../types/traitCheck';

describe('buildTraitChecklist', () => {
  it('always includes the three universal, data-backed checks', () => {
    const plant = getPlantById('p001')!;
    const items = buildTraitChecklist(plant);
    const ids = items.map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['habitat', 'season', 'appearance']));
    // Every hint must be real per-plant text, never an empty fabricated placeholder.
    for (const item of items) {
      expect(item.referenceHint.length).toBeGreaterThan(0);
    }
  });

  it('adds a look-alike differentiation item for plants with a known dangerous look-alike', () => {
    const nobiru = getPlantById('p007')!; // ノビル — safety.ts lists スイセン/スズラン
    const items = buildTraitChecklist(nobiru);
    expect(items.some((i) => i.id.startsWith('lookalike_'))).toBe(true);
  });

  it('adds no look-alike item for a plant with none catalogued', () => {
    const plain = getPlantById('p001')!;
    const items = buildTraitChecklist(plain);
    expect(items.some((i) => i.id.startsWith('lookalike_'))).toBe(false);
  });
});

describe('summarizeTraitChecks', () => {
  it('tallies match/mismatch/unknown counts', () => {
    const summary = summarizeTraitChecks([
      { traitId: 'a', state: 'match' },
      { traitId: 'b', state: 'match' },
      { traitId: 'c', state: 'mismatch' },
      { traitId: 'd', state: 'unknown' },
    ]);
    expect(summary).toEqual({ match: 2, mismatch: 1, unknown: 1, total: 4 });
  });
});
