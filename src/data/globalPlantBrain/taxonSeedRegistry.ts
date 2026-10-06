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
  CONFLICTED_TAXON_BY_ID,
  RECONCILED_TAXON_BY_ID,
} from './taxonomyCrossSourceReview';
import {
  makeCanonicalId,
  TaxonConceptSeed,
  TaxonRank,
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

export function inferTaxonRankFromScientificName(
  scientificName: string,
): TaxonRank {
  if (/\bsubsp\.\s+/i.test(scientificName)) return 'subspecies';
  if (/\bvar\.\s+/i.test(scientificName)) return 'variety';
  if (/\bf\.\s+/i.test(scientificName)) return 'form';
  return 'species';
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
    const reconciled = RECONCILED_TAXON_BY_ID.get(id);
    const conflicted = CONFLICTED_TAXON_BY_ID.get(id);
    const acceptedColId = reconciled?.acceptedColId ?? colId;

    return {
      id,
      rank: inferTaxonRankFromScientificName(representative.nameLatin),
      scientificName: representative.nameLatin,
      representativePlantId: representativeId,
      productPlantIds: plants.map((plant) => plant.id),
      resolutionStatus: conflicted
        ? 'conflicted'
        : reconciled
          ? 'externally_reconciled'
          : acceptedColId
            ? 'externally_resolved'
            : 'local_seed',
      externalIds: acceptedColId ? { col: acceptedColId } : {},
      resolutionEvidence: acceptedColId
        ? {
            provider: 'catalogue_of_life',
            providerRecordId: acceptedColId,
            sourceRelease: COL_RESOLUTION_SOURCE.releaseLabel,
            sourceDatasetKey: COL_RESOLUTION_SOURCE.datasetKey,
            sourceDoi: COL_RESOLUTION_SOURCE.doi,
            resolvedAt: COL_RESOLUTION_SOURCE.generatedAt,
          }
        : undefined,
      preferredScientificName: reconciled?.preferredScientificName,
      preferredRank: reconciled?.preferredRank,
      authorityReferences:
        reconciled?.references ?? conflicted?.references ?? undefined,
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
