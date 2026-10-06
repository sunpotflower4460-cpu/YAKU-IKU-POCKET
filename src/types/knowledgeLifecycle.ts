/**
 * Living Evidence Graph lifecycle primitives (G0).
 *
 * Knowledge is append-only in spirit: source assertions are superseded or
 * invalidated rather than silently overwritten, and promotion to production
 * must move through staging.
 */

import {
  YakuAssertionId,
  YakuClaimId,
  YakuKnowledgeSnapshotId,
  YakuSourceId,
} from './canonicalIds';
import { JsonValue } from './knowledgeClaim';

export type AssertionStatus =
  | 'active'
  | 'superseded'
  | 'invalidated'
  | 'retracted';

export interface KnowledgeAssertion {
  id: YakuAssertionId;

  subjectType: string;
  subjectId: string;
  predicate: string;
  object: JsonValue;

  sourceRefIds: YakuSourceId[];
  sourceVersion?: string;

  assertedAt: string;
  validFrom?: string;
  validUntil?: string;

  status: AssertionStatus;
  /** Present on a newer assertion that replaces an older assertion. */
  supersedesAssertionId?: YakuAssertionId;
  /** Present on an older assertion once a replacement is known. */
  supersededByAssertionId?: YakuAssertionId;
}

export type KnowledgeStage =
  | 'raw'
  | 'staging'
  | 'production'
  | 'quarantined'
  | 'archived';

export interface VersionedKnowledgeRecord<T> {
  record: T;
  version: number;
  stage: KnowledgeStage;

  createdAt: string;
  promotedAt?: string;
  archivedAt?: string;

  previousVersion?: number;
}

const ALLOWED_STAGE_TRANSITIONS: Record<KnowledgeStage, KnowledgeStage[]> = {
  raw: ['staging', 'quarantined', 'archived'],
  staging: ['production', 'quarantined', 'archived'],
  production: ['quarantined', 'archived'],
  quarantined: ['staging', 'archived'],
  archived: [],
};

export function canTransitionKnowledgeStage(
  from: KnowledgeStage,
  to: KnowledgeStage,
): boolean {
  return ALLOWED_STAGE_TRANSITIONS[from].includes(to);
}

export function transitionKnowledgeStage<T>(
  envelope: VersionedKnowledgeRecord<T>,
  to: KnowledgeStage,
  at: string,
): VersionedKnowledgeRecord<T> {
  if (!canTransitionKnowledgeStage(envelope.stage, to)) {
    throw new Error(
      `Invalid knowledge-stage transition: ${envelope.stage} -> ${to}`,
    );
  }

  return {
    ...envelope,
    stage: to,
    promotedAt: to === 'production' ? at : envelope.promotedAt,
    archivedAt: to === 'archived' ? at : envelope.archivedAt,
  };
}

export type DependencyRelation =
  | 'derived_from'
  | 'supported_by'
  | 'synthesizes'
  | 'depends_on_taxonomy'
  | 'depends_on_policy'
  | 'supersedes';

export type KnowledgeDependencyTarget =
  | { type: 'source'; id: YakuSourceId }
  | { type: 'assertion'; id: YakuAssertionId }
  | { type: 'claim'; id: YakuClaimId }
  | { type: 'external'; id: string };

export interface KnowledgeDependencyEdge {
  fromClaimId: YakuClaimId;
  target: KnowledgeDependencyTarget;
  relation: DependencyRelation;
  createdAt: string;
}

export function findClaimsDependingOn(
  target: KnowledgeDependencyTarget,
  edges: KnowledgeDependencyEdge[],
): YakuClaimId[] {
  const matches = edges
    .filter(
      (edge) =>
        edge.target.type === target.type &&
        edge.target.id === target.id,
    )
    .map((edge) => edge.fromClaimId);

  return [...new Set(matches)];
}

export interface KnowledgeSnapshot {
  id: YakuKnowledgeSnapshotId;
  createdAt: string;

  taxonomyVersions: Record<string, string>;
  sourceVersions: Record<string, string>;

  policyVersion: string;
  notes?: string;
}

export function validateKnowledgeAssertion(
  assertion: KnowledgeAssertion,
): string[] {
  const issues: string[] = [];

  if (!assertion.subjectType.trim()) issues.push('subject_type_required');
  if (!assertion.subjectId.trim()) issues.push('subject_id_required');
  if (!assertion.predicate.trim()) issues.push('predicate_required');
  if (assertion.sourceRefIds.length === 0) issues.push('source_ref_required');
  if (!assertion.assertedAt.trim()) issues.push('asserted_at_required');

  if (
    assertion.status === 'superseded' &&
    !assertion.supersededByAssertionId
  ) {
    issues.push('superseded_by_assertion_link_required');
  }

  return issues;
}
