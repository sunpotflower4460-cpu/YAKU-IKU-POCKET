// Feature flags for the v3 blueprint rollout (docs/BLUEPRINT_V3.md, PR16).
//
// Each flag gates a whole PR's worth of UI so an in-progress feature never
// ships half-built. Flip a flag to `true` in the PR that finishes the
// corresponding feature — never enable ahead of the implementing PR.
export const FEATURE_FLAGS = {
  /** PR18: per-trait match/mismatch/unknown checklist in candidate compare. */
  compareInField: false,
  /** PR19: 30秒/3分/深く学ぶ structured learning on the plant detail screen. */
  learningExperience: false,
  /** PR20: timeline/revisit/natural-language search Fieldbook rebuild. */
  fieldbookV2: false,
  /** PR21+PR22: PlantUse gates and the 暮らし (cooking/living) hub. */
  usesSafetyArchitecture: false,
  /** PR23: non-plant subject classification ahead of species identification. */
  subjectRouter: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
