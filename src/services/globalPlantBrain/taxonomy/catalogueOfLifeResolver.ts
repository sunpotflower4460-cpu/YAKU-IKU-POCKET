/**
 * Catalogue of Life XR name resolver (G1).
 *
 * Transport is dependency-injected so mobile product code does not silently
 * start making taxonomy network calls. A backend/CLI can provide HTTP access
 * and persist the result with source-version provenance.
 *
 * Current pinned release at implementation time:
 * COL 2026-09-25 Extended Release (ChecklistBank 316441).
 */

import {
  TaxonomicStatus,
  TaxonomyMatchCandidate,
  TaxonomyMatchType,
  TaxonomyResolutionQuery,
  TaxonomySourceVersion,
} from '../../../types/globalPlantBrain';

export const COL_XR_CHECKLIST_KEY =
  '7ddf754f-d193-4cc9-b351-99906754a03b';

export const COL_XR_SOURCE_VERSION: TaxonomySourceVersion = {
  provider: 'catalogue_of_life',
  releaseLabel: '2026-09-25 XR',
  issuedAt: '2026-09-25',
  datasetKey: '316441',
  checklistKey: COL_XR_CHECKLIST_KEY,
  doi: '10.48580/dgz9s',
};

const COL_MATCH_ENDPOINT = 'https://api.gbif.org/v2/species/match';

export type TaxonomyJsonTransport = (url: string) => Promise<unknown>;

interface ColUsage {
  key?: unknown;
  name?: unknown;
  canonicalName?: unknown;
  rank?: unknown;
  status?: unknown;
}

interface ColClassificationNode {
  key?: unknown;
  name?: unknown;
  rank?: unknown;
}

interface ColMatchResponse {
  usage?: ColUsage;
  acceptedUsage?: ColUsage;
  classification?: ColClassificationNode[];
  diagnostics?: {
    matchType?: unknown;
    confidence?: unknown;
  };
  synonym?: unknown;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function mapStatus(value: unknown): TaxonomicStatus {
  const status = asNonEmptyString(value)?.toUpperCase();
  switch (status) {
    case 'ACCEPTED':
      return 'accepted';
    case 'PROVISIONALLY_ACCEPTED':
    case 'PROVISIONALLY ACCEPTED':
      return 'provisionally_accepted';
    case 'SYNONYM':
      return 'synonym';
    case 'AMBIGUOUS_SYNONYM':
    case 'AMBIGUOUS SYNONYM':
      return 'ambiguous_synonym';
    case 'MISAPPLIED':
      return 'misapplied';
    default:
      return 'unknown';
  }
}

function mapMatchType(value: unknown): TaxonomyMatchType {
  const type = asNonEmptyString(value)?.toUpperCase();
  switch (type) {
    case 'EXACT':
      return 'exact';
    case 'VARIANT':
      return 'variant';
    case 'FUZZY':
      return 'fuzzy';
    case 'NONE':
      return 'none';
    default:
      return type ? 'ambiguous' : 'none';
  }
}

export function buildCatalogueOfLifeMatchUrl(
  query: TaxonomyResolutionQuery,
): string {
  const url = new URL(COL_MATCH_ENDPOINT);
  url.searchParams.set('checklistKey', COL_XR_CHECKLIST_KEY);
  url.searchParams.set('scientificName', query.scientificName);
  url.searchParams.set('taxonRank', query.expectedRank.toUpperCase());
  url.searchParams.set('kingdom', query.kingdom);
  return url.toString();
}

export function parseCatalogueOfLifeMatchResponse(
  query: TaxonomyResolutionQuery,
  raw: unknown,
): TaxonomyMatchCandidate | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const response = raw as ColMatchResponse;
  const usage = response.usage;
  const providerRecordId = asNonEmptyString(usage?.key);
  const scientificName = asNonEmptyString(usage?.name);
  const rank = asNonEmptyString(usage?.rank);

  const matchType = mapMatchType(response.diagnostics?.matchType);
  if (!providerRecordId || !scientificName || !rank || matchType === 'none') {
    return undefined;
  }

  const acceptedId = asNonEmptyString(response.acceptedUsage?.key);
  const acceptedName = asNonEmptyString(response.acceptedUsage?.name);

  return {
    provider: 'catalogue_of_life',
    providerRecordId,
    queriedName: query.scientificName,
    scientificName,
    canonicalName: asNonEmptyString(usage?.canonicalName),
    rank,
    status: mapStatus(usage?.status),
    matchType,
    confidence: asFiniteNumber(response.diagnostics?.confidence),
    acceptedTaxon:
      acceptedId && acceptedName
        ? {
            providerRecordId: acceptedId,
            scientificName: acceptedName,
            canonicalName: asNonEmptyString(response.acceptedUsage?.canonicalName),
            rank: asNonEmptyString(response.acceptedUsage?.rank),
            status: mapStatus(response.acceptedUsage?.status),
          }
        : undefined,
    classification: (response.classification ?? [])
      .map((node) => {
        const id = asNonEmptyString(node.key);
        const name = asNonEmptyString(node.name);
        const nodeRank = asNonEmptyString(node.rank);
        if (!id || !name || !nodeRank) return undefined;
        return {
          providerRecordId: id,
          name,
          rank: nodeRank,
        };
      })
      .filter(
        (
          node,
        ): node is {
          providerRecordId: string;
          name: string;
          rank: string;
        } => Boolean(node),
      ),
    sourceVersion: COL_XR_SOURCE_VERSION,
  };
}

export async function resolveCatalogueOfLifeName(
  query: TaxonomyResolutionQuery,
  transport: TaxonomyJsonTransport,
): Promise<TaxonomyMatchCandidate | undefined> {
  const raw = await transport(buildCatalogueOfLifeMatchUrl(query));
  return parseCatalogueOfLifeMatchResponse(query, raw);
}
