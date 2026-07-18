// Feature flags for the v3 blueprint rollout (docs/BLUEPRINT_V3.md, PR16).
//
// Each flag gates a whole PR's worth of UI so an in-progress feature never
// ships half-built. Flip a flag to `true` in the PR that finishes the
// corresponding feature — never enable ahead of the implementing PR.
export const FEATURE_FLAGS = {
  /** PR18: per-trait match/mismatch/unknown checklist in candidate compare. */
  compareInField: true,
  /**
   * PR19: 30秒/3分/深く学ぶ structured learning on the plant detail screen.
   * Shipped complete (not partial) in PR19, so app/plant/[id].tsx doesn't
   * gate on this — nothing to hide mid-rollout. Kept `true` for the record.
   */
  learningExperience: true,
  /**
   * PR20: revisit/unidentified-observation/season-breakdown/search Fieldbook
   * additions. Shipped complete in PR20 (see docs/BLUEPRINT_V3.md for the
   * map/natural-language-search scope cuts); not gated at runtime.
   */
  fieldbookV2: true,
  /**
   * PR21+PR22: PlantUse gates and the 暮らし (cooking/living) hub.
   * Shipped complete in PR22 (植物詳細の「暮らしに活かす」section); not
   * gated at runtime — the useGate helpers themselves are the real gate.
   */
  usesSafetyArchitecture: true,
  /** PR23: non-plant subject classification ahead of species identification. */
  subjectRouter: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
