// Design tokens (PR7 — Design Foundation).
// Non-color primitives: spacing, radius, typography scale, motion durations,
// minimum tap target size. Colors live in src/theme/colors.ts since they need
// a light/dark pair.

/** 4pt-based spacing scale. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

/** Corner radius scale. */
export const radius = {
  control: 11, // compact controls: 10-12
  card: 17, // standard card: 16-18
  major: 24, // major card: 22-28
  sheet: 30, // modal / bottom sheet: 28-32
  pill: 999,
} as const;

/** Type scale (pt). System font + Dynamic Type via RN's default allowFontScaling. */
export const type = {
  display: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  callout: 16,
  subheadline: 15,
  footnote: 13,
  caption1: 12,
  caption2: 11,
} as const;

/** Font weights, kept coarse to avoid overusing bold. */
export const weight = {
  primary: '800' as const,
  secondary: '700' as const,
  body: '500' as const,
  regular: '400' as const,
};

/** Motion durations (ms). Respect Reduce Motion at the call site. */
export const motion = {
  stateChange: 170,
  expand: 240,
  modal: 340,
  celebration: 800,
} as const;

/** Minimum accessible tap target (pt). */
export const minTapTarget = 44;
