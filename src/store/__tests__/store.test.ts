import { useGameStore, RARITY_XP, XP_PER_RESCAN } from '../useGameStore';
import { PLANTS } from '../../data/plants';
import { CHALLENGES, getDailyChallenges, SEASONAL_CHALLENGES } from '../../data/challenges';
import { todayLocalStr } from '../../utils/date';
import { getCurrentSeason, getSeasonalPlants } from '../../utils/season';
import * as observationPhotoStorage from '../../utils/observationPhotoStorage';

jest.mock('../../utils/observationPhotoStorage', () => ({
  clearObservationPhotos: jest.fn(),
  deleteObservationPhoto: jest.fn(),
}));

const mockDeleteObservationPhoto = observationPhotoStorage.deleteObservationPhoto as jest.MockedFunction<
  typeof observationPhotoStorage.deleteObservationPhoto
>;

function setCompletedDailyProgress(): void {
  const today = todayLocalStr();
  useGameStore.setState({
    todayDate: today,
    lastLoginDate: today,
    seasonalQuestMonth: today.slice(0, 7),
    todayScanCount: 20,
    todayNewCount: 10,
    todayMaxRarity: 5,
    todayDangers: ['GREEN', 'YELLOW', 'RED'],
    todayCategories: ['野草', 'スパイス・ハーブ'],
  });
}

// Reset the relevant slice of state before each test.
beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  useGameStore.setState({
    discoveredPlantIds: [],
    scanHistory: [],
    xp: 0,
    streak: 0,
    lastLoginDate: '',
    claimedChallengeIds: [],
    claimedSeasonalQuestIds: [],
    seasonalQuestMonth: '',
    todayDate: '',
    todayScanCount: 0,
    todayNewCount: 0,
    todayMaxRarity: 0,
    todayDangers: [],
    todayCategories: [],
    playerName: 'ハーブマスター',
    plantNotes: {},
    favoritePlantIds: [],
    themeOverride: 'system',
    aiConsentGiven: false,
    viewedSafetyCardPlantIds: [],
    hasComparedCandidates: false,
    unidentifiedObservations: [],
    practiceRecords: [],
  });
});

describe('claimChallenge / claimSeasonalChallenge reward integrity', () => {
  it('uses the trusted daily reward and does not award the same completed quest twice', () => {
    setCompletedDailyProgress();
    const challenge = getDailyChallenges(todayLocalStr())[0];
    const { claimChallenge } = useGameStore.getState();

    claimChallenge(challenge.id);
    claimChallenge(challenge.id); // duplicate

    const s = useGameStore.getState();
    expect(s.xp).toBe(challenge.xpReward);
    expect(s.claimedChallengeIds.filter((id) => id === challenge.id)).toHaveLength(1);
  });

  it('rejects a valid global daily challenge that is not one of today\'s three', () => {
    setCompletedDailyProgress();
    const todayIds = new Set(getDailyChallenges(todayLocalStr()).map((challenge) => challenge.id));
    const notToday = CHALLENGES.find((challenge) => !todayIds.has(challenge.id));
    expect(notToday).toBeDefined();

    useGameStore.getState().claimChallenge(notToday!.id);

    expect(useGameStore.getState().xp).toBe(0);
    expect(useGameStore.getState().claimedChallengeIds).toEqual([]);
  });

  it('rejects an incomplete daily challenge even when the id is valid for today', () => {
    const today = todayLocalStr();
    useGameStore.setState({
      todayDate: today,
      lastLoginDate: today,
      seasonalQuestMonth: today.slice(0, 7),
    });
    const challenge = getDailyChallenges(today)[0];

    useGameStore.getState().claimChallenge(challenge.id);

    expect(useGameStore.getState().xp).toBe(0);
    expect(useGameStore.getState().claimedChallengeIds).toEqual([]);
  });

  it('uses the trusted seasonal reward, requires completion, and blocks duplicates', () => {
    const today = todayLocalStr();
    const season = getCurrentSeason();
    const challenge = SEASONAL_CHALLENGES[season][0];
    const seasonalPlant = getSeasonalPlants(season, PLANTS)[0];
    expect(seasonalPlant).toBeDefined();
    useGameStore.setState({
      todayDate: today,
      lastLoginDate: today,
      seasonalQuestMonth: today.slice(0, 7),
      discoveredPlantIds: [seasonalPlant.id],
    });

    const { claimSeasonalChallenge } = useGameStore.getState();
    claimSeasonalChallenge(challenge.id);
    claimSeasonalChallenge(challenge.id);

    const s = useGameStore.getState();
    expect(s.xp).toBe(challenge.xpReward);
    expect(s.claimedSeasonalQuestIds.filter((id) => id === challenge.id)).toHaveLength(1);
  });

  it('rejects a seasonal challenge from a different season', () => {
    const today = todayLocalStr();
    const season = getCurrentSeason();
    const wrongSeason = (Object.keys(SEASONAL_CHALLENGES) as (keyof typeof SEASONAL_CHALLENGES)[])
      .find((candidate) => candidate !== season)!;
    const wrongChallenge = SEASONAL_CHALLENGES[wrongSeason][0];
    useGameStore.setState({
      todayDate: today,
      lastLoginDate: today,
      seasonalQuestMonth: today.slice(0, 7),
      discoveredPlantIds: PLANTS.map((plant) => plant.id),
    });

    useGameStore.getState().claimSeasonalChallenge(wrongChallenge.id);

    expect(useGameStore.getState().xp).toBe(0);
    expect(useGameStore.getState().claimedSeasonalQuestIds).toEqual([]);
  });

  it('rejects unknown challenge ids instead of minting XP', () => {
    setCompletedDailyProgress();
    const { claimChallenge, claimSeasonalChallenge } = useGameStore.getState();
    claimChallenge('__missing_daily__');
    claimSeasonalChallenge('__missing_seasonal__');
    const s = useGameStore.getState();
    expect(s.xp).toBe(0);
    expect(s.claimedChallengeIds).toEqual([]);
    expect(s.claimedSeasonalQuestIds).toEqual([]);
  });
});

