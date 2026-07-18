// Observation / identification state model (introduced in PR6, extended PR10).
//
// This is intentionally lightweight. The full PlantDefinition / Observation
// rebuild (multi-photo, taxonomy IDs) lands in later PRs (KNOWLEDGE_SCHEMA /
// PR11, PR13). PR6 formalizes the identification *state* and *safety* model;
// PR10 adds the candidate list so results can present "a few possibilities"
// instead of a single unearned certainty.

import { Plant } from '.';

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

/**
 * Per-candidate score breakdown (PR10, §10.1 CandidateScore).
 *
 * Only fields we can honestly compute are populated:
 * - `visionScore`  : the model's own confidence (or, in demo mode, undefined —
 *                    demo mode does no real analysis, so it gets no score here).
 * - `seasonScore`  : computed locally from the plant's season data, not the LLM.
 * `regionScore`/`morphologyScore` are omitted until real location/morphology
 * data exists (see docs/IDENTIFICATION_PIPELINE.md) — we do not fabricate them.
 */
export interface CandidateScore {
  visionScore?: number;
  seasonScore?: number;
  overallRank: number;
}

export interface IdentificationCandidate {
  plant: Plant;
  score: CandidateScore;
  reason?: string;
}
