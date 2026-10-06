/**
 * Canonical taxon seeds for the current 150-card product catalog.
 *
 * Important:
 * - IDs are allocated from stable YAKU product IDs, never from external DB IDs.
 * - External IDs remain empty until G1 authoritative taxonomy resolution.
 * - Multiple product cards may intentionally point to the same taxon.
 */

import { PLANTS } from '../plants';
import {
  COL_AUTO_RESOLVED_IDS,
  COL_RESOLUTION_SOURCE,
} from './colResolutionSnapshot';
import {
  makeCanonicalId,
  TaxonConceptSeed,
  YakuTaxonConceptId,
} from '../../types/globalPlantBrain';

/**
 * Explicit same-taxon aliases inside the current product catalog.
 *
 * p005 スギナ and p009 ツクシ are two product presentations/life-stage views
 * of the same Equisetum arvense taxon. Product cards stay separate while the
 * knowledge layer shares one canonical taxon identity.
 */
export const PRODUCT_TAXON_ALIASES: Readonly<Record<string, string>> = {
  p009: 'p005',
};

function canonicalRepresentativePlantId(plantId: string): string {
  return PRODUCT_TAXON_ALIASES[plantId] ?? plantId;
}

export function getCanonicalTaxonIdForPlant(
  plantId: string,
): YakuTaxonConceptId {
  return makeCanonicalId('taxon', canonicalRepresentativePlantId(plantId));
}

function buildTaxonSeeds(): TaxonConceptSeed[] {
  const groups = new Map<string, typeof PLANTS>();

  for (const plant of PLANTS) {
    const representativeId = canonicalRepresentativePlantId(plant.id);
    const group = groups.get(representativeId) ?? [];
    group.push(plant);
    groups.set(representativeId, group);
  }

  return [...groups.entries()].map(([representativeId, plants]) => {
    const representative =
      plants.find((plant) => plant.id === representativeId) ?? plants[0];

    const id = makeCanonicalId('taxon', representativeId);
    const colId = COL_AUTO_RESOLVED_IDS[id];

    return {
      id,
      rank: 'species',
      scientificName: representative.nameLatin,
      representativePlantId: representativeId,
      productPlantIds: plants.map((plant) => plant.id),
      resolutionStatus: colId ? 'externally_resolved' : 'local_seed',
      externalIds: colId ? { col: colId } : {},
      resolutionEvidence: colId
        ? {
            provider: 'catalogue_of_life',
            providerRecordId: colId,
            sourceRelease: COL_RESOLUTION_SOURCE.releaseLabel,
            sourceDatasetKey: COL_RESOLUTION_SOURCE.datasetKey,
            sourceDoi: COL_RESOLUTION_SOURCE.doi,
            resolvedAt: COL_RESOLUTION_SOURCE.generatedAt,
          }
        : undefined,
    };
  });
}

export const CURRENT_CATALOG_TAXA: TaxonConceptSeed[] = buildTaxonSeeds();

const TAXON_BY_ID = new Map(CURRENT_CATALOG_TAXA.map((taxon) => [taxon.id, taxon]));

export function getCurrentCatalogTaxon(
  id: YakuTaxonConceptId,
): TaxonConceptSeed | undefined {
  return TAXON_BY_ID.get(id);
}
