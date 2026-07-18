import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanRecord, UnidentifiedObservation, PracticeRecord } from '../types';
import { TraitCheck } from '../types/traitCheck';
import { SourceOrigin } from '../types/plantUse';
import { generateId } from '../utils/id';
import { PLANTS } from '../data/plants';
import { todayLocalStr, localDateStrOffset } from '../utils/date';

// ─── XP constants (exported for display in UI) ──────────────────────────────
// First discovery: weighted by rarity
export const RARITY_XP: Record<number, number> = {
  1: 30,   // ★ common
  2: 80,   // ★★ uncommon
  3: 150,  // ★★★ rare
  4: 250,  // ★★★★ super rare
  5: 500,  // ★★★★★ legendary
};
export const XP_PER_RESCAN = 15; // re-scanning a known plant
export const XP_PER_LEVEL = 500;

function todayStr(): string {
  return todayLocalStr(); // YYYY-MM-DD (device-local, JST-aware)
}

// ─── State shape ─────────────────────────────────────────────────────────────
interface GameState {
  // Collection
  discoveredPlantIds: string[];
  scanHistory: ScanRecord[];

  // User
  playerName: string;
  xp: number;

  // Streak & login
  streak: number;
  lastLoginDate: string; // YYYY-MM-DD

  // Daily activity (reset each new day)
  todayDate: string;
  todayScanCount: number;
  todayNewCount: number;
  todayMaxRarity: number;
  todayDangers: string[];
  todayCategories: string[];
  claimedChallengeIds: string[];

  // Hydration (true once persisted state has loaded from AsyncStorage)
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Onboarding
  hasOnboarded: boolean;
  setHasOnboarded: () => void;

  // Milestone celebration (persisted so dismissed banners don't reappear)
  lastCelebrated: number;

  // Favorites
  favoritePlantIds: string[];

  // Personal plant notes
  plantNotes: Record<string, string>;

  // Seasonal quests (reset each new calendar month)
  claimedSeasonalQuestIds: string[];
  seasonalQuestMonth: string; // YYYY-MM

  // Fieldbook settings (PR13, §7.8)
  /** Manual appearance override; 'system' follows the OS setting (ThemeProvider default). */
  themeOverride: 'system' | 'light' | 'dark';
  /** Explicit consent to send captured photos to the real AI provider (§11 "同意画面"). */
  aiConsentGiven: boolean;
  /** Plants whose detail page has been opened while danger === 'RED' (safety-card learning achievement). */
  viewedSafetyCardPlantIds: string[];
  /** Set once the user has picked a non-top candidate in the compare view (§7.5). */
  hasComparedCandidates: boolean;

  // Observations saved without a plant match (v3 §6.1 "そのまま記録する"). PR17.
  unidentifiedObservations: UnidentifiedObservation[];

  // Personal cooking/living journal entries (v3 §11.3). PR22.
  practiceRecords: PracticeRecord[];

  // Actions
  startSession: () => void;
  discoverPlant: (plantId: string) => void;
  addScan: (plantId: string, imageUri?: string) => void;
  /**
   * Atomically record a confirmed observation: adds to the collection, records
   * scan history, awards XP and updates daily counters in a single state
   * update. Use this for real (production) identifications; demo results must
   * NOT call this (see src/utils/appMode.ts).
   */
  recordObservation: (plantId: string, imageUri?: string, traitChecks?: TraitCheck[]) => void;
  setPlayerName: (name: string) => void;
  claimChallenge: (challengeId: string, xpReward: number) => void;
  claimSeasonalChallenge: (challengeId: string, xpReward: number) => void;
  setLastCelebrated: (count: number) => void;
  toggleFavorite: (plantId: string) => void;
  setPlantNote: (plantId: string, note: string) => void;
  setThemeOverride: (mode: 'system' | 'light' | 'dark') => void;
  setAiConsentGiven: (given: boolean) => void;
  markSafetyCardViewed: (plantId: string) => void;
  markCandidatesCompared: () => void;
  /** Save a photo the user chose not to (or could not) identify — still real Fieldbook value (v3 §6.1). */
  recordUnidentifiedObservation: (imageUri?: string, note?: string) => void;
  deleteUnidentifiedObservation: (id: string) => void;
  /** Set or clear a "come back and check again" reminder date on a scan history entry. */
  setScanRevisit: (scanId: string, revisitAt: string | undefined) => void;
  /** Same as `setScanRevisit` for an unidentified (no plant match) observation. */
  setUnidentifiedRevisit: (observationId: string, revisitAt: string | undefined) => void;
  /** Tag how a specimen was obtained — feeds the 暮らし content gate (v3 §10, PR22). */
  setScanOrigin: (scanId: string, origin: SourceOrigin) => void;
  addPracticeRecord: (plantId: string, category: string, note: string) => void;
  deletePracticeRecord: (id: string) => void;
  /** Erases all persisted user data (§17 "端末内にデータ削除機能"). Irreversible. */
  resetAllData: () => void;

