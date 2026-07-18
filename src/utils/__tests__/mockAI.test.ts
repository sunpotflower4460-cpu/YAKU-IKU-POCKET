import { recognizePlant } from '../mockAI';

// The mock simulates a 1.5–3s network delay via setTimeout; run it instantly.
let timeoutSpy: jest.SpyInstance;
beforeAll(() => {
  timeoutSpy = jest
    .spyOn(global, 'setTimeout')
    .mockImplementation(((fn: () => void) => {
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout);
});
afterAll(() => timeoutSpy.mockRestore());

describe('mock AI (demo engine)', () => {
  it('never returns an undefined plant across many runs (rarity-1 guard)', async () => {
    // The dataset has no rarity-1 plants; the weight-0 + empty-pool guard must
    // ensure a valid plant is always returned.
    for (let i = 0; i < 200; i++) {
      const result = await recognizePlant([]);
      expect(result.plant).toBeDefined();
      expect(typeof result.plant.id).toBe('string');
      expect(result.plant.rarity).toBeGreaterThanOrEqual(2);
    }
  });

  it('returns a confidence in the demo range', async () => {
    const result = await recognizePlant([]);
    expect(result.confidence).toBeGreaterThanOrEqual(72);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });
});
