/**
 * Initial Global Plant Brain Source Registry.
 *
 * This is intentionally conservative. A source appearing here does NOT mean
 * YAKU may ingest, redistribute, embed or train on it. Unless rights have been
 * explicitly resolved, the linked policy is unknown/fail-closed and the
 * registry status remains needs_review/reference_only/restricted.
 *
 * The human-readable rationale lives in:
 * docs/global-plant-brain/06_SOURCE_CATALOG.md
 */

import {
  createUnknownRightsPolicy,
  evaluateRights,
  makeCanonicalId,
  RightsDecision,
  RightsPolicy,
  RightsUse,
  SourceRegistryEntry,
} from '../../types/globalPlantBrain';

const REVIEWED_AT = '2026-10-06';

function sourceId(localId: string) {
  return makeCanonicalId('source', localId);
}

function rightsId(localId: string) {
  return makeCanonicalId('rights_policy', `${localId}-rights`);
}

const SOURCE_SEEDS: Array<
  Omit<SourceRegistryEntry, 'id' | 'rightsPolicyId' | 'lastTermsReviewAt'> & {
    localId: string;
  }
> = [
  {
    localId: 'catalogue-of-life',
    name: 'Catalogue of Life',
    purpose: ['taxonomy', 'nomenclature'],
    accessMethod: 'mixed',
    homepageUrl: 'https://www.catalogueoflife.org/',
    apiBaseUrl: 'https://api.gbif.org/v2/species/match',
    updateCadence: 'versioned releases; pin dataset/version for each resolution',
    status: 'approved_core',
    notes:
      'COL content is CC BY 4.0 unless otherwise indicated. YAKU pins the release used for each resolution; AI-specific uses remain conditional in policy.',
  },
  {
    localId: 'world-flora-online',
    name: 'World Flora Online Taxonomic Backbone',
    purpose: ['taxonomy', 'nomenclature'],
    accessMethod: 'bulk',
    homepageUrl: 'https://www.worldfloraonline.org/downloadData',
    updateCadence: 'versioned static backbone releases',
    status: 'approved_core',
    notes:
      'Approval is limited to the CC0 Taxonomic Backbone download. WFO page text, images and contributed content may have different rights and are not covered by this entry.',
  },
  {
    localId: 'kew-powo-wcvp',
    name: 'Kew Plants of the World Online / WCVP',
    purpose: ['taxonomy', 'nomenclature', 'distribution'],
    accessMethod: 'database',
    homepageUrl: 'https://powo.science.kew.org/',
    status: 'needs_review',
  },
  {
    localId: 'ipni',
    name: 'International Plant Names Index',
    purpose: ['nomenclature', 'taxonomy'],
    accessMethod: 'database',
    homepageUrl: 'https://www.ipni.org/',
    status: 'needs_review',
  },
  {
    localId: 'gbif',
    name: 'GBIF',
    purpose: ['taxonomy', 'distribution', 'ecology'],
    accessMethod: 'mixed',
    homepageUrl: 'https://www.gbif.org/',
    apiBaseUrl: 'https://api.gbif.org/v1/',
    status: 'needs_review',
    notes: 'Record/dataset-level licenses must be retained; aggregator status is not enough.',
  },
  {
    localId: 'plantnet',
    name: 'Pl@ntNet',
    purpose: ['taxonomy', 'morphology'],
    accessMethod: 'api',
    homepageUrl: 'https://plantnet.org/',
    status: 'needs_review',
  },
  {
    localId: 'inaturalist',
    name: 'iNaturalist',
    purpose: ['taxonomy', 'distribution', 'ecology', 'morphology'],
    accessMethod: 'api',
    homepageUrl: 'https://www.inaturalist.org/',
    status: 'needs_review',
    notes: 'Observation and media licenses must be filtered per record.',
  },
  {
    localId: 'kew-mpns',
    name: 'Kew Medicinal Plant Names Services',
    purpose: ['taxonomy', 'nomenclature', 'traditional_use', 'quality'],
    accessMethod: 'database',
    homepageUrl: 'https://www.kew.org/science/our-science/science-services/medicinal-plant-names-services',
    status: 'needs_review',
  },
  {
    localId: 'japanese-pharmacopoeia',
    name: 'Japanese Pharmacopoeia',
    purpose: ['quality', 'regulation'],
    accessMethod: 'document',
    homepageUrl: 'https://www.mhlw.go.jp/',
    status: 'reference_only',
  },
  {
    localId: 'ema-hmpc',
    name: 'EMA HMPC herbal medicines',
    purpose: ['regulation', 'traditional_use', 'clinical', 'toxicity'],
    accessMethod: 'document',
    homepageUrl: 'https://www.ema.europa.eu/',
    status: 'reference_only',
  },
  {
    localId: 'pubmed',
    name: 'PubMed',
    purpose: ['clinical', 'chemistry', 'mechanism', 'toxicity'],
    accessMethod: 'api',
    homepageUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    status: 'reference_only',
  },
  {
    localId: 'clinicaltrials-gov',
    name: 'ClinicalTrials.gov',
    purpose: ['clinical'],
    accessMethod: 'api',
    homepageUrl: 'https://clinicaltrials.gov/',
    status: 'needs_review',
  },
  {
    localId: 'chebi',
    name: 'ChEBI',
    purpose: ['chemistry'],
    accessMethod: 'database',
    homepageUrl: 'https://www.ebi.ac.uk/chebi/',
    status: 'needs_review',
  },
  {
    localId: 'uniprot',
    name: 'UniProt',
    purpose: ['mechanism', 'chemistry'],
    accessMethod: 'mixed',
    homepageUrl: 'https://www.uniprot.org/',
    status: 'needs_review',
  },
  {
    localId: 'reactome',
    name: 'Reactome',
    purpose: ['mechanism'],
    accessMethod: 'mixed',
    homepageUrl: 'https://reactome.org/',
    status: 'needs_review',
  },
  {
    localId: 'mhlw-toxic-plants',
    name: 'MHLW toxic plant / food poisoning resources',
    purpose: ['toxicity', 'lookalike', 'incident', 'regulation'],
    accessMethod: 'document',
    homepageUrl: 'https://www.mhlw.go.jp/',
    status: 'reference_only',
  },
  {
    localId: 'crossref',
    name: 'Crossref',
    purpose: ['clinical', 'other'],
    accessMethod: 'api',
    homepageUrl: 'https://www.crossref.org/',
    status: 'needs_review',
    notes: 'Used for publication metadata and correction/retraction relationships.',
  },
  {
    localId: 'local-contexts',
    name: 'Local Contexts',
    purpose: ['traditional_use', 'other'],
    accessMethod: 'community',
    homepageUrl: 'https://localcontexts.org/',
    status: 'reference_only',
    notes: 'Governance/labels context; does not grant rights to underlying knowledge.',
  },
  {
    localId: 'tkdl',
    name: 'Traditional Knowledge Digital Library',
    purpose: ['traditional_use'],
    accessMethod: 'database',
    homepageUrl: 'https://www.tkdl.res.in/',
    status: 'restricted',
    notes: 'No general-purpose ingestion or RAG without formal authorization.',
  },
];

