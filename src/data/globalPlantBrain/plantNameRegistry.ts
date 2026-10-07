/**
 * Current-catalog Plant Name Graph projection (G1).
 *
 * TaxonConcept identity and nomenclatural name identity are deliberately
 * separate. The current catalog contributes one scientific-name record per
 * canonical taxon plus reviewed preferred accepted-name records where a
 * synonym relationship has been reconciled.
 */

import {
  PlantNameRecord,
  YakuSourceId,
  makeCanonicalId,
} from '../../types/globalPlantBrain';
import { CURRENT_CATALOG_TAXA } from './taxonSeedRegistry';
import {
  CATALOG_IPNI_SUFFIX_BY_PLANT_ID,
  CATALOG_NAME_WFO_USAGE_OVERRIDES,
  IPNI_DIRECT_SOURCE_OVERRIDES,
  NOMENCLATURE_SNAPSHOT_SOURCE,
  PREFERRED_ACCEPTED_NAME_NOMENCLATURE,
  toIpniLsid,
} from './plantNameNomenclatureSnapshot';

const WFO_SOURCE_ID = makeCanonicalId('source', 'world-flora-online');
const WCVP_SOURCE_ID = makeCanonicalId('source', 'kew-powo-wcvp');
const IPNI_SOURCE_ID = makeCanonicalId('source', 'ipni');
const REVIEWED_AT = '2026-10-07';

function localTaxonToken(taxonId: string): string {
  return taxonId.replace('yaku:taxon:', '');
}

function catalogWfoUsageId(
  localId: string,
  taxon: (typeof CURRENT_CATALOG_TAXA)[number],
): string | undefined {
  const override = CATALOG_NAME_WFO_USAGE_OVERRIDES[localId];
  if (override) return override;

  // For externally-resolved taxa the safe WFO accepted concept is also the
  // exact current catalog scientific-name usage.
  if (taxon.resolutionStatus === 'externally_resolved') {
    return taxon.externalIds.wfo;
  }

  return undefined;
}

function catalogSourceRefs(localId: string): YakuSourceId[] {
  const sources = new Set<YakuSourceId>([WFO_SOURCE_ID]);
  if (IPNI_DIRECT_SOURCE_OVERRIDES.has(localId)) {
    sources.add(IPNI_SOURCE_ID);
  }
  return [...sources];
}

function buildCatalogNameRecords(): PlantNameRecord[] {
  return CURRENT_CATALOG_TAXA.map((taxon) => {
    const localId = localTaxonToken(taxon.id);
    const ipniLsid = toIpniLsid(
      CATALOG_IPNI_SUFFIX_BY_PLANT_ID[localId],
    );

    return {
      id: makeCanonicalId('plant_name', `catalog-${localId}`),
      value: taxon.scientificName,
      type: 'scientific',
      role: 'catalog_scientific',
      rank: taxon.rank,
      taxonConceptIds: [taxon.id],
      nomenclaturalIds: {
        ipniLsid,
        wfoNameUsageId: catalogWfoUsageId(localId, taxon),
      },
      sourceRefIds: catalogSourceRefs(localId),
      sourceVersion: IPNI_DIRECT_SOURCE_OVERRIDES.has(localId)
        ? `WFO ${NOMENCLATURE_SNAPSHOT_SOURCE.wfoRelease} + IPNI reviewed ${NOMENCLATURE_SNAPSHOT_SOURCE.ipniDirectReviewDate}`
        : `WFO ${NOMENCLATURE_SNAPSHOT_SOURCE.wfoRelease} / DOI ${NOMENCLATURE_SNAPSHOT_SOURCE.wfoDoi}`,
      reviewedAt: REVIEWED_AT,
      notes:
        ipniLsid == null
          ? 'No stable catalog-name IPNI LSID was promoted from the reviewed sources.'
          : undefined,
    };
  });
}

function buildPreferredAcceptedNameRecords(): PlantNameRecord[] {
  return Object.entries(PREFERRED_ACCEPTED_NAME_NOMENCLATURE).map(
    ([localId, name]) => {
      const taxon = CURRENT_CATALOG_TAXA.find(
        (entry) => localTaxonToken(entry.id) === localId,
      );
      if (!taxon) {
        throw new Error(
          `Missing canonical taxon for preferred-name record ${localId}`,
        );
      }

      return {
        id: makeCanonicalId('plant_name', `accepted-${localId}`),
        value: name.value,
        type: 'scientific',
        role: 'preferred_accepted',
        rank: name.rank,
        taxonConceptIds: [taxon.id],
        nomenclaturalIds: {
          ipniLsid: name.ipniLsid,
          wfoNameUsageId: name.wfoNameUsageId,
        },
        sourceRefIds: [WFO_SOURCE_ID, WCVP_SOURCE_ID],
        sourceVersion:
          `WFO ${NOMENCLATURE_SNAPSHOT_SOURCE.wfoRelease} + Kew Names and Taxonomic Backbone 2026`,
        reviewedAt: REVIEWED_AT,
      } satisfies PlantNameRecord;
    },
  );
}

export const CURRENT_CATALOG_PLANT_NAMES: PlantNameRecord[] = [
  ...buildCatalogNameRecords(),
  ...buildPreferredAcceptedNameRecords(),
];

const NAME_BY_ID = new Map(
  CURRENT_CATALOG_PLANT_NAMES.map((record) => [record.id, record]),
);

export function getCurrentCatalogPlantName(
  id: PlantNameRecord['id'],
): PlantNameRecord | undefined {
  return NAME_BY_ID.get(id);
}

export function getPlantNamesForTaxon(
  taxonId: (typeof CURRENT_CATALOG_TAXA)[number]['id'],
): PlantNameRecord[] {
  return CURRENT_CATALOG_PLANT_NAMES.filter((record) =>
    record.taxonConceptIds.includes(taxonId),
  );
}
