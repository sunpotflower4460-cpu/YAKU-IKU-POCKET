import { Season } from '../utils/season';

export type ChallengeType =
  | 'scan_count'
  | 'discover_new'
  | 'find_rarity_4'
  | 'find_rarity_5'
  | 'find_green'
  | 'find_red'
  | 'find_herb'
  | 'collect_seasonal'; // 季節植物コレクション数（通算）

export interface Challenge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  xpReward: number;
  type: ChallengeType;
  target: number;
}

// ─── Daily challenges ──────────────────────────────────────────────────────
export const CHALLENGES: Challenge[] = [
  {
    id: 'q1', icon: 'camera-outline', title: '今日の採集家',
    desc: '植物を2種スキャンする', xpReward: 30,
    type: 'scan_count', target: 2,
  },
  {
    id: 'q2', icon: 'flash-outline', title: '新発見！',
    desc: '新しい植物を1種発見する', xpReward: 80,
    type: 'discover_new', target: 1,
  },
  {
    id: 'q3', icon: 'search-outline', title: '熱心な調査',
    desc: '植物を5種スキャンする', xpReward: 80,
    type: 'scan_count', target: 5,
  },
  {
    id: 'q4', icon: 'star-outline', title: 'レアハンター',
    desc: '★4以上の植物を発見する', xpReward: 150,
    type: 'find_rarity_4', target: 1,
  },
  {
    id: 'q5', icon: 'trophy-outline', title: '伝説の探索者',
    desc: '★5の伝説植物を発見する', xpReward: 300,
    type: 'find_rarity_5', target: 1,
  },
  {
    id: 'q6', icon: 'leaf-outline', title: 'みどりの観察',
    desc: '「一般に食用とされる」植物を発見する', xpReward: 40,
    type: 'find_green', target: 1,
  },
  {
    id: 'q7', icon: 'skull-outline', title: '危険植物調査',
    desc: '有毒植物（RED）を発見する', xpReward: 100,
    type: 'find_red', target: 1,
  },
  {
    id: 'q8', icon: 'leaf', title: 'ハーブ探し',
    desc: 'スパイス・ハーブを発見する', xpReward: 60,
    type: 'find_herb', target: 1,
  },
  {
    id: 'q9', icon: 'albums-outline', title: 'コレクター',
    desc: '今日3種の新植物を発見する', xpReward: 200,
    type: 'discover_new', target: 3,
  },
  {
    id: 'q10', icon: 'medical-outline', title: '養生マスター',
    desc: '植物を10種スキャンする', xpReward: 150,
    type: 'scan_count', target: 10,
  },
];

/** Returns 3 deterministic, unique daily challenges for the given YYYY-MM-DD string. */
export function getDailyChallenges(dateStr: string): Challenge[] {
  let seed = 0;
  for (const ch of dateStr) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  seed = Math.abs(seed);

  const n = CHALLENGES.length;
  const pickedSet = new Set<number>();
  let s = seed;
  while (pickedSet.size < 3) {
    s = (s * 9301 + 49297) % 233280;
    pickedSet.add(s % n);
  }
  return [...pickedSet].map((i) => CHALLENGES[i]);
}

// ─── Seasonal quests (monthly, per season) ────────────────────────────────
export const SEASONAL_CHALLENGES: Record<Season, Challenge[]> = {
  春: [
    { id: 'sc_spring_1', icon: 'flower-outline', title: '春の恵み',    desc: '春の旬の植物を1種コレクションする', xpReward: 60,  type: 'collect_seasonal', target: 1 },
    { id: 'sc_spring_3', icon: 'flower-outline', title: '春の探索者',  desc: '春の旬の植物を3種コレクションする', xpReward: 180, type: 'collect_seasonal', target: 3 },
    { id: 'sc_spring_5', icon: 'flower-outline', title: '春の達人',    desc: '春の旬の植物を5種コレクションする', xpReward: 350, type: 'collect_seasonal', target: 5 },
  ],
  夏: [
    { id: 'sc_summer_1', icon: 'sunny-outline', title: '夏の恵み',    desc: '夏の旬の植物を1種コレクションする', xpReward: 60,  type: 'collect_seasonal', target: 1 },
    { id: 'sc_summer_3', icon: 'sunny-outline', title: '夏の探索者',  desc: '夏の旬の植物を3種コレクションする', xpReward: 180, type: 'collect_seasonal', target: 3 },
    { id: 'sc_summer_5', icon: 'sunny-outline', title: '夏の達人',    desc: '夏の旬の植物を5種コレクションする', xpReward: 350, type: 'collect_seasonal', target: 5 },
  ],
  秋: [
    { id: 'sc_autumn_1', icon: 'leaf-outline', title: '秋の恵み',    desc: '秋の旬の植物を1種コレクションする', xpReward: 60,  type: 'collect_seasonal', target: 1 },
    { id: 'sc_autumn_3', icon: 'leaf-outline', title: '秋の探索者',  desc: '秋の旬の植物を3種コレクションする', xpReward: 180, type: 'collect_seasonal', target: 3 },
    { id: 'sc_autumn_5', icon: 'leaf-outline', title: '秋の達人',    desc: '秋の旬の植物を5種コレクションする', xpReward: 350, type: 'collect_seasonal', target: 5 },
  ],
  冬: [
    { id: 'sc_winter_1', icon: 'snow-outline', title: '冬の恵み',   desc: '冬の旬の植物を1種コレクションする', xpReward: 60,  type: 'collect_seasonal', target: 1 },
    { id: 'sc_winter_3', icon: 'snow-outline', title: '冬の探索者', desc: '冬の旬の植物を3種コレクションする', xpReward: 180, type: 'collect_seasonal', target: 3 },
    { id: 'sc_winter_5', icon: 'snow-outline', title: '冬の達人',   desc: '冬の旬の植物を5種コレクションする', xpReward: 350, type: 'collect_seasonal', target: 5 },
  ],
};

// ─── Progress calculators ─────────────────────────────────────────────────
export interface ChallengeSnap {
  todayScanCount: number;
  todayNewCount: number;
  todayMaxRarity: number;
  todayDangers: string[];
  todayCategories: string[];
  seasonalDiscoveredCount?: number;
}

/** 0..1 progress for a daily challenge given today's activity snapshot. */
export function getChallengePct(challenge: Challenge, snap: ChallengeSnap): number {
  switch (challenge.type) {
    case 'scan_count':     return Math.min(snap.todayScanCount / challenge.target, 1);
    case 'discover_new':   return Math.min(snap.todayNewCount / challenge.target, 1);
    case 'find_rarity_4':  return snap.todayMaxRarity >= 4 ? 1 : 0;
    case 'find_rarity_5':  return snap.todayMaxRarity >= 5 ? 1 : 0;
    case 'find_green':     return snap.todayDangers.includes('GREEN') ? 1 : 0;
    case 'find_red':       return snap.todayDangers.includes('RED') ? 1 : 0;
    case 'find_herb':      return snap.todayCategories.includes('スパイス・ハーブ') ? 1 : 0;
    case 'collect_seasonal':
      return Math.min((snap.seasonalDiscoveredCount ?? 0) / challenge.target, 1);
    default:               return 0;
  }
}