export const SOURCE_REGISTRY: SourceRegistryEntry[] = SOURCE_SEEDS.map((seed) => {
  const { localId, ...entry } = seed;
  return {
    ...entry,
    id: sourceId(localId),
    rightsPolicyId: rightsId(localId),
    lastTermsReviewAt: REVIEWED_AT,
  };
});

const REVIEWED_RIGHTS: Partial<Record<string, Omit<RightsPolicy, 'id'>>> = {
  'catalogue-of-life': {
    licenseType: 'CC BY 4.0',
    commercialUse: 'allowed',
    localStorage: 'allowed',
    redistribution: 'allowed',
    derivativeDatabase: 'allowed',
    attributionRequired: true,
    shareAlike: false,
    aiRag: 'conditional',
    aiEmbedding: 'conditional',
    aiTraining: 'conditional',
    aiEvaluation: 'conditional',
    checkedAt: REVIEWED_AT,
    notes:
      'Applies to COL content offered under CC BY 4.0. Preserve attribution and source/release metadata. AI-specific uses remain separately reviewable.',
  },
  'world-flora-online': {
    licenseType: 'CC0 1.0 (Taxonomic Backbone only)',
    commercialUse: 'allowed',
    localStorage: 'allowed',
    redistribution: 'allowed',
    derivativeDatabase: 'allowed',
    attributionRequired: false,
    shareAlike: false,
    aiRag: 'allowed',
    aiEmbedding: 'allowed',
    aiTraining: 'allowed',
    aiEvaluation: 'allowed',
    checkedAt: REVIEWED_AT,
    notes:
      'Only the WFO Taxonomic Backbone static download is covered. Other WFO content requires its own record/content-level rights decision.',
  },
};

export const SOURCE_RIGHTS_POLICIES: RightsPolicy[] = SOURCE_SEEDS.map((seed) => {
  const reviewed = REVIEWED_RIGHTS[seed.localId];
  if (reviewed) {
    return {
      id: rightsId(seed.localId),
      ...reviewed,
    };
  }

  return createUnknownRightsPolicy(
    rightsId(seed.localId),
    REVIEWED_AT,
    `Fail-closed placeholder for ${seed.name}; resolve source/content-specific terms before production use.`,
  );
});

const SOURCE_BY_ID = new Map(SOURCE_REGISTRY.map((entry) => [entry.id, entry]));
const RIGHTS_BY_ID = new Map(
  SOURCE_RIGHTS_POLICIES.map((policy) => [policy.id, policy]),
);

export function getSourceRegistryEntry(
  id: SourceRegistryEntry['id'],
): SourceRegistryEntry | undefined {
  return SOURCE_BY_ID.get(id);
}

export function getRightsPolicyForSource(
  id: SourceRegistryEntry['id'],
): RightsPolicy | undefined {
  const source = SOURCE_BY_ID.get(id);
  if (!source) return undefined;
  return RIGHTS_BY_ID.get(source.rightsPolicyId);
}

export function evaluateSourceUse(
  id: SourceRegistryEntry['id'],
  use: RightsUse,
): RightsDecision {
  const policy = getRightsPolicyForSource(id);
  if (!policy) return 'deny';
  return evaluateRights(policy, use);
}
