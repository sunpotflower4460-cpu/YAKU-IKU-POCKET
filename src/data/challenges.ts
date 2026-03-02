export type ChallengeType =
  | 'scan_count'    // scan N times today
  | 'discover_new'  // discover N new plants
  | 'find_rarity_4' // find rarity >= 4
  | 'find_rarity_5' // find rarity 5
  | 'find_green'    // find GREEN plant
  | 'find_red'      // find RED (dangerous) plant
  | 'find_herb';    // find spice/herb category

export interface Challenge {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  xpReward: number;
  type: ChallengeType;
  target: number;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'q1', emoji: '📷', title: '今日の採集家',
    desc: '植物を2種スキャンする', xpReward: 30,
    type: 'scan_count', target: 2,
  },
  {
    id: 'q2', emoji: '✨', title: '新発見！',
    desc: '新しい植物を1種発見する', xpReward: 80,
    type: 'discover_new', target: 1,
  },
  {
    id: 'q3', emoji: '🔍', title: '熱心な調査',
    desc: '植物を5種スキャンする', xpReward: 80,
    type: 'scan_count', target: 5,
  },
  {
    id: 'q4', emoji: '⭐', title: 'レアハンター',
    desc: '★4以上の植物を発見する', xpReward: 150,
    type: 'find_rarity_4', target: 1,
  },
  {
    id: 'q5', emoji: '👑', title: '伝説の探索者',
    desc: '★5の伝説植物を発見する', xpReward: 300,
    type: 'find_rarity_5', target: 1,
  },
  {
    id: 'q6', emoji: '🟢', title: '安全な収穫',
    desc: '食用可能な植物（GREEN）を発見する', xpReward: 40,
    type: 'find_green', target: 1,
  },
  {
    id: 'q7', emoji: '☠️', title: '危険植物調査',
    desc: '有毒植物（RED）を発見する', xpReward: 100,
    type: 'find_red', target: 1,
  },
  {
    id: 'q8', emoji: '🌿', title: 'ハーブ探し',
    desc: 'スパイス・ハーブを発見する', xpReward: 60,
    type: 'find_herb', target: 1,
  },
  {
    id: 'q9', emoji: '🌱', title: 'コレクター',
    desc: '今日3種の新植物を発見する', xpReward: 200,
    type: 'discover_new', target: 3,
  },
  {
    id: 'q10', emoji: '💊', title: '養生マスター',
    desc: '植物を10種スキャンする', xpReward: 150,
    type: 'scan_count', target: 10,
  },
];

/** Returns 3 deterministic, unique challenges for the given YYYY-MM-DD string. */
export function getDailyChallenges(dateStr: string): Challenge[] {
  // Seed from date
  let seed = 0;
  for (const ch of dateStr) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  seed = Math.abs(seed);

  const n = CHALLENGES.length;
  const picked: number[] = [];
  let s = seed;
  while (picked.length < 3) {
    s = (s * 9301 + 49297) % 233280;
    const idx = s % n;
    if (!picked.includes(idx)) picked.push(idx);
  }
  return picked.map((i) => CHALLENGES[i]);
}

/** 0..1 progress for a challenge given today's activity snapshot. */
export function getChallengePct(
  challenge: Challenge,
  snap: {
    todayScanCount: number;
    todayNewCount: number;
    todayMaxRarity: number;
    todayDangers: string[];
    todayCategories: string[];
  }
): number {
  switch (challenge.type) {
    case 'scan_count':
      return Math.min(snap.todayScanCount / challenge.target, 1);
    case 'discover_new':
      return Math.min(snap.todayNewCount / challenge.target, 1);
    case 'find_rarity_4':
      return snap.todayMaxRarity >= 4 ? 1 : 0;
    case 'find_rarity_5':
      return snap.todayMaxRarity >= 5 ? 1 : 0;
    case 'find_green':
      return snap.todayDangers.includes('GREEN') ? 1 : 0;
    case 'find_red':
      return snap.todayDangers.includes('RED') ? 1 : 0;
    case 'find_herb':
      return snap.todayCategories.includes('スパイス・ハーブ') ? 1 : 0;
    default:
      return 0;
  }
}
