import { determineMaxGate, isCategoryUnlocked, isUseUnlocked, requiredGateForCategory, isGateAtLeast } from '../useGate';
import { PlantUse } from '../../types/plantUse';

function makeUse(overrides: Partial<PlantUse> = {}): PlantUse {
  return {
    id: 'p001_cook',
    plantId: 'p001',
    category: 'food',
    title: '料理に使う',
    summary: 'test',
    partsUsed: [],
    allowedOrigins: ['store_bought_food', 'home_grown_verified'],
    evidenceLevel: 'official_guidance',
    warnings: [],
    contraindications: [],
    sourceRefs: [],
    ...overrides,
  };
}

describe('determineMaxGate (v3 §10.3)', () => {
  it('caps at gate0 when identification is not user-confirmed', () => {
    for (const identificationState of ['unidentified', 'candidates'] as const) {
      expect(
        determineMaxGate({ origin: 'store_bought_food', identificationState, hasDangerousLookalike: false })
      ).toBe('gate0');
    }
  });

  it('caps at gate0 when a dangerous look-alike exists AND the origin is a field identification (wild/unknown)', () => {
    for (const origin of ['wild_observed', 'wild_collected', 'unknown'] as const) {
      expect(
        determineMaxGate({ origin, identificationState: 'expert_verified', hasDangerousLookalike: true })
      ).toBe('gate0');
    }
  });

  it('does NOT cap at gate0 for a dangerous look-alike when the origin is store-bought/verified — the specimen was not field-identified', () => {
    // A species can have a dangerous WILD look-alike (e.g. ゴボウ vs チョウセンアサガオ)
    // without that risk applying to a specimen bought at a grocery store.
    for (const origin of ['store_bought_food', 'store_bought_herb', 'home_grown_verified', 'nursery_plant'] as const) {
      expect(
        determineMaxGate({ origin, identificationState: 'expert_verified', hasDangerousLookalike: true })
      ).toBe('gate2');
    }
  });

  it('reaches gate2 for store-bought or verified-home-grown specimens once confirmed', () => {
    for (const origin of ['store_bought_food', 'store_bought_herb', 'home_grown_verified', 'nursery_plant'] as const) {
      expect(
        determineMaxGate({ origin, identificationState: 'user_selected', hasDangerousLookalike: false })
      ).toBe('gate2');
    }
  });

  it('caps wild observation/collection at gate1 (no gate3 harvest instructions in this release)', () => {
    expect(
      determineMaxGate({ origin: 'wild_observed', identificationState: 'expert_verified', hasDangerousLookalike: false })
    ).toBe('gate1');
    expect(
      determineMaxGate({ origin: 'wild_collected', identificationState: 'expert_verified', hasDangerousLookalike: false })
    ).toBe('gate1');
  });

  it('caps unknown origin at gate0', () => {
    expect(
      determineMaxGate({ origin: 'unknown', identificationState: 'expert_verified', hasDangerousLookalike: false })
    ).toBe('gate0');
  });

  it('caps a RED (inherently dangerous) plant at gate0 even for store-bought origin — belt-and-suspenders', () => {
    expect(
      determineMaxGate({
        origin: 'store_bought_food',
        identificationState: 'expert_verified',
        hasDangerousLookalike: false,
        plantDanger: 'RED',
      })
    ).toBe('gate0');
  });
});

describe('requiredGateForCategory / isCategoryUnlocked', () => {
  it('never unlocks ingestion categories below gate2', () => {
    for (const category of ['food', 'drink', 'traditional_medicine'] as const) {
      expect(requiredGateForCategory(category)).toBe('gate2');
      expect(isCategoryUnlocked(category, 'gate1')).toBe(false);
      expect(isCategoryUnlocked(category, 'gate2')).toBe(true);
    }
  });

  it('allows learning-only categories at gate0', () => {
    expect(isCategoryUnlocked('ecology', 'gate0')).toBe(true);
    expect(isCategoryUnlocked('culture', 'gate0')).toBe(true);
  });

  it('requires at least gate1 for cultivation/garden/decoration', () => {
    expect(isCategoryUnlocked('cultivation', 'gate0')).toBe(false);
    expect(isCategoryUnlocked('cultivation', 'gate1')).toBe(true);
  });
});

describe('isUseUnlocked (PR34 — enforces PlantUse.allowedOrigins, not just the category gate)', () => {
  it('unlocks when the gate is reached AND the origin is in allowedOrigins', () => {
    const use = makeUse({ allowedOrigins: ['store_bought_food', 'home_grown_verified'] });
    expect(isUseUnlocked(use, 'gate2', 'store_bought_food')).toBe(true);
    expect(isUseUnlocked(use, 'gate2', 'home_grown_verified')).toBe(true);
  });

  it('stays locked when the gate is reached but the origin is NOT in allowedOrigins — closes the nursery_plant/store_bought_herb gap', () => {
    // A real, cited food card (e.g. ゴボウ's きんぴら) only names store_bought_food/
    // home_grown_verified as its allowedOrigins. Before PR34, isCategoryUnlocked
    // alone would have unlocked this for ANY origin reaching gate2, including
    // nursery_plant — an origin this app has no more ability to verify than a
    // wild find.
    const use = makeUse({ allowedOrigins: ['store_bought_food', 'home_grown_verified'] });
    expect(isUseUnlocked(use, 'gate2', 'nursery_plant')).toBe(false);
    expect(isUseUnlocked(use, 'gate2', 'store_bought_herb')).toBe(false);
  });

  it('stays locked when the gate itself is not reached, regardless of origin', () => {
    const use = makeUse({ allowedOrigins: ['store_bought_food'] });
    expect(isUseUnlocked(use, 'gate1', 'store_bought_food')).toBe(false);
  });

  it('treats an empty allowedOrigins as unrestricted (unlocked whenever the gate is reached)', () => {
    const use = makeUse({ category: 'ecology', allowedOrigins: [] });
    expect(isUseUnlocked(use, 'gate0', 'unknown')).toBe(true);
  });
});

describe('isGateAtLeast', () => {
  it('orders gates gate0 < gate1 < gate2 < gate3', () => {
    expect(isGateAtLeast('gate2', 'gate1')).toBe(true);
    expect(isGateAtLeast('gate1', 'gate2')).toBe(false);
    expect(isGateAtLeast('gate0', 'gate0')).toBe(true);
  });
});