  // Computed helpers
  getLevel: () => number;
  getXpForCurrentLevel: () => number;
  getXpToNextLevel: () => number;
}

// Fields reset by `resetAllData`. Kept separate from `_hasHydrated`/hydration
// machinery, which must survive a reset within the same running session.
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

// ─── Store ───────────────────────────────────────────────────────────────────
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_USER_DATA,

      _hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      // ── Session start: call once on app mount ────────────────────────────
      startSession: () => {
        const { lastLoginDate, streak, todayDate, seasonalQuestMonth } = get();
        const today = todayStr();
        const yesterday = localDateStrOffset(-1);
        const thisMonth = today.slice(0, 7); // YYYY-MM

        const newStreak =
          lastLoginDate === yesterday ? streak + 1 :
          lastLoginDate === today    ? streak :
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

      // ── Discover a plant ─────────────────────────────────────────────────
      discoverPlant: (plantId: string) => {
        const { discoveredPlantIds, todayDate } = get();
        const isNew = !discoveredPlantIds.includes(plantId);
        const plant = PLANTS.find((p) => p.id === plantId);
        const rarity = plant?.rarity ?? 1;
        const gainedXp = isNew ? (RARITY_XP[rarity] ?? 100) : XP_PER_RESCAN;
        const isToday = todayDate === todayStr();

        set((state) => ({
          discoveredPlantIds: isNew
            ? [...state.discoveredPlantIds, plantId]
            : state.discoveredPlantIds,
          xp: state.xp + gainedXp,
          todayNewCount: isNew && isToday
            ? state.todayNewCount + 1
            : state.todayNewCount,
          todayMaxRarity: isToday
            ? Math.max(state.todayMaxRarity, rarity)
            : state.todayMaxRarity,
          todayDangers:
            isToday && plant?.danger && !state.todayDangers.includes(plant.danger)
              ? [...state.todayDangers, plant.danger]
              : state.todayDangers,
          todayCategories:
            isToday && plant?.category && !state.todayCategories.includes(plant.category)
              ? [...state.todayCategories, plant.category]
              : state.todayCategories,
        }));
      },

      // ── Record a scan ────────────────────────────────────────────────────
      addScan: (plantId: string, imageUri?: string) => {
        const { todayDate } = get();
        const record: ScanRecord = {
          id: generateId('scan'),
          plantId,
          scannedAt: new Date().toISOString(),
          imageUri,
        };
        set((state) => ({
          scanHistory: [record, ...state.scanHistory].slice(0, 100),
          todayScanCount: todayDate === todayStr()
            ? state.todayScanCount + 1
            : state.todayScanCount,
        }));
      },

      // ── Atomic observation record (discovery + history + XP in one update) ─
      recordObservation: (plantId: string, imageUri?: string, traitChecks?: TraitCheck[]) => {
        const isToday = get().todayDate === todayStr();
        const plant = PLANTS.find((p) => p.id === plantId);
        const rarity = plant?.rarity ?? 1;
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
            todayScanCount: isToday ? state.todayScanCount + 1 : state.todayScanCount,
            todayNewCount: isNew && isToday ? state.todayNewCount + 1 : state.todayNewCount,
            todayMaxRarity: isToday
              ? Math.max(state.todayMaxRarity, rarity)
              : state.todayMaxRarity,
            todayDangers:
              isToday && plant?.danger && !state.todayDangers.includes(plant.danger)
                ? [...state.todayDangers, plant.danger]
                : state.todayDangers,
            todayCategories:
              isToday && plant?.category && !state.todayCategories.includes(plant.category)
                ? [...state.todayCategories, plant.category]
                : state.todayCategories,
          };
        });
      },

      setHasOnboarded: () => set({ hasOnboarded: true }),
      setPlayerName: (name: string) => set({ playerName: name }),
      setLastCelebrated: (count: number) => set({ lastCelebrated: count }),
      setThemeOverride: (mode) => set({ themeOverride: mode }),
      setAiConsentGiven: (given: boolean) => set({ aiConsentGiven: given }),

      markSafetyCardViewed: (plantId: string) => {
        set((state) =>
          state.viewedSafetyCardPlantIds.includes(plantId)
            ? state
            : { viewedSafetyCardPlantIds: [...state.viewedSafetyCardPlantIds, plantId] }
        );
      },

      markCandidatesCompared: () => set({ hasComparedCandidates: true }),

      recordUnidentifiedObservation: (imageUri?: string, note?: string) => {
        const observation: UnidentifiedObservation = {
          id: generateId('unid'),
          observedAt: new Date().toISOString(),
          imageUri,
          note,
        };
        set((state) => ({
          unidentifiedObservations: [observation, ...state.unidentifiedObservations].slice(0, 100),
        }));
      },

      deleteUnidentifiedObservation: (id: string) => {
        set((state) => ({
          unidentifiedObservations: state.unidentifiedObservations.filter((o) => o.id !== id),
        }));
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

      resetAllData: () => set({ ...INITIAL_USER_DATA }),

      toggleFavorite: (plantId: string) => {
        set((state) => ({
          favoritePlantIds: state.favoritePlantIds.includes(plantId)
            ? state.favoritePlantIds.filter((id) => id !== plantId)
            : [...state.favoritePlantIds, plantId],
        }));
      },

      setPlantNote: (plantId: string, note: string) => {
        set((state) => ({
          plantNotes: note.trim()
            ? { ...state.plantNotes, [plantId]: note.trim() }
            : Object.fromEntries(
                Object.entries(state.plantNotes).filter(([k]) => k !== plantId)
              ),
        }));
      },

      // ── Claim a completed daily quest ─────────────────────────────────────
      claimChallenge: (challengeId: string, xpReward: number) => {
        set((state) => {
          // Guard against double-claiming the same reward (the UI hides the
          // button, but the store must be the source of truth).
          if (state.claimedChallengeIds.includes(challengeId)) return state;
          return {
            claimedChallengeIds: [...state.claimedChallengeIds, challengeId],
            xp: state.xp + xpReward,
          };
        });
      },

      // ── Claim a completed seasonal quest ──────────────────────────────────
      claimSeasonalChallenge: (challengeId: string, xpReward: number) => {
        set((state) => {
          if (state.claimedSeasonalQuestIds.includes(challengeId)) return state;
          return {
            claimedSeasonalQuestIds: [...state.claimedSeasonalQuestIds, challengeId],
            xp: state.xp + xpReward,
          };
        });
      },

      // ── Computed ─────────────────────────────────────────────────────────
      getLevel: () => Math.floor(get().xp / XP_PER_LEVEL) + 1,
      getXpForCurrentLevel: () => get().xp % XP_PER_LEVEL,
      getXpToNextLevel: () => XP_PER_LEVEL - (get().xp % XP_PER_LEVEL),
    }),
    {
      name: 'yaku-iku-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Bump `version` and extend `migrate` whenever the persisted shape changes
      // so existing users' saves are upgraded instead of breaking.
      version: 1,
      migrate: (persisted, _version) => persisted as GameState,
      // Do not persist the transient hydration flag.
      partialize: ({ _hasHydrated, setHasHydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        // Called once AsyncStorage has finished loading (even on first launch,
        // where `state` is the default). Flip the flag so the UI can wait for it.
        state?.setHasHydrated(true);
      },
    }
  )
);
