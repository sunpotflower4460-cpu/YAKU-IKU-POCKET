/**
 * SourceRef v2 for the Global Plant Brain (G0).
 *
 * Existing PlantDefinition/PlantUse sourceRefs remain string[] for backwards
 * compatibility. New knowledge-layer records should use SourceRefV2. Migration
 * can therefore happen record by record without changing today's UI.
 */

import {
  YakuRightsPolicyId,
  YakuSourceId,
} from './canonicalIds';

export type SourceScope =
  | 'taxonomy'
  | 'nomenclature'
  | 'morphology'
  | 'distribution'
  | 'ecology'
  | 'phenology'
  | 'toxicity'
  | 'lookalike'
  | 'traditional_use'
  | 'food_use'
  | 'chemistry'
  | 'mechanism'
  | 'clinical'
  | 'incident'
  | 'regulation'
  | 'conservation'
  | 'quality'
  | 'other';

export interface SourceRefV2 {
  id: YakuSourceId;
  title: string;
  publisher?: string;
  url?: string;
  doi?: string;
  sourceRecordId?: string;

  /** A citation only supports the explicit scopes attached here. */
  scope: SourceScope[];

  sourcePublishedAt?: string;
  sourceUpdatedAt?: string;
  retrievedAt: string;
  sourceVersion?: string;

  rightsPolicyId: YakuRightsPolicyId;
}

export interface LegacySourceRefUpgradeMetadata {
  id: YakuSourceId;
  title: string;
  publisher?: string;
  scope: SourceScope[];
  retrievedAt: string;
  rightsPolicyId: YakuRightsPolicyId;
  sourcePublishedAt?: string;
  sourceUpdatedAt?: string;
  sourceVersion?: string;
}

/**
 * Upgrade a legacy URL without inferring unsupported metadata.
 *
 * title/scope/rights/retrieval time are required from the caller so an old
 * bare URL cannot silently become a richer, misleading citation.
 */
export function upgradeLegacySourceRef(
  url: string,
  metadata: LegacySourceRefUpgradeMetadata,
): SourceRefV2 {
  if (!isHttpsUrl(url)) {
    throw new Error('SourceRefV2 URL must use HTTPS.');
  }
  if (!metadata.title.trim()) {
    throw new Error('SourceRefV2 title is required.');
  }
  if (metadata.scope.length === 0) {
    throw new Error('SourceRefV2 must declare at least one evidence scope.');
  }

  return {
    ...metadata,
    title: metadata.title.trim(),
    url,
  };
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateSourceRefV2(source: SourceRefV2): string[] {
  const issues: string[] = [];

  if (!source.title.trim()) issues.push('title_required');
  if (source.scope.length === 0) issues.push('scope_required');
  if (!source.retrievedAt.trim()) issues.push('retrieved_at_required');
  if (source.url && !isHttpsUrl(source.url)) issues.push('url_must_be_https');
  if (!source.url && !source.doi && !source.sourceRecordId) {
    issues.push('locator_required');
  }

  return issues;
}
