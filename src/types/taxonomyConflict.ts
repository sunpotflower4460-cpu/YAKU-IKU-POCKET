/**
 * Taxonomy conflict policy for Global Plant Brain.
 *
 * A conflict is a first-class knowledge state, not an error to be erased by
 * majority voting. Safe operations may continue while concept-changing or
 * evidence-collapsing operations require review or are denied.
 */

import { YakuTaxonConceptId } from './canonicalIds';
import { TaxonAuthorityProvider } from './taxonConcept';

export type TaxonomyConflictKind =
  | 'accepted_concept_disagreement'
  | 'rank_disagreement'
  | 'status_disagreement'
  | 'hybrid_status_disagreement'
  | 'ambiguous_usage';

export type TaxonomyOperation =
  | 'catalog_lookup'
  | 'plant_name_lookup'
  | 'source_scoped_evidence'
  | 'preferred_name_autoselect'
  | 'accepted_rank_change'
  | 'taxon_merge'
  | 'cross_source_evidence_merge'
  | 'product_scientific_name_migration'
  | 'external_accepted_id_promotion';

export type TaxonomyOperationDecision = 'allow' | 'review' | 'deny';

export interface TaxonomyConflict {
  taxonId: YakuTaxonConceptId;
  catalogScientificName: string;

  kinds: TaxonomyConflictKind[];
  authorityProviders: TaxonAuthorityProvider[];
  summary: string;

  /**
   * Operations that are not safe to perform automatically while this conflict
   * remains active.
   */
  operationPolicy: Partial<
    Record<TaxonomyOperation, TaxonomyOperationDecision>
  >;

  status: 'active' | 'resolved' | 'superseded';
  reviewedAt: string;
  policyVersion: string;
}
