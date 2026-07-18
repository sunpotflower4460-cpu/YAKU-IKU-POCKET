// Semantic color tokens (PR7 — Design Foundation).
//
// Screens should reference these names (via useTheme()), not raw hex values,
// so light/dark mode and future palette tuning are centralised. The legacy
// `src/constants/colors.ts` (`Colors`) remains in place for screens not yet
// migrated — each screen migrates when its own PR touches it (see
// docs/IMPLEMENTATION_ROADMAP.md), not as a single big-bang change.

export interface AppColors {
  canvas: string;
  canvasElevated: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceTertiary: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnAccent: string;

  borderSubtle: string;
  borderStrong: string;

  accentPrimary: string;
  accentPrimaryPressed: string;
  accentSecondary: string;

  statusObserved: string;
  statusProvisional: string;
  statusVerified: string;
  statusCaution: string;
  statusDanger: string;

  rarityCommon: string;
  rarityUncommon: string;
  rarityRare: string;
  rarityEpic: string;
  rarityLegendary: string;

  overlay: string;
  shadow: string;
}

export const lightColors: AppColors = {
  canvas: '#F3F8F3',
  canvasElevated: '#FFFFFF',
  surfacePrimary: '#FFFFFF',
  surfaceSecondary: '#EEF6EE',
  surfaceTertiary: '#E4F0E4',

  textPrimary: '#16241A',
  textSecondary: '#4B6350',
  textTertiary: '#6E8874',
  textOnAccent: '#FFFFFF',

  borderSubtle: '#DCE8DC',
  borderStrong: '#B9D2BA',

  accentPrimary: '#2E7D32',
  accentPrimaryPressed: '#245F27',
  accentSecondary: '#5C8A5F',

  statusObserved: '#3E7D45',
  statusProvisional: '#7A6A2E',
  statusVerified: '#1B5E20',
  statusCaution: '#9A5B10',
  statusDanger: '#B3261E',

  rarityCommon: '#7C8B7E',
  rarityUncommon: '#3E8E52',
  rarityRare: '#2A6FB0',
  rarityEpic: '#7B3FA0',
  rarityLegendary: '#B8730C',

  overlay: 'rgba(10, 20, 12, 0.55)',
  shadow: '#0A140C',
};

export const darkColors: AppColors = {
  canvas: '#0E1712',
  canvasElevated: '#141F19',
  surfacePrimary: '#182420',
  surfaceSecondary: '#1E2C25',
  surfaceTertiary: '#25352C',

  textPrimary: '#EAF3EA',
  textSecondary: '#AFC5B2',
  textTertiary: '#84A08A',
  textOnAccent: '#0B140D',

  borderSubtle: '#263429',
  borderStrong: '#37493C',

  accentPrimary: '#6FCB77',
  accentPrimaryPressed: '#8DDB93',
  accentSecondary: '#8FB893',

  statusObserved: '#7FCB86',
  statusProvisional: '#D8C066',
  statusVerified: '#8FDD93',
  statusCaution: '#E3A94E',
  statusDanger: '#F2867D',

  rarityCommon: '#9AA79C',
  rarityUncommon: '#6FCB86',
  rarityRare: '#7FB4EA',
  rarityEpic: '#C79BE8',
  rarityLegendary: '#F0B451',

  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: '#000000',
};
