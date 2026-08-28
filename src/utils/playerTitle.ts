export const PLAYER_TITLES = [
  { minLevel: 1, label: 'はじめの観察者' },
  { minLevel: 3, label: '野の観察者' },
  { minLevel: 5, label: '季節の記録者' },
  { minLevel: 8, label: '植物の探求者' },
  { minLevel: 12, label: 'フィールドナチュラリスト' },
  { minLevel: 20, label: '薬育の案内人' },
];

export function getPlayerTitle(level: number): string {
  let title = PLAYER_TITLES[0].label;
  for (const candidate of PLAYER_TITLES) {
    if (level >= candidate.minLevel) title = candidate.label;
  }
  return title;
}
