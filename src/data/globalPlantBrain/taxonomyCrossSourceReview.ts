/**
 * Cross-source taxonomy review for the current catalog.
 *
 * The catalog scientific name is never overwritten. Seven synonym cases are
 * reconciled where COL + current Kew/WCVP align. Five taxa retain explicit
 * authority conflicts after adding the pinned WFO 2026-06 snapshot:
 * Taraxacum officinale, Calystegia japonica, Eupatorium japonicum,
 * Citrus junos and Hyssopus officinalis.
 */

import {
  TaxonAuthorityReference,
  TaxonRank,
  YakuTaxonConceptId,
  makeCanonicalId,
} from '../../types/globalPlantBrain';

export interface ReconciledTaxonReview {
  taxonId: YakuTaxonConceptId;
  catalogScientificName: string;
  preferredScientificName: string;
  preferredRank: TaxonRank;
  acceptedColId: string;
  references: TaxonAuthorityReference[];
}

export interface ConflictedTaxonReview {
  taxonId: YakuTaxonConceptId;
  catalogScientificName: string;
  acceptedColId?: string;
  references: TaxonAuthorityReference[];
  conflictSummary: string;
}

const checkedAt = '2026-10-06';

function taxon(id: string): YakuTaxonConceptId {
  return makeCanonicalId('taxon', id);
}

export const RECONCILED_TAXON_REVIEWS: readonly ReconciledTaxonReview[] = [
  {
    taxonId: taxon('p006'),
    catalogScientificName: 'Pueraria lobata',
    preferredScientificName: 'Pueraria montana var. lobata',
    preferredRank: 'variety',
    acceptedColId: 'CGCLG',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Pueraria lobata',
        matchedUsageId: '4QFVR',
        matchedScientificName: 'Pueraria lobata (Willd.) Ohwi',
        matchedStatus: 'synonym',
        acceptedUsageId: 'CGCLG',
        acceptedScientificName: 'Pueraria montana var. lobata',
        acceptedRank: 'variety',
        relation: 'synonym_of',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Pueraria lobata',
        matchedScientificName: 'Pueraria lobata (Willd.) Ohwi',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Pueraria montana var. lobata',
        acceptedRank: 'variety',
        relation: 'synonym_of',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:214449-2',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('p042'),
    catalogScientificName: 'Veratrum album subsp. oxysepalum',
    preferredScientificName: 'Veratrum oxysepalum',
    preferredRank: 'species',
    acceptedColId: '7FNJV',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Veratrum album subsp. oxysepalum',
        matchedUsageId: '5LQPG',
        matchedStatus: 'synonym',
        acceptedUsageId: '7FNJV',
        acceptedScientificName: 'Veratrum oxysepalum',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Veratrum album subsp. oxysepalum',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Veratrum oxysepalum',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceUrl: 'https://powo.science.kew.org/taxon/262863-2',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('p046'),
    catalogScientificName: 'Elatostema umbellatum var. majus',
    preferredScientificName: 'Elatostema involucratum',
    preferredRank: 'species',
    acceptedColId: '6F363',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Elatostema umbellatum var. majus',
        matchedUsageId: '5NPQZ',
        matchedStatus: 'synonym',
        acceptedUsageId: '6F363',
        acceptedScientificName: 'Elatostema involucratum',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Elatostema umbellatum var. majus',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Elatostema involucratum',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:851938-1',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('p047'),
    catalogScientificName: 'Glechoma hederacea var. grandis',
    preferredScientificName: 'Glechoma grandis',
    preferredRank: 'species',
    acceptedColId: '3G6WD',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Glechoma hederacea var. grandis',
        matchedUsageId: '5P5ZD',
        matchedStatus: 'synonym',
        acceptedUsageId: '3G6WD',
        acceptedScientificName: 'Glechoma grandis',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Glechoma hederacea var. grandis',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Glechoma grandis',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:447336-1',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('p068'),
    catalogScientificName: 'Lapsana apogonoides',
    preferredScientificName: 'Lapsanastrum apogonoides',
    preferredRank: 'species',
    acceptedColId: '3S9Y6',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Lapsana apogonoides',
        matchedUsageId: '3S9WQ',
        matchedStatus: 'synonym',
        acceptedUsageId: '3S9Y6',
        acceptedScientificName: 'Lapsanastrum apogonoides',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Lapsana apogonoides',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Lapsanastrum apogonoides',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:981300-1',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('p077'),
    catalogScientificName: 'Dianthus superbus var. longicalycinus',
    preferredScientificName: 'Dianthus longicalyx',
    preferredRank: 'species',
    acceptedColId: '6CPSD',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Dianthus superbus var. longicalycinus',
        matchedUsageId: '5NJHR',
        matchedStatus: 'synonym',
        acceptedUsageId: '6CPSD',
        acceptedScientificName: 'Dianthus longicalyx',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Dianthus superbus var. longicalycinus',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Dianthus longicalyx',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77327592-1',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('h070'),
    catalogScientificName: 'Hibiscus sabdariffa',
    preferredScientificName: 'Sabdariffa gossypiifolia',
    preferredRank: 'species',
    acceptedColId: 'KZJLJ',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Hibiscus sabdariffa',
        matchedUsageId: '3LK87',
        matchedStatus: 'synonym',
        acceptedUsageId: 'KZJLJ',
        acceptedScientificName: 'Sabdariffa gossypiifolia',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Hibiscus sabdariffa',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Sabdariffa gossypiifolia',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:326388-2',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
      {
        provider: 'world_flora_online',
        queriedScientificName: 'Hibiscus sabdariffa',
        matchedUsageId: 'wfo-0000723020',
        matchedScientificName: 'Hibiscus sabdariffa L.',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Sabdariffa gossypiifolia',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceUrl:
          'https://www.worldfloraonline.org/search?query=Hibiscus+sabdariffa',
        sourceRelease: 'WFO 2026',
        checkedAt,
      },
    ],
  },
];