describe('session rollover integrity', () => {
  it('rolls the day forward inside recordObservation even if the app stays foregrounded across midnight', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 28, 23, 59, 59));
    useGameStore.setState({
      todayDate: '2026-08-28',
      lastLoginDate: '2026-08-28',
      seasonalQuestMonth: '2026-08',
      todayScanCount: 9,
      todayNewCount: 4,
      todayMaxRarity: 5,
      todayDangers: ['RED'],
      todayCategories: ['野草'],
      claimedChallengeIds: ['old-claim'],
    });

    jest.setSystemTime(new Date(2026, 7, 29, 0, 0, 1));
    const plant = PLANTS[0];
    useGameStore.getState().recordObservation(plant.id);

    const s = useGameStore.getState();
    expect(s.todayDate).toBe('2026-08-29');
    expect(s.todayScanCount).toBe(1);
    expect(s.todayNewCount).toBe(1);
    expect(s.todayMaxRarity).toBe(plant.rarity);
    expect(s.todayDangers).toEqual([plant.danger]);
    expect(s.todayCategories).toEqual([plant.category]);
    expect(s.claimedChallengeIds).toEqual([]);
  });
});

describe('recordObservation (atomic)', () => {
  it('adds discovery, history and XP in a single call', () => {
    const plant = PLANTS[0];
    useGameStore.getState().recordObservation(plant.id, 'file://photo.jpg');
    const s = useGameStore.getState();
    expect(s.discoveredPlantIds).toContain(plant.id);
    expect(s.scanHistory).toHaveLength(1);
    expect(s.scanHistory[0].plantId).toBe(plant.id);
    expect(s.scanHistory[0].imageUri).toBe('file://photo.jpg');
    expect(s.xp).toBe(RARITY_XP[plant.rarity] ?? 100);
  });

  it('awards rescan XP (not first-discovery XP) the second time', () => {
    const plant = PLANTS[0];
    useGameStore.getState().recordObservation(plant.id);
    useGameStore.getState().recordObservation(plant.id);
    const s = useGameStore.getState();
    expect(s.discoveredPlantIds.filter((id) => id === plant.id)).toHaveLength(1);
    expect(s.scanHistory).toHaveLength(2);
    expect(s.xp).toBe((RARITY_XP[plant.rarity] ?? 100) + XP_PER_RESCAN);
  });

  it('does not save or award XP twice for the same persisted photo', () => {
    const plant = PLANTS[0];
    const { recordObservation } = useGameStore.getState();
    recordObservation(plant.id, 'file:///documents/observations/same.jpg');
    recordObservation(plant.id, 'file:///documents/observations/same.jpg');

    const s = useGameStore.getState();
    expect(s.scanHistory).toHaveLength(1);
    expect(s.discoveredPlantIds).toEqual([plant.id]);
    expect(s.xp).toBe(RARITY_XP[plant.rarity] ?? 100);
  });

  it('does not let one photo exist in both unidentified and identified records', () => {
    const plant = PLANTS[0];
    const uri = 'file:///documents/observations/shared.jpg';
    useGameStore.getState().recordUnidentifiedObservation(uri);
    useGameStore.getState().recordObservation(plant.id, uri);

    const s = useGameStore.getState();
    expect(s.unidentifiedObservations).toHaveLength(1);
    expect(s.scanHistory).toEqual([]);
    expect(s.discoveredPlantIds).toEqual([]);
    expect(s.xp).toBe(0);
  });

  it('fails closed for an unknown plant id', () => {
    const { recordObservation, discoverPlant, addScan } = useGameStore.getState();
    recordObservation('__missing__', 'file://ghost.jpg');
    discoverPlant('__missing__');
    addScan('__missing__', 'file://ghost-2.jpg');

    const s = useGameStore.getState();
    expect(s.discoveredPlantIds).toEqual([]);
    expect(s.scanHistory).toEqual([]);
    expect(s.xp).toBe(0);
  });

  it('does not mint rescan XP through the legacy discoverPlant helper', () => {
    const plant = PLANTS[0];
    const { discoverPlant } = useGameStore.getState();
    discoverPlant(plant.id);
    discoverPlant(plant.id);
    discoverPlant(plant.id);

    const s = useGameStore.getState();
    expect(s.discoveredPlantIds).toEqual([plant.id]);
    expect(s.xp).toBe(RARITY_XP[plant.rarity] ?? 100);
  });
});

