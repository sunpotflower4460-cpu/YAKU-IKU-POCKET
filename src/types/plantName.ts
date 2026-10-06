/**
 * Name-graph types for Global Plant Brain.
 *
 * IPNI identifies nomenclatural name records, not YAKU taxon concepts.
 * Therefore IPNI LSIDs belong here rather than on the taxon itself.
 */

import {
  YakuPlantNameId,
  YakuSourceId,
  YakuTaxonConceptId,
} from './canonicalIds';
import { TaxonRank } from './taxonConcept';

export type PlantNameType =
  | 'scientific'
  | 'synonym'
  | 'vernacular'
  | 'pharmaceutical'
  | 'crude_drug'
  | 'traditional';

export type PlantNameRole =
  | 'catalog_scientific'
  | 'preferred_scientific'
  | 'authority_alternative';

export type PlantNameRecordStatus =
  | 'active'
  | 'historical'
  | 'conflicted';

export interface PlantNameExternalIds {
  ipniLsid?: string;
}

export interface PlantNameRecord {
  id: YakuPlantNameId;
  taxonConceptId: YakuTaxonConceptId;

  value: string;
  type: PlantNameType;
  role: PlantNameRole;
  rank?: TaxonRank;

  language?: string;
  script?: string;
  region?: string;

  externalIds: PlantNameExternalIds;

  sourceRefIds: YakuSourceId[];
  sourceVersion?: string;

  status: PlantNameRecordStatus;
}

const IPNI_LSID_PATTERN =
  /^urn:lsid:ipni\.org:names:[A-Za-z0-9._-]+$/;

export function isIpniLsid(value: string): boolean {
  return IPNI_LSID_PATTERN.test(value);
}

export function validatePlantNameRecord(
  record: PlantNameRecord,
): string[] {
  const issues: string[] = [];

  if (!record.value.trim()) issues.push('value_required');
  if (record.sourceRefIds.length === 0) {
    issues.push('source_ref_required');
  }

  if (
    record.externalIds.ipniLsid &&
    !isIpniLsid(record.externalIds.ipniLsid)
  ) {
    issues.push('invalid_ipni_lsid');
  }

  return issues;
}