export const CONFLICTED_TAXON_REVIEWS: readonly ConflictedTaxonReview[] = [
  {
    taxonId: taxon('p001'),
    catalogScientificName: 'Taraxacum officinale',
    acceptedColId: '54VX8',
    conflictSummary:
      'Catalogue of Life accepts Taraxacum officinale at species rank, the pinned WFO 2026-06 usage is Unchecked, and current Kew/POWO treats the name as a synonym of Taraxacum sect. Taraxacum. Keep the product name and do not force one taxonomic rank.',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Taraxacum officinale',
        matchedUsageId: '54VX8',
        matchedScientificName: 'Taraxacum officinale',
        matchedStatus: 'accepted',
        acceptedUsageId: '54VX8',
        acceptedScientificName: 'Taraxacum officinale',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'world_flora_online',
        queriedScientificName: 'Taraxacum officinale',
        matchedUsageId: 'wfo-0000062154',
        matchedScientificName: 'Taraxacum officinale F.H.Wigg.',
        matchedStatus: 'unchecked',
        relation: 'conflict',
        sourceRelease: 'WFO Plant List 2026-06 / 10.5281/zenodo.20782718',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Taraxacum officinale',
        matchedScientificName: 'Taraxacum officinale F.H.Wigg.',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Taraxacum sect. Taraxacum',
        acceptedRank: 'section',
        relation: 'conflict',
        sourceUrl: 'https://powo.science.kew.org/taxon/1003018-2',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('p060'),
    catalogScientificName: 'Calystegia japonica',
    acceptedColId: '5ZXL6',
    conflictSummary:
      'COL and current Kew/POWO resolve Calystegia japonica toward Convolvulus japonicus, while the pinned WFO 2026-06 backbone resolves the matched usage to Calystegia pubescens. Keep all views until the source-version disagreement is reconciled.',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Calystegia japonica',
        matchedUsageId: 'Q7ZV',
        matchedStatus: 'synonym',
        acceptedUsageId: '5ZXL6',
        acceptedScientificName: 'Convolvulus japonicus',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Calystegia japonica',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Convolvulus japonicus',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceUrl: 'https://powo.science.kew.org/taxon/77237487-1',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
      {
        provider: 'world_flora_online',
        queriedScientificName: 'Calystegia japonica',
        matchedUsageId: 'wfo-0001298470',
        matchedScientificName: 'Calystegia japonica Choisy',
        matchedStatus: 'synonym',
        acceptedUsageId: 'wfo-0001297178',
        acceptedScientificName: 'Calystegia pubescens',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceRelease: 'WFO Plant List 2026-06 / 10.5281/zenodo.20782718',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('p079'),
    catalogScientificName: 'Eupatorium japonicum',
    acceptedColId: '6H9YH',
    conflictSummary:
      'Catalogue of Life and current Kew/POWO accept Eupatorium japonicum, while the pinned WFO 2026-06 backbone treats it as a synonym of Eupatorium chinense. Preserve the disagreement instead of changing the catalog identity.',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Eupatorium japonicum',
        matchedUsageId: '6H9YH',
        matchedScientificName: 'Eupatorium japonicum',
        matchedStatus: 'accepted',
        acceptedUsageId: '6H9YH',
        acceptedScientificName: 'Eupatorium japonicum',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Eupatorium japonicum',
        matchedScientificName: 'Eupatorium japonicum Thunb.',
        matchedStatus: 'accepted',
        acceptedScientificName: 'Eupatorium japonicum',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:206166-1',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
      {
        provider: 'world_flora_online',
        queriedScientificName: 'Eupatorium japonicum',
        matchedUsageId: 'wfo-0000005061',
        matchedScientificName: 'Eupatorium japonicum Thunb.',
        matchedStatus: 'synonym',
        acceptedUsageId: 'wfo-0000135891',
        acceptedScientificName: 'Eupatorium chinense',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceRelease: 'WFO Plant List 2026-06 / 10.5281/zenodo.20782718',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('h043'),
    catalogScientificName: 'Citrus junos',
    acceptedColId: 'VMNQ',
    conflictSummary:
      'Catalogue of Life resolves the catalog name as a species concept, the WFO 2026-06 backbone contains two unchecked usages, and current Kew/POWO treats Citrus × junos as an artificial hybrid. Preserve the catalog name but do not auto-promote a WFO concept or force a rank change.',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Citrus junos',
        matchedUsageId: 'VMNQ',
        matchedScientificName: 'Citrus junos',
        matchedStatus: 'accepted',
        acceptedUsageId: 'VMNQ',
        acceptedScientificName: 'Citrus junos',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'world_flora_online',
        queriedScientificName: 'Citrus junos',
        matchedScientificName: 'Citrus junos',
        matchedStatus: 'ambiguous_unchecked',
        relation: 'conflict',
        sourceRelease: 'WFO Plant List 2026-06 / 10.5281/zenodo.20782718',
        checkedAt,
        notes:
          'Two unchecked WFO usages were returned: wfo-0000608084 and wfo-0001230845. Both point to IPNI 771942-1.',
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Citrus junos',
        matchedScientificName: 'Citrus × junos Siebold ex Tanaka',
        matchedStatus: 'artificial_hybrid',
        acceptedScientificName: 'Citrus × junos',
        acceptedRank: 'hybrid',
        relation: 'conflict',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:771942-1',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
    ],
  },
  {
    taxonId: taxon('h047'),
    catalogScientificName: 'Hyssopus officinalis',
    acceptedColId: 'CD7P2',
    conflictSummary:
      'COL resolves the name to the nominotypical Dracocephalum subspecies and current Kew/POWO to Dracocephalum officinale at species rank, while the pinned WFO 2026-06 backbone explicitly accepts Hyssopus officinalis. Do not select one accepted concept automatically.',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Hyssopus officinalis',
        matchedUsageId: '6MT5F',
        matchedScientificName: 'Hyssopus officinalis L.',
        matchedStatus: 'synonym',
        acceptedUsageId: 'CD7P2',
        acceptedScientificName: 'Dracocephalum officinale subsp. officinale',
        acceptedRank: 'subspecies',
        relation: 'conflict',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Hyssopus officinalis',
        matchedScientificName: 'Hyssopus officinalis L.',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Dracocephalum officinale',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceUrl:
          'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:127231-2',
        sourceRelease: 'Kew Names and Taxonomic Backbone 2026',
        checkedAt,
      },
      {
        provider: 'world_flora_online',
        queriedScientificName: 'Hyssopus officinalis',
        matchedUsageId: 'wfo-0000217205',
        matchedScientificName: 'Hyssopus officinalis L.',
        matchedStatus: 'accepted',
        acceptedUsageId: 'wfo-0000217205',
        acceptedScientificName: 'Hyssopus officinalis',
        acceptedRank: 'species',
        relation: 'conflict',
        sourceRelease: 'WFO Plant List 2026-06 / 10.5281/zenodo.20782718',
        checkedAt,
        notes:
          'The pinned WFO 2026-06 backbone explicitly marks Hyssopus officinalis as Accepted, while current Kew/POWO treats the name as a synonym of Dracocephalum officinale.',
      },
    ],
  },
];

export const RECONCILED_TAXON_BY_ID = new Map(
  RECONCILED_TAXON_REVIEWS.map((entry) => [entry.taxonId, entry]),
);

export const CONFLICTED_TAXON_BY_ID = new Map(
  CONFLICTED_TAXON_REVIEWS.map((entry) => [entry.taxonId, entry]),
);
