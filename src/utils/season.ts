export type Season = '春' | '夏' | '秋' | '冬';

const SEASON_ORDER: Season[] = ['春', '夏', '秋', '冬'];

export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

export interface SeasonConfig {
  emoji: string;
  color: string;
  bg: string;
  desc: string;
}

export const SEASON_CONFIG: Record<Season, SeasonConfig> = {
  春: { emoji: '🌸', color: '#C2185B', bg: '#FFF0F5', desc: '春の野草・ハーブが見つかりやすくなっています' },
  夏: { emoji: '☀️', color: '#E65100', bg: '#FFF3E0', desc: '夏の植物が見つかりやすくなっています' },
  秋: { emoji: '🍂', color: '#6D4C41', bg: '#FBE9E7', desc: '秋の植物が見つかりやすくなっています' },
  冬: { emoji: '❄️', color: '#1565C0', bg: '#E3F2FD', desc: '冬でも見られる植物が出現します' },
};

/**
 * Determine whether a plant is in season.
 * Handles:
 *  - '通年' / '年中'  → always true
 *  - Exact season name '春', '夏', etc. in the string
 *  - Range patterns like '春〜秋' (season spans start→end, inclusive)
 *  - Wrap-around ranges like '秋〜春'
 */
export function isPlantInSeason(plantSeason: string, season: Season): boolean {
  if (plantSeason.includes('通年') || plantSeason.includes('年中')) return true;

  // Check range pattern first (e.g. '春〜秋')
  const rangeMatch = plantSeason.match(/([春夏秋冬])〜([春夏秋冬])/);
  if (rangeMatch) {
    const si = SEASON_ORDER.indexOf(rangeMatch[1] as Season);
    const ei = SEASON_ORDER.indexOf(rangeMatch[2] as Season);
    const ci = SEASON_ORDER.indexOf(season);
    if (si <= ei) return ci >= si && ci <= ei;
    // Wrap-around (e.g. '秋〜春')
    return ci >= si || ci <= ei;
  }

  return plantSeason.includes(season);
}