describe('Fieldbook settings (PR13)', () => {
  it('markSafetyCardViewed is idempotent (no duplicate entries)', () => {
    const { markSafetyCardViewed } = useGameStore.getState();
    markSafetyCardViewed('p024');
    markSafetyCardViewed('p024');
    markSafetyCardViewed('p025');
    const s = useGameStore.getState();
    expect(s.viewedSafetyCardPlantIds).toEqual(['p024', 'p025']);
  });

  it('markCandidatesCompared sets the flag', () => {
    expect(useGameStore.getState().hasComparedCandidates).toBe(false);
    useGameStore.getState().markCandidatesCompared();
    expect(useGameStore.getState().hasComparedCandidates).toBe(true);
  });

  it('setThemeOverride updates the appearance preference', () => {
    useGameStore.getState().setThemeOverride('dark');
    expect(useGameStore.getState().themeOverride).toBe('dark');
  });

  it('setAiConsentGiven updates consent', () => {
    useGameStore.getState().setAiConsentGiven(true);
    expect(useGameStore.getState().aiConsentGiven).toBe(true);
  });
});

describe('unidentified observations (v3 §6.1 "そのまま記録する", PR17)', () => {
  it('saves a photo with no plant match, without touching XP or the collection', () => {
    const { recordUnidentifiedObservation } = useGameStore.getState();
    recordUnidentifiedObservation('file://mystery.jpg', 'よく分からない葉っぱ');
    const s = useGameStore.getState();
    expect(s.unidentifiedObservations).toHaveLength(1);
    expect(s.unidentifiedObservations[0].imageUri).toBe('file://mystery.jpg');
    expect(s.unidentifiedObservations[0].note).toBe('よく分からない葉っぱ');
    expect(s.xp).toBe(0);
    expect(s.discoveredPlantIds).toEqual([]);
  });

  it('does not duplicate the same saved photo', () => {
    const { recordUnidentifiedObservation } = useGameStore.getState();
    recordUnidentifiedObservation('file://mystery.jpg');
    recordUnidentifiedObservation('file://mystery.jpg');
    expect(useGameStore.getState().unidentifiedObservations).toHaveLength(1);
  });

  it('deleteUnidentifiedObservation removes only the targeted entry', () => {
    const { recordUnidentifiedObservation, deleteUnidentifiedObservation } = useGameStore.getState();
    recordUnidentifiedObservation('file://a.jpg');
    recordUnidentifiedObservation('file://b.jpg');
    const [keep, remove] = useGameStore.getState().unidentifiedObservations;
    deleteUnidentifiedObservation(remove.id);
    const s = useGameStore.getState();
    expect(s.unidentifiedObservations).toHaveLength(1);
    expect(s.unidentifiedObservations[0].id).toBe(keep.id);
  });

  it('does not delete a photo file while another retained record still references it', () => {
    const sharedUri = 'file:///mock-documents/observations/1780000000000_abc123.jpg';
    useGameStore.setState({
      scanHistory: [{ id: 'scan_keep', plantId: PLANTS[0].id, scannedAt: new Date().toISOString(), imageUri: sharedUri }],
      unidentifiedObservations: [{ id: 'unid_remove', observedAt: new Date().toISOString(), imageUri: sharedUri }],
    });

    useGameStore.getState().deleteUnidentifiedObservation('unid_remove');

    expect(useGameStore.getState().unidentifiedObservations).toEqual([]);
    expect(mockDeleteObservationPhoto).not.toHaveBeenCalled();
  });

  it('deletes an unreferenced managed photo after its unidentified record is removed', () => {
    const uri = 'file:///mock-documents/observations/1780000000001_def456.jpg';
    useGameStore.setState({
      unidentifiedObservations: [{ id: 'unid_remove', observedAt: new Date().toISOString(), imageUri: uri }],
    });

    useGameStore.getState().deleteUnidentifiedObservation('unid_remove');

    expect(mockDeleteObservationPhoto).toHaveBeenCalledWith(uri);
  });

  it('setUnidentifiedRevisit sets and clears a revisit date', () => {
    const { recordUnidentifiedObservation, setUnidentifiedRevisit } = useGameStore.getState();
    recordUnidentifiedObservation('file://a.jpg');
    const id = useGameStore.getState().unidentifiedObservations[0].id;
    setUnidentifiedRevisit(id, '2026-08-01');
    expect(useGameStore.getState().unidentifiedObservations[0].revisitAt).toBe('2026-08-01');
    setUnidentifiedRevisit(id, undefined);
    expect(useGameStore.getState().unidentifiedObservations[0].revisitAt).toBeUndefined();
  });
});

