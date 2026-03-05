export const PLAYER_TITLES = [
  { minLevel: 1,  label: '見習いハーバリスト 🌱' },
  { minLevel: 3,  label: 'ハーブ採取師 🌿' },
  { minLevel: 5,  label: '野草マスター 🍃' },
  { minLevel: 8,  label: '薬草鑑定士 🔬' },
  { minLevel: 12, label: '養生の達人 🏆' },
  { minLevel: 20, label: '伝説の薬育師 ⭐' },
];

export function getPlayerTitle(level: number): string {
  let title = PLAYER_TITLES[0].label;
  for (const t of PLAYER_TITLES) {
    if (level >= t.minLevel) title = t.label;
  }
  return title;
}
