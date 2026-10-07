/**
 * Plant-name / nomenclatural identity for Global Plant Brain.
 *
 * A scientific name is not a taxon concept. Names remain stable historical
 * objects even when taxonomic authorities move them between accepted concepts.
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

export type ScientificNameRole =
  | 'catalog_scientific'
  | 'preferred_accepted'
  | 'authority_usage';

export interface PlantNameNomenclaturalIds {
  /** IPNI identifies the scientific NAME record, not the taxon concept. */
  ipniLsid?: string;

  /** WFO name/taxon usage ID from a pinned WFO source release. */
  wfoNameUsageId?: string;
}

export interface PlantNameRecord {
  id: YakuPlantNameId;
  value: string;
  type: PlantNameType;

  role?: ScientificNameRole;
  rank?: TaxonRank;
  authorship?: string;
  nomenclaturalStatus?: string;

  taxonConceptIds: YakuTaxonConceptId[];
  nomenclaturalIds: PlantNameNomenclaturalIds;

  sourceRefIds: YakuSourceId[];
  sourceVersion?: string;
  reviewedAt: string;
  notes?: string;
}

export function validatePlantNameRecord(record: PlantNameRecord): string[] {
  const issues: string[] = [];

  if (!record.value.trim()) issues.push('value_required');
  if (record.taxonConceptIds.length === 0) {
    issues.push('taxon_concept_required');
  }
  if (record.sourceRefIds.length === 0) {
    issues.push('source_ref_required');
  }
  if (!record.reviewedAt.trim()) {
    issues.push('reviewed_at_required');
  }

  const ipni = record.nomenclaturalIds.ipniLsid;
  if (
    ipni &&
    !/^urn:lsid:ipni\.org:names:[A-Za-z0-9.-]+$/.test(ipni)
  ) {
    issues.push('invalid_ipni_lsid');
  }

  const wfo = record.nomenclaturalIds.wfoNameUsageId;
  if (wfo && !/^wfo-[A-Za-z0-9]+$/.test(wfo)) {
    issues.push('invalid_wfo_name_usage_id');
  }

  return issues;
}
