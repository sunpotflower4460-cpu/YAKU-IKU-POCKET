import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanRecord } from '../types';

const XP_PER_DISCOVERY = 100;
const XP_PER_RESCAN = 10;
const XP_PER_LEVEL = 500;

interface GameState {
  // Collection
  discoveredPlantIds: string[];
  scanHistory: ScanRecord[];

  // User
  playerName: string;
  xp: number;

  // Actions
  discoverPlant: (plantId: string) => void;
  addScan: (plantId: string) => void;
  setPlayerName: (name: string) => void;

  // Computed helpers (not stored, derived)
  getLevel: () => number;
  getXpForCurrentLevel: () => number;
  getXpToNextLevel: () => number;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      discoveredPlantIds: [],
      scanHistory: [],
      playerName: 'ハーブマスター',
      xp: 0,

      discoverPlant: (plantId: string) => {
        const { discoveredPlantIds } = get();
        const isNew = !discoveredPlantIds.includes(plantId);
        const gainedXp = isNew ? XP_PER_DISCOVERY : XP_PER_RESCAN;

        set((state) => ({
          discoveredPlantIds: isNew
            ? [...state.discoveredPlantIds, plantId]
            : state.discoveredPlantIds,
          xp: state.xp + gainedXp,
        }));
      },

      addScan: (plantId: string) => {
        const record: ScanRecord = {
          id: `scan_${Date.now()}`,
          plantId,
          scannedAt: new Date().toISOString(),
        };
        set((state) => ({
          scanHistory: [record, ...state.scanHistory].slice(0, 100),
        }));
      },

      setPlayerName: (name: string) => set({ playerName: name }),

      getLevel: () => {
        const { xp } = get();
        return Math.floor(xp / XP_PER_LEVEL) + 1;
      },

      getXpForCurrentLevel: () => {
        const { xp } = get();
        return xp % XP_PER_LEVEL;
      },

      getXpToNextLevel: () => {
        const { xp } = get();
        return XP_PER_LEVEL - (xp % XP_PER_LEVEL);
      },
    }),
    {
      name: 'yaku-iku-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
