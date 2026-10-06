/**
 * Machine-readable source registry types for Global Plant Brain (G0).
 */

import { YakuRightsPolicyId, YakuSourceId } from './canonicalIds';
import { SourceScope } from './sourceRef';

export type SourceRegistryStatus =
  | 'approved_core'
  | 'approved_federation'
  | 'conditional_license'
  | 'reference_only'
  | 'restricted'
  | 'blocked'
  | 'needs_review';

export type SourceAccessMethod =
  | 'api'
  | 'bulk'
  | 'document'
  | 'registry'
  | 'database'
  | 'community'
  | 'mixed';

export interface SourceRegistryEntry {
  id: YakuSourceId;
  name: string;
  purpose: SourceScope[];

  accessMethod: SourceAccessMethod;
  homepageUrl?: string;
  apiBaseUrl?: string;
  updateCadence?: string;

  rightsPolicyId: YakuRightsPolicyId;
  lastTermsReviewAt: string;

  status: SourceRegistryStatus;
  notes?: string;
}

export function validateSourceRegistryEntry(
  entry: SourceRegistryEntry,
): string[] {
  const issues: string[] = [];

  if (!entry.name.trim()) issues.push('name_required');
  if (entry.purpose.length === 0) issues.push('purpose_required');
  if (!entry.lastTermsReviewAt.trim()) issues.push('terms_review_date_required');

  for (const value of [entry.homepageUrl, entry.apiBaseUrl]) {
    if (!value) continue;
    try {
      if (new URL(value).protocol !== 'https:') {
        issues.push('url_must_be_https');
      }
    } catch {
      issues.push('invalid_url');
    }
  }

  return [...new Set(issues)];
}