describe('setScanRevisit (PR17)', () => {
  it('sets a revisit date on the matching scan history entry only', () => {
    const { recordObservation, setScanRevisit } = useGameStore.getState();
    const [a, b] = PLANTS;
    recordObservation(a.id);
    recordObservation(b.id);
    const [recentRecord, olderRecord] = useGameStore.getState().scanHistory;
    setScanRevisit(recentRecord.id, '2026-09-01');
    const s = useGameStore.getState();
    expect(s.scanHistory.find((r) => r.id === recentRecord.id)?.revisitAt).toBe('2026-09-01');
    expect(s.scanHistory.find((r) => r.id === olderRecord.id)?.revisitAt).toBeUndefined();
  });
});

describe('暮らし: setScanOrigin / practiceRecords (PR22)', () => {
  it('setScanOrigin tags the matching scan history entry only', () => {
    const { recordObservation, setScanOrigin } = useGameStore.getState();
    const [a, b] = PLANTS;
    recordObservation(a.id);
    recordObservation(b.id);
    const [recentRecord, olderRecord] = useGameStore.getState().scanHistory;
    setScanOrigin(recentRecord.id, 'store_bought_food');
    const s = useGameStore.getState();
    expect(s.scanHistory.find((r) => r.id === recentRecord.id)?.sourceOrigin).toBe('store_bought_food');
    expect(s.scanHistory.find((r) => r.id === olderRecord.id)?.sourceOrigin).toBeUndefined();
  });

  it('addPracticeRecord / deletePracticeRecord manage the personal journal', () => {
    const { addPracticeRecord, deletePracticeRecord } = useGameStore.getState();
    const plant = PLANTS[0];
    addPracticeRecord(plant.id, 'general', '押し花にしました');
    const s1 = useGameStore.getState();
    expect(s1.practiceRecords).toHaveLength(1);
    expect(s1.practiceRecords[0].plantId).toBe(plant.id);
    expect(s1.practiceRecords[0].note).toBe('押し花にしました');

    deletePracticeRecord(s1.practiceRecords[0].id);
    expect(useGameStore.getState().practiceRecords).toHaveLength(0);
  });

  it('does not create journal records for an unknown plant id', () => {
    useGameStore.getState().addPracticeRecord('__missing__', 'general', 'ghost');
    expect(useGameStore.getState().practiceRecords).toEqual([]);
  });
});

describe('resetAllData (§17 data deletion)', () => {
  it('erases collection, XP, notes, favorites, and settings back to defaults', () => {
    const {
      recordObservation, setPlayerName, setPlantNote, toggleFavorite, setAiConsentGiven,
      markCandidatesCompared, recordUnidentifiedObservation, addPracticeRecord,
    } = useGameStore.getState();
    const plant = PLANTS[0];
    recordObservation(plant.id);
    setPlayerName('テスト太郎');
    setPlantNote(plant.id, 'メモ');
    toggleFavorite(plant.id);
    setAiConsentGiven(true);
    markCandidatesCompared();
    recordUnidentifiedObservation('file://a.jpg');
    addPracticeRecord(plant.id, 'general', 'メモ');

    useGameStore.getState().resetAllData();

    const s = useGameStore.getState();
    expect(s.discoveredPlantIds).toEqual([]);
    expect(s.scanHistory).toEqual([]);
    expect(s.xp).toBe(0);
    expect(s.playerName).toBe('ハーブマスター');
    expect(s.plantNotes).toEqual({});
    expect(s.favoritePlantIds).toEqual([]);
    expect(s.aiConsentGiven).toBe(false);
    expect(s.hasComparedCandidates).toBe(false);
    expect(s.unidentifiedObservations).toEqual([]);
    expect(s.practiceRecords).toEqual([]);
  });

  it('does not clear the transient hydration flag', () => {
    useGameStore.getState().setHasHydrated(true);
    useGameStore.getState().resetAllData();
    expect(useGameStore.getState()._hasHydrated).toBe(true);
  });
});
