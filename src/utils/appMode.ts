// Single source of truth for demo vs. production mode.
//
// Demo mode (no real AI key configured, OR the user has not given consent to
// send photos to the AI provider) uses the weighted-random mock. Per the
// product directive, demo results are VIEW-ONLY: they must never be persisted
// as real observations, must not grant XP, and must not register plants to the
// collection. Only real identifications (production mode) may be saved.
//
// When a backend proxy + real provider land (PR14), production mode is gated on
// that path — never on a bundled key. See docs/SAFETY_POLICY.md.
//
// AI consent (§11 "同意画面"): even with a key configured, the app must not
// send photos to a third party until the user has explicitly agreed (Fieldbook
// settings, PR13). `aiConsentGiven` is read from the store at the call site
// (components) so this module stays a plain, store-independent utility.

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

/** True when a real AI key is bundled — a capability signal, not a permission. */
export const HAS_CLAUDE_API_KEY = CLAUDE_API_KEY.length > 0;

/** True when the app should use the random mock: no key, or consent not given. */
export function isDemoMode(aiConsentGiven: boolean): boolean {
  return !HAS_CLAUDE_API_KEY || !aiConsentGiven;
}

/** True when real identifications may be saved to the user's collection. */
export function canPersistObservations(aiConsentGiven: boolean): boolean {
  return !isDemoMode(aiConsentGiven);
}
