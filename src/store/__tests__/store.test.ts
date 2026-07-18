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
