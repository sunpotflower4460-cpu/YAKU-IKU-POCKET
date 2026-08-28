import { useGameStore } from '../useGameStore';

jest.mock('../../utils/observationPhotoStorage', () => ({
  clearObservationPhotos: jest.fn(),
  deleteObservationPhoto: jest.fn(),
}));

describe('session rollover from unidentified-only activity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('advances the day and clears stale daily claims without granting scan progress', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 28, 23, 59, 59));
    useGameStore.setState({
      todayDate: '2026-08-28',
      lastLoginDate: '2026-08-28',
      seasonalQuestMonth: '2026-08',
      todayScanCount: 7,
      todayNewCount: 3,
      todayMaxRarity: 5,
      todayDangers: ['RED'],
      todayCategories: ['野草'],
      claimedChallengeIds: ['stale-claim'],
      unidentifiedObservations: [],
    });

    jest.setSystemTime(new Date(2026, 7, 29, 0, 0, 1));
    useGameStore.getState().recordUnidentifiedObservation('file://mystery.jpg');

    const state = useGameStore.getState();
    expect(state.todayDate).toBe('2026-08-29');
    expect(state.claimedChallengeIds).toEqual([]);
    expect(state.todayScanCount).toBe(0);
    expect(state.todayNewCount).toBe(0);
    expect(state.todayMaxRarity).toBe(0);
    expect(state.todayDangers).toEqual([]);
    expect(state.todayCategories).toEqual([]);
    expect(state.unidentifiedObservations).toHaveLength(1);
  });
});
