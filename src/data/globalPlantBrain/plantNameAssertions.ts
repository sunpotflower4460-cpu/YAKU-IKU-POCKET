/**
 * Versioned nomenclatural assertions for the current Plant Name Graph.
 */

import {
  KnowledgeAssertion,
  KnowledgeSnapshot,
  makeCanonicalId,
} from '../../types/globalPlantBrain';
import {
  CATALOG_NAME_NOMENCLATURE_COVERAGE,
  NOMENCLATURE_SNAPSHOT_SOURCE,
} from './plantNameNomenclatureSnapshot';
import { CURRENT_CATALOG_PLANT_NAMES } from './plantNameRegistry';

const ASSERTED_AT = '2026-10-07T00:30:00.000Z';

export const CURRENT_CATALOG_NOMENCLATURE_ASSERTIONS: KnowledgeAssertion[] =
  CURRENT_CATALOG_PLANT_NAMES.map((name) => ({
    id: makeCanonicalId(
      'assertion',
      `nomenclature-${name.id.replace('yaku:plant-name:', '')}-2026-10-07`,
    ),
    subjectType: 'plant_name',
    subjectId: name.id,
    predicate: 'nomenclatural_identity',
    object: {
      value: name.value,
      type: name.type,
      role: name.role ?? null,
      rank: name.rank ?? null,
      taxonConceptIds: name.taxonConceptIds,
      ipniLsid: name.nomenclaturalIds.ipniLsid ?? null,
      wfoNameUsageId: name.nomenclaturalIds.wfoNameUsageId ?? null,
    },
    sourceRefIds: name.sourceRefIds,
    sourceVersion: name.sourceVersion,
    assertedAt: ASSERTED_AT,
    status: 'active',
  }));

export const CURRENT_CATALOG_NOMENCLATURE_SNAPSHOT: KnowledgeSnapshot = {
  id: makeCanonicalId('snapshot', 'nomenclature-current-catalog-2026-10-07'),
  createdAt: ASSERTED_AT,
  taxonomyVersions: {
    worldFloraOnline:
      `${NOMENCLATURE_SNAPSHOT_SOURCE.wfoRelease} / DOI ${NOMENCLATURE_SNAPSHOT_SOURCE.wfoDoi}`,
    kewNamesTaxonomicBackbone: '2026',
  },
  sourceVersions: {
    worldFloraOnline:
      `backbone ${NOMENCLATURE_SNAPSHOT_SOURCE.wfoBackboneMd5} / IPNI map ${NOMENCLATURE_SNAPSHOT_SOURCE.wfoIpniMapMd5}`,
    ipni: `direct verification through ${NOMENCLATURE_SNAPSHOT_SOURCE.ipniDirectReviewDate}`,
  },
  policyVersion: 'gpb-g1-nomenclature-v1',
  notes:
    `156 plant-name records: ${CATALOG_NAME_NOMENCLATURE_COVERAGE.catalogNames} catalog scientific names + ${CATALOG_NAME_NOMENCLATURE_COVERAGE.preferredAcceptedNames} reviewed preferred accepted names. Two catalog synonym names intentionally have no promoted stable IPNI LSID.`,
};
