import { getSafetyWarnings, hasDangerousLookalike } from '../safety';

describe('safety look-alike rule engine', () => {
  it('flags セリ (p008) as having a deadly look-alike (ドクゼリ)', () => {
    const warnings = getSafetyWarnings('p008');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.name === 'ドクゼリ' && w.severity === 'high_risk')).toBe(true);
    expect(hasDangerousLookalike('p008')).toBe(true);
  });

  it('flags ノビル (p007) and ヨモギ (p002) as risky', () => {
    expect(hasDangerousLookalike('p007')).toBe(true);
    expect(hasDangerousLookalike('p002')).toBe(true);
  });

  it('returns no warnings for a plant without catalogued look-alikes', () => {
    expect(getSafetyWarnings('p001')).toEqual([]);
    expect(hasDangerousLookalike('p001')).toBe(false);
  });

  it('returns empty for an unknown id (never throws)', () => {
    expect(getSafetyWarnings('does-not-exist')).toEqual([]);
  });
});
