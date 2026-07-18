import { seasonForMonth, seasonForDate, isPlantInSeason } from '../season';

describe('seasonForMonth', () => {
  it('maps each month to the correct season', () => {
    expect(seasonForMonth(3)).toBe('春');
    expect(seasonForMonth(5)).toBe('春');
    expect(seasonForMonth(6)).toBe('夏');
    expect(seasonForMonth(8)).toBe('夏');
    expect(seasonForMonth(9)).toBe('秋');
    expect(seasonForMonth(11)).toBe('秋');
    expect(seasonForMonth(12)).toBe('冬');
    expect(seasonForMonth(1)).toBe('冬');
    expect(seasonForMonth(2)).toBe('冬');
  });
});

describe('seasonForDate', () => {
  it('derives the season from an arbitrary local date', () => {
    expect(seasonForDate(new Date(2026, 0, 15))).toBe('冬'); // January
    expect(seasonForDate(new Date(2026, 6, 1))).toBe('夏'); // July
  });
});

describe('isPlantInSeason (regression)', () => {
  it('still handles range and wrap-around patterns', () => {
    expect(isPlantInSeason('春〜秋（3月〜11月）', '夏')).toBe(true);
    expect(isPlantInSeason('秋〜春', '冬')).toBe(true);
    expect(isPlantInSeason('通年', '夏')).toBe(true);
  });
});
