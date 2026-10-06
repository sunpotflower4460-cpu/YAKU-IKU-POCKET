/**
 * Versioned taxonomy assertions for the current YAKU catalog (G1).
 *
 * This is the first step away from mutable seed-only taxonomy. The catalog
 * projection remains convenient for product code, while these assertions
 * preserve what the reviewed sources said at a specific point in time.
 */

import {
  KnowledgeAssertion,
  KnowledgeSnapshot,
  JsonValue,
  TaxonAuthorityReference,
  TaxonConceptSeed,
  YakuSourceId,
  makeCanonicalId,
} from '../../types/globalPlantBrain';
import { CURRENT_CATALOG_TAXA } from './taxonSeedRegistry';

const ASSERTED_AT = '2026-10-06T13:13:11.000Z';

const COL_SOURCE_ID = makeCanonicalId('source', 'catalogue-of-life');
const WCVP_SOURCE_ID = makeCanonicalId('source', 'kew-powo-wcvp');
const WFO_SOURCE_ID = makeCanonicalId('source', 'world-flora-online');

function localTaxonToken(taxon: TaxonConceptSeed): string {
  return taxon.id.replace('yaku:taxon:', '');
}

function authoritySourceIds(
  refs: TaxonAuthorityReference[] | undefined,
): YakuSourceId[] {
  const ids = new Set<YakuSourceId>();

  for (const ref of refs ?? []) {
    switch (ref.provider) {
      case 'catalogue_of_life':
        ids.add(COL_SOURCE_ID);
        break;
      case 'wcvp':
        ids.add(WCVP_SOURCE_ID);
        break;
      case 'world_flora_online':
        ids.add(WFO_SOURCE_ID);
        break;
      case 'ipni':
        ids.add(makeCanonicalId('source', 'ipni'));
        break;
    }
  }

  return [...ids];
}

function buildResolutionAssertion(taxon: TaxonConceptSeed): KnowledgeAssertion {
  const sourceRefIds =
    taxon.authorityReferences?.length
      ? authoritySourceIds(taxon.authorityReferences)
      : [COL_SOURCE_ID];

  let object: JsonValue;

  if (taxon.resolutionStatus === 'conflicted') {
    object = {
      state: 'conflicted',
      catalogScientificName: taxon.scientificName,
      catalogRank: taxon.rank,
      authorityViews: (taxon.authorityReferences ?? []).map((ref) => ({
        provider: ref.provider,
        matchedScientificName: ref.matchedScientificName ?? null,
        matchedStatus: ref.matchedStatus ?? null,
        acceptedScientificName: ref.acceptedScientificName ?? null,
        acceptedRank: ref.acceptedRank ?? null,
        relation: ref.relation,
      })),
    };
  } else {
    object = {
      state: taxon.resolutionStatus,
      catalogScientificName: taxon.scientificName,
      catalogRank: taxon.rank,
      preferredScientificName: taxon.preferredScientificName ?? null,
      preferredRank: taxon.preferredRank ?? null,
      colAcceptedUsageId: taxon.externalIds.col ?? null,
    };
  }

  return {
    id: makeCanonicalId(
      'assertion',
      `taxonomy-resolution-${localTaxonToken(taxon)}-2026-10-06`,
    ),
    subjectType: 'taxon',
    subjectId: taxon.id,
    predicate: 'taxonomy_resolution',
    object,
    sourceRefIds,
    sourceVersion: 'COL 2026-09-25 XR / reviewed 2026-10-06',
    assertedAt: ASSERTED_AT,
    status: 'active',
  };
}

function buildSynonymRelationAssertion(
  taxon: TaxonConceptSeed,
): KnowledgeAssertion | undefined {
  if (
    taxon.resolutionStatus !== 'externally_reconciled' ||
    !taxon.preferredScientificName ||
    !taxon.preferredRank
  ) {
    return undefined;
  }

  return {
    id: makeCanonicalId(
      'assertion',
      `taxonomy-synonym-${localTaxonToken(taxon)}-2026-10-06`,
    ),
    subjectType: 'taxon',
    subjectId: taxon.id,
    predicate: 'catalog_scientific_name_relation',
    object: {
      fromScientificName: taxon.scientificName,
      relation: 'synonym_of',
      toScientificName: taxon.preferredScientificName,
      toRank: taxon.preferredRank,
      acceptedColUsageId: taxon.externalIds.col ?? null,
    },
    sourceRefIds: authoritySourceIds(taxon.authorityReferences),
    sourceVersion: 'cross-source review 2026-10-06',
    assertedAt: ASSERTED_AT,
    status: 'active',
  };
}

function buildConflictAuthorityAssertions(
  taxon: TaxonConceptSeed,
): KnowledgeAssertion[] {
  if (taxon.resolutionStatus !== 'conflicted') return [];

  return (taxon.authorityReferences ?? []).map((ref, index) => ({
    id: makeCanonicalId(
      'assertion',
      `taxonomy-authority-${localTaxonToken(taxon)}-${index + 1}-2026-10-06`,
    ),
    subjectType: 'taxon',
    subjectId: taxon.id,
    predicate: 'taxonomy_authority_view',
    object: {
      provider: ref.provider,
      queriedScientificName: ref.queriedScientificName,
      matchedScientificName: ref.matchedScientificName ?? null,
      matchedStatus: ref.matchedStatus ?? null,
      acceptedScientificName: ref.acceptedScientificName ?? null,
      acceptedRank: ref.acceptedRank ?? null,
      relation: ref.relation,
      notes: ref.notes ?? null,
    },
    sourceRefIds: authoritySourceIds([ref]),
    sourceVersion: ref.sourceRelease ?? 'reviewed 2026-10-06',
    assertedAt: ASSERTED_AT,
    status: 'active',
  }));
}

export function buildCurrentCatalogTaxonomyAssertions(): KnowledgeAssertion[] {
  const assertions: KnowledgeAssertion[] = [];

  for (const taxon of CURRENT_CATALOG_TAXA) {
    assertions.push(buildResolutionAssertion(taxon));

    const synonym = buildSynonymRelationAssertion(taxon);
    if (synonym) assertions.push(synonym);

    assertions.push(...buildConflictAuthorityAssertions(taxon));
  }

  return assertions;
}

export const CURRENT_CATALOG_TAXONOMY_ASSERTIONS =
  buildCurrentCatalogTaxonomyAssertions();

export const CURRENT_CATALOG_TAXONOMY_SNAPSHOT: KnowledgeSnapshot = {
  id: makeCanonicalId('snapshot', 'taxonomy-current-catalog-2026-10-06'),
  createdAt: ASSERTED_AT,
  taxonomyVersions: {
    catalogueOfLife: '2026-09-25 XR / ChecklistBank 316441',
    kewNamesTaxonomicBackbone: '2026',
    worldFloraOnline: '2026',
  },
  sourceVersions: {
    catalogueOfLife: 'DOI 10.48580/dgz9s',
    currentCatalogCrossSourceReview: '2026-10-06',
  },
  policyVersion: 'gpb-g1-taxonomy-resolution-v1',
  notes:
    '149 canonical taxa: 140 exact external resolutions, 8 reconciled synonym concepts, 1 explicit authority conflict.',
};
