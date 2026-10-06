/**
 * G1 current-catalog taxonomy resolution worklist.
 *
 * This file does not perform network calls. It produces deterministic queries
 * for the 149 YAKU taxon seeds; backend/CLI tooling can feed these into the
 * approved resolver and persist reviewed results.
 */

import { CURRENT_CATALOG_TAXA } from './taxonSeedRegistry';
import { TaxonomyResolutionQuery } from '../../types/globalPlantBrain';

export const CURRENT_CATALOG_TAXONOMY_WORKLIST: TaxonomyResolutionQuery[] =
  CURRENT_CATALOG_TAXA.map((taxon) => ({
    yakuTaxonConceptId: taxon.id,
    scientificName: taxon.scientificName,
    expectedRank: taxon.rank,
    kingdom: 'Plantae',
  }));
