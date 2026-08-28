import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanRecord, UnidentifiedObservation, PracticeRecord } from '../types';
import { TraitCheck } from '../types/traitCheck';
import { SourceOrigin } from '../types/plantUse';
import { generateId } from '../utils/id';
import { PLANTS } from '../data/plants';
import {
  SEASONAL_CHALLENGES,
  getChallengePct,
  getDailyChallenges,
  ChallengeSnap,
} from '../data/challenges';
import { todayLocalStr, localDateStrOffset } from '../utils/date';
import { getCurrentSeason, getSeasonalPlants } from '../utils/season';
import { clearObservationPhotos, deleteObservationPhoto } from '../utils/observationPhotoStorage';

export const RARITY_XP: Record<number, number> = {
  1: 30,
  2: 80,
  3: 150,
  4: 250,
  5: 500,
};
export const XP_PER_RESCAN = 15;
export const XP_PER_LEVEL = 500;

const PLANT_BY_ID = new Map(PLANTS.map((plant) => [plant.id, plant]));

function todayStr(): string {
  return todayLocalStr();
}

function findKnownPlant(plantId: string) {
  return PLANT_BY_ID.get(plantId);
}

type PhotoReferenceState = {
  scanHistory: ScanRecord[];
  unidentifiedObservations: UnidentifiedObservation[];
};

function isPhotoReferenced(state: PhotoReferenceState, imageUri: string): boolean {
  return (
    state.scanHistory.some((record) => record.imageUri === imageUri) ||
    state.unidentifiedObservations.some((record) => record.imageUri === imageUri)
  );
}

function cleanupDroppedPhotos(
  records: { imageUri?: string }[],
  retainedState: PhotoReferenceState
): void {
  for (const record of records) {
    if (record.imageUri && !isPhotoReferenced(retainedState, record.imageUri)) {
      void deleteObservationPhoto(record.imageUri);
    }
  }
}

function dailyChallengeSnapshot(state: GameState): ChallengeSnap {
  return {
    todayScanCount: state.todayScanCount,
    todayNewCount: state.todayNewCount,
    todayMaxRarity: state.todayMaxRarity,
    todayDangers: state.todayDangers,
    todayCategories: state.todayCategories,
  };
}

