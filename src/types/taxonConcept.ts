/**
 * Canonical taxon concept types for the Global Plant Brain.
 *
 * A YAKU taxon concept is an internal identity object. External database IDs
 * remain cross-references and may be absent until authoritative resolution.
 */

import { YakuTaxonConceptId } from './canonicalIds';

export type TaxonRank =
  | 'species'
  | 'subspecies'
  | 'variety'
  | 'form'
  | 'genus'
  | 'family'
  | 'hybrid'
  | 'unresolved';

export type TaxonResolutionStatus =
  | 'local_seed'
  | 'externally_resolved'
  | 'externally_reconciled'
  | 'conflicted'
  | 'unresolved';

export interface TaxonExternalIds {
  col?: string;
  wfo?: string;
  wcvp?: string;
  ipni?: string;
  gbif?: string;
  plantnet?: string;
  inaturalist?: string;
  ylist?: string;
}

export type TaxonAuthorityProvider =
  | 'catalogue_of_life'
  | 'world_flora_online'
  | 'wcvp'
  | 'ipni';

export type TaxonAuthorityRelation =
  | 'same_accepted_usage'
  | 'synonym_of'
  | 'alternative_taxonomy'
  | 'conflict';

export interface TaxonAuthorityReference {
  provider: TaxonAuthorityProvider;
  queriedScientificName: string;

  matchedUsageId?: string;
  matchedScientificName?: string;
  matchedStatus?: string;

  acceptedUsageId?: string;
  acceptedScientificName?: string;
  acceptedRank?: TaxonRank;

  relation: TaxonAuthorityRelation;
  sourceUrl?: string;
  sourceRelease?: string;
  checkedAt: string;
  notes?: string;
}

export interface TaxonResolutionEvidence {
  provider: 'catalogue_of_life' | 'world_flora_online' | 'wcvp' | 'ipni';
  providerRecordId: string;
  sourceRelease: string;
  sourceDatasetKey?: string;
  sourceDoi?: string;
  resolvedAt: string;
}

export interface TaxonConceptSeed {
  id: YakuTaxonConceptId;
  rank: TaxonRank;

  /**
   * Current catalog scientific name carried into the seed.
   * This is NOT automatically promoted to an externally accepted name.
   */
  scientificName: string;

  representativePlantId: string;
  productPlantIds: string[];

  resolutionStatus: TaxonResolutionStatus;
  externalIds: TaxonExternalIds;
  resolutionEvidence?: TaxonResolutionEvidence;

  /**
   * Catalog name is preserved in scientificName. These fields represent the
   * current reconciled preferred view when multiple authorities agree.
   */
  preferredScientificName?: string;
  preferredRank?: TaxonRank;
  authorityReferences?: TaxonAuthorityReference[];
}
