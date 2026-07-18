import { getTodayLearnCard } from '../learnCard';

describe('getTodayLearnCard', () => {
  it('returns null when nothing has been discovered', () => {
    expect(getTodayLearnCard('2026-07-18', [])).toBeNull();
  });

  it('prioritises a plant with a dangerous look-alike when discovered', () => {
    // p008 = セリ, has two catalogued look-alikes (ドクゼリ, ドクニンジン) in src/data/safety.ts
    const card = getTodayLearnCard('2026-07-18', ['p008']);
    expect(card).not.toBeNull();
    expect(card!.plant.id).toBe('p008');
    expect(card!.isSafetyTip).toBe(true);
    expect(card!.tip.includes('ドクゼリ') || card!.tip.includes('ドクニンジン')).toBe(true);
  });

  it('rotates through all of a plant\'s catalogued look-alikes across different dates, not just the first', () => {
    // p008 = セリ has 2 look-alikes; scanning enough dates should surface both.
    const seenRisks = new Set<string>();
    for (let day = 1; day <= 28; day++) {
      const dateStr = `2026-01-${String(day).padStart(2, '0')}`;
      const card = getTodayLearnCard(dateStr, ['p008']);
      if (card!.tip.includes('ドクゼリ')) seenRisks.add('ドクゼリ');
      if (card!.tip.includes('ドクニンジン')) seenRisks.add('ドクニンジン');
    }
    expect(seenRisks.size).toBe(2);
  });

  it('falls back to a general tip when no discovered plant has a look-alike', () => {
    // p001 = タンポポ, no catalogued look-alike
    const card = getTodayLearnCard('2026-07-18', ['p001']);
    expect(card).not.toBeNull();
    expect(card!.plant.id).toBe('p001');
    expect(card!.isSafetyTip).toBe(false);
  });

  it('is deterministic for the same date and input', () => {
    const a = getTodayLearnCard('2026-01-01', ['p001', 'p002']);
    const b = getTodayLearnCard('2026-01-01', ['p001', 'p002']);
    expect(a?.plant.id).toBe(b?.plant.id);
  });
});
