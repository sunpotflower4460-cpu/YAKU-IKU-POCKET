// Observation / identification state model (introduced in PR6).
//
// This is intentionally lightweight. The full PlantDefinition / Observation
// rebuild (multi-photo, taxonomy IDs, candidate lists) lands in later PRs
// (KNOWLEDGE_SCHEMA / PR11, PR13). PR6 only formalizes the identification
// *state* and the *safety* model so the UI can stop asserting certainty.

/**
 * How confident we are about what a photo shows.
 *
 * - `unidentified`        : could not confidently match anything.
 * - `candidates`          : one or more candidates, none confirmed by a human.
 * - `user_selected`       : the user picked a candidate as their best guess.
 * - `community_supported` : agreed with by other users (future).
 * - `expert_verified`     : confirmed by an expert / authoritative source (future).
 */
export type IdentificationState =
  | 'unidentified'
  | 'candidates'
  | 'user_selected'
  | 'community_supported'
  | 'expert_verified';

/** Human-readable label for an identification state (never asserts certainty). */
export const IDENTIFICATION_STATE_LABEL: Record<IdentificationState, string> = {
  unidentified: '特定できませんでした',
  candidates: '候補を表示しています',
  user_selected: 'あなたが選んだ候補',
  community_supported: 'みんなの支持あり',
  expert_verified: '専門家による確認済み',
};

/**
 * Structured safety information. GREEN/YELLOW/RED on the `Plant` type is being
 * phased out at the presentation layer in favour of this richer model; PR6
 * introduces the type and the look-alike rule engine (see src/data/safety.ts),
 * while the per-plant data migration to full profiles is a later PR.
 */
export type SafetyLevel =
  | 'general_observation'
  | 'caution'
  | 'avoid_contact'
  | 'high_risk';

export interface SafetyProfile {
  level: SafetyLevel;
  toxicParts: string[];
  confusedWith: string[];
  handlingWarnings: string[];
  ingestionWarnings: string[];
  officialIncidentNotes: string[];
  emergencyGuidance?: string;
  sourceRefs: string[];
  reviewedAt?: string;
}
