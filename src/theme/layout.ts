// Responsive layout primitives shared by phone, tablet, and web surfaces.
// Keep these independent from color/theme state so list measurements can use
// them without subscribing to the ThemeProvider.

/** Wide workspace used by discovery grids and dashboard-style screens. */
export const CONTENT_MAX_WIDTH = 1120;

/** Comfortable width for mixed cards, settings, and fieldbook content. */
export const READING_MAX_WIDTH = 920;

/** Narrow reading measure for permission, empty, and explanatory states. */
export const FOCUSED_MAX_WIDTH = 640;
