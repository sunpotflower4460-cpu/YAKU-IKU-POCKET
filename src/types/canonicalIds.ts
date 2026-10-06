/**
 * Global Plant Brain canonical identifiers (G0).
 *
 * External database IDs are never used as YAKU primary keys. These branded
 * identifiers give the knowledge layer stable internal references while
 * keeping external IDs as cross-references.
 *
 * IDs are intentionally NOT generated from scientific names or external IDs.
 * Callers must supply a stable local component allocated by YAKU.
 */

declare const canonicalIdBrand: unique symbol;

export type CanonicalIdKind =
  | 'taxon'
  | 'plant_name'
  | 'specimen'
  | 'medicinal_material'
  | 'preparation'
  | 'batch'
  | 'compound'
  | 'target'
  | 'trial'
  | 'claim'
  | 'source'
  | 'authority'
  | 'provenance'
  | 'rights_policy';

export type CanonicalId<K extends CanonicalIdKind> = string & {
  readonly [canonicalIdBrand]: K;
};

export type YakuTaxonConceptId = CanonicalId<'taxon'>;
export type YakuPlantNameId = CanonicalId<'plant_name'>;
export type YakuSpecimenId = CanonicalId<'specimen'>;
export type YakuMedicinalMaterialId = CanonicalId<'medicinal_material'>;
export type YakuPreparationId = CanonicalId<'preparation'>;
export type YakuBatchId = CanonicalId<'batch'>;
export type YakuCompoundId = CanonicalId<'compound'>;
export type YakuTargetId = CanonicalId<'target'>;
export type YakuTrialId = CanonicalId<'trial'>;
export type YakuClaimId = CanonicalId<'claim'>;
export type YakuSourceId = CanonicalId<'source'>;
export type YakuAuthorityId = CanonicalId<'authority'>;
export type YakuProvenanceId = CanonicalId<'provenance'>;
export type YakuRightsPolicyId = CanonicalId<'rights_policy'>;

export interface CanonicalIdByKind {
  taxon: YakuTaxonConceptId;
  plant_name: YakuPlantNameId;
  specimen: YakuSpecimenId;
  medicinal_material: YakuMedicinalMaterialId;
  preparation: YakuPreparationId;
  batch: YakuBatchId;
  compound: YakuCompoundId;
  target: YakuTargetId;
  trial: YakuTrialId;
  claim: YakuClaimId;
  source: YakuSourceId;
  authority: YakuAuthorityId;
  provenance: YakuProvenanceId;
  rights_policy: YakuRightsPolicyId;
}

const PREFIX_BY_KIND: Record<CanonicalIdKind, string> = {
  taxon: 'yaku:taxon:',
  plant_name: 'yaku:plant-name:',
  specimen: 'yaku:specimen:',
  medicinal_material: 'yaku:material:',
  preparation: 'yaku:preparation:',
  batch: 'yaku:batch:',
  compound: 'yaku:compound:',
  target: 'yaku:target:',
  trial: 'yaku:trial:',
  claim: 'yaku:claim:',
  source: 'yaku:source:',
  authority: 'yaku:authority:',
  provenance: 'yaku:provenance:',
  rights_policy: 'yaku:rights-policy:',
};

const LOCAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Brands an explicitly allocated YAKU-local identifier.
 *
 * This helper deliberately does not accept arbitrary names or URLs as the
 * local component. Stable ID allocation is a separate responsibility.
 */
export function makeCanonicalId<K extends CanonicalIdKind>(
  kind: K,
  localId: string,
): CanonicalIdByKind[K] {
  if (!LOCAL_ID_PATTERN.test(localId)) {
    throw new Error(
      `Invalid YAKU local ID "${localId}". Use a stable ASCII token containing only letters, numbers, ".", "_" or "-".`,
    );
  }

  return `${PREFIX_BY_KIND[kind]}${localId}` as CanonicalIdByKind[K];
}

export function parseCanonicalId<K extends CanonicalIdKind>(
  kind: K,
  value: string,
): CanonicalIdByKind[K] | undefined {
  const prefix = PREFIX_BY_KIND[kind];
  if (!value.startsWith(prefix)) return undefined;

  const localId = value.slice(prefix.length);
  if (!LOCAL_ID_PATTERN.test(localId)) return undefined;

  return value as CanonicalIdByKind[K];
}

export function getCanonicalIdKind(value: string): CanonicalIdKind | undefined {
  for (const [kind, prefix] of Object.entries(PREFIX_BY_KIND) as Array<
    [CanonicalIdKind, string]
  >) {
    if (value.startsWith(prefix) && LOCAL_ID_PATTERN.test(value.slice(prefix.length))) {
      return kind;
    }
  }
  return undefined;
}