interface GameState {
  discoveredPlantIds: string[];
  scanHistory: ScanRecord[];
  playerName: string;
  xp: number;
  streak: number;
  lastLoginDate: string;
  todayDate: string;
  todayScanCount: number;
  todayNewCount: number;
  todayMaxRarity: number;
  todayDangers: string[];
  todayCategories: string[];
  claimedChallengeIds: string[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  hasOnboarded: boolean;
  setHasOnboarded: () => void;
  lastCelebrated: number;
  favoritePlantIds: string[];
  plantNotes: Record<string, string>;
  claimedSeasonalQuestIds: string[];
  seasonalQuestMonth: string;
  themeOverride: 'system' | 'light' | 'dark';
  aiConsentGiven: boolean;
  viewedSafetyCardPlantIds: string[];
  hasComparedCandidates: boolean;
  unidentifiedObservations: UnidentifiedObservation[];
  practiceRecords: PracticeRecord[];

  startSession: () => void;
  discoverPlant: (plantId: string) => void;
  addScan: (plantId: string, imageUri?: string) => void;
  recordObservation: (plantId: string, imageUri?: string, traitChecks?: TraitCheck[]) => void;
  setPlayerName: (name: string) => void;
  // Keep the old second argument optional for source compatibility. It is
  // intentionally ignored; reward amounts are owned by challenge data only.
  claimChallenge: (challengeId: string, legacyXpReward?: number) => void;
  claimSeasonalChallenge: (challengeId: string, legacyXpReward?: number) => void;
  setLastCelebrated: (count: number) => void;
  toggleFavorite: (plantId: string) => void;
  setPlantNote: (plantId: string, note: string) => void;
  setThemeOverride: (mode: 'system' | 'light' | 'dark') => void;
  setAiConsentGiven: (given: boolean) => void;
  markSafetyCardViewed: (plantId: string) => void;
  markCandidatesCompared: () => void;
  recordUnidentifiedObservation: (imageUri?: string, note?: string) => void;
  deleteUnidentifiedObservation: (id: string) => void;
  setScanRevisit: (scanId: string, revisitAt: string | undefined) => void;
  setUnidentifiedRevisit: (observationId: string, revisitAt: string | undefined) => void;
  setScanOrigin: (scanId: string, origin: SourceOrigin) => void;
  addPracticeRecord: (plantId: string, category: string, note: string) => void;
  deletePracticeRecord: (id: string) => void;
  resetAllData: () => void;
  getLevel: () => number;
  getXpForCurrentLevel: () => number;
  getXpToNextLevel: () => number;
}

const INITIAL_USER_DATA = {
  discoveredPlantIds: [] as string[],
  scanHistory: [] as ScanRecord[],
  playerName: 'ハーブマスター',
  xp: 0,
  streak: 0,
  lastLoginDate: '',
  todayDate: '',
  todayScanCount: 0,
  todayNewCount: 0,
  todayMaxRarity: 0,
  todayDangers: [] as string[],
  todayCategories: [] as string[],
  claimedChallengeIds: [] as string[],
  lastCelebrated: 0,
  favoritePlantIds: [] as string[],
  plantNotes: {} as Record<string, string>,
  claimedSeasonalQuestIds: [] as string[],
  seasonalQuestMonth: '',
  hasOnboarded: false,
  themeOverride: 'system' as const,
  aiConsentGiven: false,
  viewedSafetyCardPlantIds: [] as string[],
  hasComparedCandidates: false,
  unidentifiedObservations: [] as UnidentifiedObservation[],
  practiceRecords: [] as PracticeRecord[],
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_USER_DATA,
      _hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      startSession: () => {
        const { lastLoginDate, streak, todayDate, seasonalQuestMonth } = get();
        const today = todayStr();
        const yesterday = localDateStrOffset(-1);
        const thisMonth = today.slice(0, 7);

        const newStreak =
          lastLoginDate === yesterday ? streak + 1 :
          lastLoginDate === today ? streak :
          1;

        const isNewDay = todayDate !== today;
        const isNewMonth = seasonalQuestMonth !== thisMonth;

        set({
          lastLoginDate: today,
          streak: newStreak,
          ...(isNewDay && {
            todayDate: today,
            todayScanCount: 0,
            todayNewCount: 0,
            todayMaxRarity: 0,
            todayDangers: [],
            todayCategories: [],
            claimedChallengeIds: [],
          }),
          ...(isNewMonth && {
            claimedSeasonalQuestIds: [],
            seasonalQuestMonth: thisMonth,
          }),
        });
      },

      discoverPlant: (plantId: string) => {
        const plant = findKnownPlant(plantId);
        if (!plant) return;

        get().startSession();
        const { discoveredPlantIds } = get();
        const isNew = !discoveredPlantIds.includes(plantId);
        if (!isNew) return;

        const rarity = plant.rarity;
        set((state) => ({
          discoveredPlantIds: [...state.discoveredPlantIds, plantId],
          xp: state.xp + (RARITY_XP[rarity] ?? 100),
          todayNewCount: state.todayNewCount + 1,
          todayMaxRarity: Math.max(state.todayMaxRarity, rarity),
          todayDangers: !state.todayDangers.includes(plant.danger)
            ? [...state.todayDangers, plant.danger]
            : state.todayDangers,
          todayCategories: !state.todayCategories.includes(plant.category)
            ? [...state.todayCategories, plant.category]
            : state.todayCategories,
        }));
      },

      addScan: (plantId: string, imageUri?: string) => {
        if (!findKnownPlant(plantId)) return;
        get().startSession();

        const snapshot = get();
        if (imageUri && isPhotoReferenced(snapshot, imageUri)) return;

        const dropped = snapshot.scanHistory.length >= 100
          ? snapshot.scanHistory.slice(99)
          : [];
        const record: ScanRecord = {
          id: generateId('scan'),
          plantId,
          scannedAt: new Date().toISOString(),
          imageUri,
        };
        set((state) => ({
          scanHistory: [record, ...state.scanHistory].slice(0, 100),
          todayScanCount: state.todayScanCount + 1,
        }));
        cleanupDroppedPhotos(dropped, get());
      },

      recordObservation: (plantId: string, imageUri?: string, traitChecks?: TraitCheck[]) => {
        const plant = findKnownPlant(plantId);
        if (!plant) return;
        get().startSession();

        const snapshot = get();
        if (imageUri && isPhotoReferenced(snapshot, imageUri)) return;

        const dropped = snapshot.scanHistory.length >= 100
          ? snapshot.scanHistory.slice(99)
          : [];
        const rarity = plant.rarity;
        const record: ScanRecord = {
          id: generateId('scan'),
          plantId,
          scannedAt: new Date().toISOString(),
          imageUri,
          traitChecks: traitChecks && traitChecks.length > 0 ? traitChecks : undefined,
        };
        set((state) => {
          const isNew = !state.discoveredPlantIds.includes(plantId);
          const gainedXp = isNew ? (RARITY_XP[rarity] ?? 100) : XP_PER_RESCAN;
          return {
            discoveredPlantIds: isNew
              ? [...state.discoveredPlantIds, plantId]
              : state.discoveredPlantIds,
            xp: state.xp + gainedXp,
            scanHistory: [record, ...state.scanHistory].slice(0, 100),
            todayScanCount: state.todayScanCount + 1,
            todayNewCount: isNew ? state.todayNewCount + 1 : state.todayNewCount,
            todayMaxRarity: Math.max(state.todayMaxRarity, rarity),
            todayDangers: !state.todayDangers.includes(plant.danger)
              ? [...state.todayDangers, plant.danger]
              : state.todayDangers,
            todayCategories: !state.todayCategories.includes(plant.category)
              ? [...state.todayCategories, plant.category]
              : state.todayCategories,
          };
        });
        cleanupDroppedPhotos(dropped, get());
      },

      setHasOnboarded: () => set({ hasOnboarded: true }),
      setPlayerName: (name: string) => set({ playerName: name }),
      setLastCelebrated: (count: number) => set({ lastCelebrated: count }),
      setThemeOverride: (mode) => set({ themeOverride: mode }),
      setAiConsentGiven: (given: boolean) => set({ aiConsentGiven: given }),

      markSafetyCardViewed: (plantId: string) => {
        if (!findKnownPlant(plantId)) return;
        set((state) =>
          state.viewedSafetyCardPlantIds.includes(plantId)
            ? state
            : { viewedSafetyCardPlantIds: [...state.viewedSafetyCardPlantIds, plantId] }
        );
      },

      markCandidatesCompared: () => set({ hasComparedCandidates: true }),

      recordUnidentifiedObservation: (imageUri?: string, note?: string) => {
        const snapshot = get();
        if (imageUri && isPhotoReferenced(snapshot, imageUri)) return;

        const dropped = snapshot.unidentifiedObservations.length >= 100
          ? snapshot.unidentifiedObservations.slice(99)
          : [];
        const observation: UnidentifiedObservation = {
          id: generateId('unid'),
          observedAt: new Date().toISOString(),
          imageUri,
          note,
        };
        set((state) => ({
          unidentifiedObservations: [observation, ...state.unidentifiedObservations].slice(0, 100),
        }));
        cleanupDroppedPhotos(dropped, get());
      },

      deleteUnidentifiedObservation: (id: string) => {
        const target = get().unidentifiedObservations.find((o) => o.id === id);
        if (!target) return;

        set((state) => ({
          unidentifiedObservations: state.unidentifiedObservations.filter((o) => o.id !== id),
        }));
        if (target.imageUri && !isPhotoReferenced(get(), target.imageUri)) {
          void deleteObservationPhoto(target.imageUri);
        }
      },

      setScanRevisit: (scanId: string, revisitAt: string | undefined) => {
        set((state) => ({
          scanHistory: state.scanHistory.map((r) => (r.id === scanId ? { ...r, revisitAt } : r)),
        }));
      },

      setUnidentifiedRevisit: (observationId: string, revisitAt: string | undefined) => {
        set((state) => ({
          unidentifiedObservations: state.unidentifiedObservations.map((o) =>
            o.id === observationId ? { ...o, revisitAt } : o
          ),
        }));
      },

      setScanOrigin: (scanId: string, origin: SourceOrigin) => {
        set((state) => ({
          scanHistory: state.scanHistory.map((r) => (r.id === scanId ? { ...r, sourceOrigin: origin } : r)),
        }));
      },

      addPracticeRecord: (plantId: string, category: string, note: string) => {
        if (!findKnownPlant(plantId)) return;
        const record: PracticeRecord = {
          id: generateId('practice'),
          plantId,
          category,
          createdAt: new Date().toISOString(),
          note,
        };
        set((state) => ({ practiceRecords: [record, ...state.practiceRecords].slice(0, 200) }));
      },

      deletePracticeRecord: (id: string) => {
        set((state) => ({ practiceRecords: state.practiceRecords.filter((r) => r.id !== id) }));
      },

      resetAllData: () => {
        set({ ...INITIAL_USER_DATA });
        void clearObservationPhotos();
      },

      toggleFavorite: (plantId: string) => {
        if (!findKnownPlant(plantId)) return;
        set((state) => ({
          favoritePlantIds: state.favoritePlantIds.includes(plantId)
            ? state.favoritePlantIds.filter((id) => id !== plantId)
            : [...state.favoritePlantIds, plantId],
        }));
      },

      setPlantNote: (plantId: string, note: string) => {
        if (!findKnownPlant(plantId)) return;
        set((state) => ({
          plantNotes: note.trim()
            ? { ...state.plantNotes, [plantId]: note.trim() }
            : Object.fromEntries(
                Object.entries(state.plantNotes).filter(([k]) => k !== plantId)
              ),
        }));
      },

      claimChallenge: (challengeId: string, _legacyXpReward?: number) => {
        get().startSession();
        const snapshot = get();
        const challenge = getDailyChallenges(snapshot.todayDate).find(
          (candidate) => candidate.id === challengeId
        );
        if (!challenge || getChallengePct(challenge, dailyChallengeSnapshot(snapshot)) < 1) return;

        set((state) => {
          if (state.claimedChallengeIds.includes(challengeId)) return state;
          return {
            claimedChallengeIds: [...state.claimedChallengeIds, challengeId],
            xp: state.xp + challenge.xpReward,
          };
        });
      },

      claimSeasonalChallenge: (challengeId: string, _legacyXpReward?: number) => {
        get().startSession();
        const snapshot = get();
        const season = getCurrentSeason();
        const challenge = SEASONAL_CHALLENGES[season].find(
          (candidate) => candidate.id === challengeId
        );
        if (!challenge) return;

        const seasonalPlantIds = new Set(
          getSeasonalPlants(season, PLANTS).map((plant) => plant.id)
        );
        const seasonalDiscoveredCount = snapshot.discoveredPlantIds.filter((id) =>
          seasonalPlantIds.has(id)
        ).length;
        const progress = getChallengePct(challenge, {
          ...dailyChallengeSnapshot(snapshot),
          seasonalDiscoveredCount,
        });
        if (progress < 1) return;

        set((state) => {
          if (state.claimedSeasonalQuestIds.includes(challengeId)) return state;
          return {
            claimedSeasonalQuestIds: [...state.claimedSeasonalQuestIds, challengeId],
            xp: state.xp + challenge.xpReward,
          };
        });
      },

      getLevel: () => Math.floor(get().xp / XP_PER_LEVEL) + 1,
      getXpForCurrentLevel: () => get().xp % XP_PER_LEVEL,
      getXpToNextLevel: () => XP_PER_LEVEL - (get().xp % XP_PER_LEVEL),
    }),
    {
      name: 'yaku-iku-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted, _version) => persisted as GameState,
      partialize: ({ _hasHydrated, setHasHydrated, ...rest }) => rest,
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('[store] Failed to rehydrate persisted state:', error);
        useGameStore.setState({ _hasHydrated: true });
      },
    }
  )
);
