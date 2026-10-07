/**
 * Active material taxonomy conflicts for the current catalog (G1).
 */

import {
  TaxonomyConflict,
  TaxonomyOperation,
  TaxonomyOperationDecision,
  YakuTaxonConceptId,
} from '../../types/globalPlantBrain';
import { CONFLICTED_TAXON_REVIEWS } from './taxonomyCrossSourceReview';

const REVIEWED_AT = '2026-10-07';
const POLICY_VERSION = 'gpb-g1-taxonomy-conflict-v1';

const DEFAULT_CONFLICT_POLICY: Record<
  TaxonomyOperation,
  TaxonomyOperationDecision
> = {
  catalog_lookup: 'allow',
  plant_name_lookup: 'allow',
  source_scoped_evidence: 'allow',

  preferred_name_autoselect: 'deny',
  external_accepted_id_promotion: 'deny',

  accepted_rank_change: 'review',
  taxon_merge: 'review',
  cross_source_evidence_merge: 'review',
  product_scientific_name_migration: 'review',
};

const CONFLICT_KINDS: Record<string, TaxonomyConflict['kinds']> = {
  'yaku:taxon:p001': [
    'rank_disagreement',
    'status_disagreement',
  ],
  'yaku:taxon:p060': [
    'accepted_concept_disagreement',
  ],
  'yaku:taxon:p079': [
    'accepted_concept_disagreement',
    'status_disagreement',
  ],
  'yaku:taxon:h043': [
    'rank_disagreement',
    'hybrid_status_disagreement',
    'ambiguous_usage',
  ],
  'yaku:taxon:h047': [
    'accepted_concept_disagreement',
    'rank_disagreement',
    'status_disagreement',
  ],
};

export const CURRENT_TAXONOMY_CONFLICTS: TaxonomyConflict[] =
  CONFLICTED_TAXON_REVIEWS.map((review) => ({
    taxonId: review.taxonId,
    catalogScientificName: review.catalogScientificName,
    kinds: CONFLICT_KINDS[review.taxonId] ?? [
      'accepted_concept_disagreement',
    ],
    authorityProviders: [
      ...new Set(review.references.map((ref) => ref.provider)),
    ],
    summary: review.conflictSummary,
    operationPolicy: { ...DEFAULT_CONFLICT_POLICY },
    status: 'active',
    reviewedAt: REVIEWED_AT,
    policyVersion: POLICY_VERSION,
  }));

const CONFLICT_BY_TAXON_ID = new Map(
  CURRENT_TAXONOMY_CONFLICTS.map((conflict) => [
    conflict.taxonId,
    conflict,
  ]),
);

export function getTaxonomyConflict(
  taxonId: YakuTaxonConceptId,
): TaxonomyConflict | undefined {
  return CONFLICT_BY_TAXON_ID.get(taxonId);
}

export function evaluateTaxonomyOperation(
  taxonId: YakuTaxonConceptId,
  operation: TaxonomyOperation,
): TaxonomyOperationDecision {
  const conflict = getTaxonomyConflict(taxonId);
  if (!conflict || conflict.status !== 'active') return 'allow';

  return conflict.operationPolicy[operation] ?? 'review';
}
