import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanRecord } from '../types';
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

  // Actions
  startSession: () => void;
  discoverPlant: (plantId: string) => void;
  addScan: (plantId: string, imageUri?: string) => void;
  setPlayerName: (name: string) => void;
  claimChallenge: (challengeId: string, xpReward: number) => void;
  claimSeasonalChallenge: (challengeId: string, xpReward: number) => void;
  setLastCelebrated: (count: number) => void;
  toggleFavorite: (plantId: string) => void;
  setPlantNote: (plantId: string, note: string) => void;

  // Computed helpers
  getLevel: () => number;
  getXpForCurrentLevel: () => number;
  getXpToNextLevel: () => number;
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      discoveredPlantIds: [],
      scanHistory: [],
      playerName: 'ハーブマスター',
      xp: 0,

      streak: 0,
      lastLoginDate: '',

      todayDate: '',
      todayScanCount: 0,
      todayNewCount: 0,
      todayMaxRarity: 0,
      todayDangers: [],
      todayCategories: [],
      claimedChallengeIds: [],
      lastCelebrated: 0,
      favoritePlantIds: [],
      plantNotes: {},
      claimedSeasonalQuestIds: [],
      seasonalQuestMonth: '',
      hasOnboarded: false,

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
          id: `scan_${Date.now()}`,
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

      setHasOnboarded: () => set({ hasOnboarded: true }),
      setPlayerName: (name: string) => set({ playerName: name }),
      setLastCelebrated: (count: number) => set({ lastCelebrated: count }),

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
