// Single source of truth for demo vs. production mode.
//
// Demo mode (no real AI key configured) uses the weighted-random mock. Per the
// product directive, demo results are VIEW-ONLY: they must never be persisted
// as real observations, must not grant XP, and must not register plants to the
// collection. Only real identifications (production mode) may be saved.
//
// When a backend proxy + real provider land (PR14), production mode is gated on
// that path — never on a bundled key. See docs/SAFETY_POLICY.md.

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

/** True when the app is running on the random mock (no real identification). */
export const IS_DEMO_MODE = CLAUDE_API_KEY.length === 0;

/** True when real identifications may be saved to the user's collection. */
export const CAN_PERSIST_OBSERVATIONS = !IS_DEMO_MODE;
