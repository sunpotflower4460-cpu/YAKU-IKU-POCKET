/**
 * Atomic claim model for the Global Plant Brain (G0).
 *
 * A page is never treated as one giant sourced fact. Each statement carries
 * its own evidence class, context, sources and provenance.
 */

import {
  YakuClaimId,
  YakuProvenanceId,
  YakuSourceId,
} from './canonicalIds';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ClaimEvidenceClass =
  | 'cultural_record'
  | 'traditional_use'
  | 'pharmacopoeial'
  | 'regulatory_traditional_use'
  | 'regulatory_well_established_use'
  | 'preclinical'
  | 'clinical_observational'
  | 'rct'
  | 'systematic_review'
  | 'regulatory_approved_drug'
  | 'insufficient_evidence'
  | 'conflicting_evidence'
  | 'descriptive'
  | 'taxonomic';

export type ClaimReviewStatus =
  | 'raw'
  | 'auto_extracted'
  | 'source_validated'
  | 'ai_validated'
  | 'curator_reviewed'
  | 'expert_reviewed'
  | 'community_approved'
  | 'rejected'
  | 'superseded'
  | 'invalidated';

export type ClaimTemporalRole =
  | 'historical_record'
  | 'current_status'
  | 'evolving_science';

export interface KnowledgeClaimContext {
  materialId?: string;
  preparationId?: string;
  population?: string;
  jurisdiction?: string;
  traditionId?: string;
  timepoint?: string;
  plantPart?: string;
}

export interface KnowledgeClaim {
  id: YakuClaimId;

  subjectType: string;
  subjectId: string;
  predicate: string;
  object: JsonValue;

  context: KnowledgeClaimContext;
  evidenceClass: ClaimEvidenceClass;

  /** Sources directly supporting THIS claim, not merely the surrounding page. */
  sourceRefIds: YakuSourceId[];
  provenanceId: YakuProvenanceId;

  status: ClaimReviewStatus;
  temporalRole: ClaimTemporalRole;

  realityTime?: string;
  createdAt: string;
  evaluatedAt?: string;
}

export function validateKnowledgeClaim(claim: KnowledgeClaim): string[] {
  const issues: string[] = [];

  if (!claim.subjectType.trim()) issues.push('subject_type_required');
  if (!claim.subjectId.trim()) issues.push('subject_id_required');
  if (!claim.predicate.trim()) issues.push('predicate_required');
  if (claim.sourceRefIds.length === 0) issues.push('source_ref_required');
  if (!claim.createdAt.trim()) issues.push('created_at_required');

  return issues;
}
