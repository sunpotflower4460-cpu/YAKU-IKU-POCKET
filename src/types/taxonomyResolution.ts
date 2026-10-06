/**
 * Taxonomy resolution contracts for G1.
 *
 * The resolver never equates "a search result exists" with "this YAKU taxon
 * is authoritatively resolved". Exact accepted plant matches may be promoted
 * automatically; synonyms, variants, fuzzy matches and ambiguity require
 * review so taxon-concept relationships can be represented explicitly.
 */

import { YakuTaxonConceptId } from './canonicalIds';
import { TaxonRank } from './taxonConcept';

export type TaxonomyProvider =
  | 'catalogue_of_life'
  | 'world_flora_online'
  | 'wcvp'
  | 'ipni';

export type TaxonomicStatus =
  | 'accepted'
  | 'provisionally_accepted'
  | 'synonym'
  | 'ambiguous_synonym'
  | 'misapplied'
  | 'unknown';

export type TaxonomyMatchType =
  | 'exact'
  | 'variant'
  | 'fuzzy'
  | 'ambiguous'
  | 'none';

export interface TaxonomySourceVersion {
  provider: TaxonomyProvider;
  releaseLabel: string;
  issuedAt?: string;
  datasetKey?: string;
  checklistKey?: string;
  doi?: string;
}

export interface TaxonomyClassificationNode {
  providerRecordId: string;
  name: string;
  rank: string;
}

export interface AcceptedTaxonReference {
  providerRecordId: string;
  scientificName: string;
  canonicalName?: string;
  rank?: string;
  status?: TaxonomicStatus;
}

export interface TaxonomyMatchCandidate {
  provider: TaxonomyProvider;
  providerRecordId: string;

  queriedName: string;
  scientificName: string;
  canonicalName?: string;

  rank: string;
  status: TaxonomicStatus;

  matchType: TaxonomyMatchType;
  confidence?: number;

  acceptedTaxon?: AcceptedTaxonReference;
  classification: TaxonomyClassificationNode[];

  sourceVersion: TaxonomySourceVersion;
}

export interface TaxonomyResolutionQuery {
  yakuTaxonConceptId: YakuTaxonConceptId;
  scientificName: string;
  expectedRank: TaxonRank;
  kingdom: 'Plantae';
}

export type TaxonomyResolutionDecision =
  | 'auto_resolve'
  | 'needs_review'
  | 'unresolved';

export interface TaxonomyResolutionAssessment {
  decision: TaxonomyResolutionDecision;
  query: TaxonomyResolutionQuery;
  candidate?: TaxonomyMatchCandidate;
  reasons: string[];
}

function normalizedRank(rank: string): string {
  return rank.trim().toLowerCase();
}

function hasPlantKingdom(candidate: TaxonomyMatchCandidate): boolean {
  return candidate.classification.some(
    (node) =>
      normalizedRank(node.rank) === 'kingdom' &&
      node.name.trim().toLowerCase() === 'plantae',
  );
}

/**
 * Conservative first-pass promotion policy.
 *
 * Only an exact, accepted, high-confidence plant match at the expected rank
 * may auto-resolve. Synonyms are intentionally reviewed because they create a
 * historical/name relationship rather than merely filling an external ID.
 */
export function assessTaxonomyCandidate(
  query: TaxonomyResolutionQuery,
  candidate?: TaxonomyMatchCandidate,
): TaxonomyResolutionAssessment {
  if (!candidate || candidate.matchType === 'none') {
    return {
      decision: 'unresolved',
      query,
      candidate,
      reasons: ['no_authoritative_match'],
    };
  }

  const reasons: string[] = [];

  if (!hasPlantKingdom(candidate)) reasons.push('kingdom_not_confirmed_plantae');
  if (normalizedRank(candidate.rank) !== query.expectedRank) {
    reasons.push('rank_mismatch');
  }
  if (candidate.matchType !== 'exact') {
    reasons.push(`match_type_${candidate.matchType}`);
  }
  if (candidate.status !== 'accepted') {
    reasons.push(`status_${candidate.status}`);
  }
  if (candidate.confidence != null && candidate.confidence < 95) {
    reasons.push('confidence_below_auto_threshold');
  }

  if (reasons.length > 0) {
    return {
      decision: 'needs_review',
      query,
      candidate,
      reasons,
    };
  }

  return {
    decision: 'auto_resolve',
    query,
    candidate,
    reasons: ['exact_accepted_plant_match'],
  };
}
