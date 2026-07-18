import { useGameStore, RARITY_XP, XP_PER_RESCAN } from '../useGameStore';
import { PLANTS } from '../../data/plants';

// Reset the relevant slice of state before each test.
beforeEach(() => {
  useGameStore.setState({
    discoveredPlantIds: [],
    scanHistory: [],
    xp: 0,
    claimedChallengeIds: [],
    claimedSeasonalQuestIds: [],
    todayDate: '',
    todayScanCount: 0,
    todayNewCount: 0,
    playerName: 'ハーブマスター',
    plantNotes: {},
    favoritePlantIds: [],
    themeOverride: 'system',
    aiConsentGiven: false,
    viewedSafetyCardPlantIds: [],
    hasComparedCandidates: false,
  });
});

describe('claimChallenge / claimSeasonalChallenge double-reward guard', () => {
  it('does not award the same daily quest twice', () => {
    const { claimChallenge } = useGameStore.getState();
    claimChallenge('q1', 50);
    claimChallenge('q1', 50); // duplicate
    const s = useGameStore.getState();
    expect(s.xp).toBe(50);
    expect(s.claimedChallengeIds.filter((id) => id === 'q1')).toHaveLength(1);
  });

  it('does not award the same seasonal quest twice', () => {
    const { claimSeasonalChallenge } = useGameStore.getState();
    claimSeasonalChallenge('sc_spring_1', 60);
    claimSeasonalChallenge('sc_spring_1', 60);
    expect(useGameStore.getState().xp).toBe(60);
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

describe('resetAllData (§17 data deletion)', () => {
  it('erases collection, XP, notes, favorites, and settings back to defaults', () => {
    const { recordObservation, setPlayerName, setPlantNote, toggleFavorite, setAiConsentGiven, markCandidatesCompared } =
      useGameStore.getState();
    const plant = PLANTS[0];
    recordObservation(plant.id);
    setPlayerName('テスト太郎');
    setPlantNote(plant.id, 'メモ');
    toggleFavorite(plant.id);
    setAiConsentGiven(true);
    markCandidatesCompared();

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
  });

  it('does not clear the transient hydration flag', () => {
    useGameStore.getState().setHasHydrated(true);
    useGameStore.getState().resetAllData();
    expect(useGameStore.getState()._hasHydrated).toBe(true);
  });
});
