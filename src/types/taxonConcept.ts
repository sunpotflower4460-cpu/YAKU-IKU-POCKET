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
}
