import { toLocalDateStr, localDayFromISO, localDateStrOffset, todayLocalStr } from '../date';

describe('date helpers (local / JST-aware)', () => {
  it('formats a Date as local YYYY-MM-DD', () => {
    // Local components, not UTC. Build a date from local parts and expect them back.
    const d = new Date(2026, 0, 5, 1, 30); // 2026-01-05 01:30 local
    expect(toLocalDateStr(d)).toBe('2026-01-05');
  });

  it('zero-pads month and day', () => {
    expect(toLocalDateStr(new Date(2026, 8, 9))).toBe('2026-09-09');
  });

  it('localDayFromISO uses the local day of an absolute instant', () => {
    const iso = new Date(2026, 2, 15, 12, 0).toISOString();
    expect(localDayFromISO(iso)).toBe('2026-03-15');
  });

  it('todayLocalStr matches toLocalDateStr(now)', () => {
    expect(todayLocalStr()).toBe(toLocalDateStr(new Date()));
  });

  it('localDateStrOffset(-1) is the day before today', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    expect(localDateStrOffset(-1)).toBe(toLocalDateStr(yesterday));
  });
});
