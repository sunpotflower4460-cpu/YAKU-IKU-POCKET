/**
 * Cross-source review of the nine COL synonym cases remaining after the
 * rank-corrected 2026-10-06 resolution run.
 *
 * The catalog scientific name is never overwritten here. Eight cases are
 * reconciled to an accepted target after COL + Kew/WCVP agree on the direction
 * of the synonym relationship. Hyssopus officinalis remains an explicit
 * conflict because the authorities do not expose the same accepted rank/view.
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
    taxonId: taxon('p060'),
    catalogScientificName: 'Calystegia japonica',
    preferredScientificName: 'Convolvulus japonicus',
    preferredRank: 'species',
    acceptedColId: '5ZXL6',
    references: [
      {
        provider: 'catalogue_of_life',
        queriedScientificName: 'Calystegia japonica',
        matchedUsageId: 'Q7ZV',
        matchedStatus: 'synonym',
        acceptedUsageId: '5ZXL6',
        acceptedScientificName: 'Convolvulus japonicus',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceRelease: '2026-09-25 XR',
        checkedAt,
      },
      {
        provider: 'wcvp',
        queriedScientificName: 'Calystegia japonica',
        matchedStatus: 'synonym',
        acceptedScientificName: 'Convolvulus japonicus',
        acceptedRank: 'species',
        relation: 'synonym_of',
        sourceUrl: 'https://powo.science.kew.org/taxon/77237487-1',
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
    taxonId: taxon('h047'),
    catalogScientificName: 'Hyssopus officinalis',
    conflictSummary:
      'COL resolves the name to the nominotypical subspecies, Kew/WCVP to Dracocephalum officinale at species rank, while the current WFO page still presents a Hyssopus classification. Do not select one accepted concept automatically.',
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
        relation: 'alternative_taxonomy',
        sourceUrl:
          'https://www.worldfloraonline.org/taxon/wfo-0000217205',
        sourceRelease: 'WFO 2026',
        checkedAt,
        notes:
          'The fetched WFO page presents Hyssopus officinalis within a Hyssopus classification; the page extract did not expose an explicit accepted/synonym status, so it is retained only as an alternate view.',
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
