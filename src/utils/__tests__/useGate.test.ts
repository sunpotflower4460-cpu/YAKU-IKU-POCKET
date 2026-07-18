import { determineMaxGate, isCategoryUnlocked, requiredGateForCategory, isGateAtLeast } from '../useGate';

describe('determineMaxGate (v3 §10.3)', () => {
  it('caps at gate0 when identification is not user-confirmed', () => {
    for (const identificationState of ['unidentified', 'candidates'] as const) {
      expect(
        determineMaxGate({ origin: 'store_bought_food', identificationState, hasDangerousLookalike: false })
      ).toBe('gate0');
    }
  });

  it('caps at gate0 when a dangerous look-alike exists, regardless of origin', () => {
    expect(
      determineMaxGate({ origin: 'store_bought_food', identificationState: 'expert_verified', hasDangerousLookalike: true })
    ).toBe('gate0');
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

describe('isGateAtLeast', () => {
  it('orders gates gate0 < gate1 < gate2 < gate3', () => {
    expect(isGateAtLeast('gate2', 'gate1')).toBe(true);
    expect(isGateAtLeast('gate1', 'gate2')).toBe(false);
    expect(isGateAtLeast('gate0', 'gate0')).toBe(true);
  });
});
