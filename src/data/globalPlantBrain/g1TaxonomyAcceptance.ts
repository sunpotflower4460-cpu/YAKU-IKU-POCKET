/**
 * G1 current-catalog acceptance report.
 *
 * This evaluates whether the *current 150 product-card taxonomy foundation*
 * is ready to serve as a stable base for later global-scale ingestion.
 *
 * Passing this report does NOT mean that all world plants are ingested or
 * identifiable. It means the first product projection is fully represented,
 * versioned, source-backed, conflict-aware and nomenclaturally traceable.
 */

import { PLANTS, TOTAL_PLANTS } from '../plants';
import {
  CURRENT_CATALOG_NOMENCLATURE_ASSERTIONS,
} from './plantNameAssertions';
import {
  CATALOG_NAME_NOMENCLATURE_COVERAGE,
} from './plantNameNomenclatureSnapshot';
import { CURRENT_CATALOG_PLANT_NAMES } from './plantNameRegistry';
import {
  SOURCE_REGISTRY,
} from './sourceRegistry';
import { CURRENT_CATALOG_TAXA } from './taxonSeedRegistry';
import {
  CURRENT_CATALOG_TAXONOMY_ASSERTIONS,
  CURRENT_CATALOG_TAXONOMY_SNAPSHOT,
} from './taxonomyAssertions';
import {
  CURRENT_TAXONOMY_CONFLICTS,
  evaluateTaxonomyOperation,
} from './taxonomyConflictRegistry';
import {
  WFO_SAFE_ACCEPTED_IDS,
} from './wfoResolutionSnapshot';

export type G1AcceptanceCheckId =
  | 'all_product_cards_mapped'
  | 'canonical_taxon_count'
  | 'no_local_seed'
  | 'resolution_state_partition'
  | 'wfo_safe_coverage'
  | 'plant_name_graph'
  | 'catalog_ipni_coverage'
  | 'taxonomy_assertions'
  | 'nomenclature_assertions'
  | 'conflicts_explicit'
  | 'conflicts_block_auto_concept_changes'
  | 'required_sources_approved'
  | 'taxonomy_snapshot_pinned';

export interface G1AcceptanceCheck {
  id: G1AcceptanceCheckId;
  passed: boolean;
  observed: string;
  expected: string;
}

export interface G1CurrentCatalogAcceptance {
  scope: 'current_catalog_foundation';
  status: 'pass' | 'fail';
  evaluatedAt: string;
  checks: G1AcceptanceCheck[];

  limitations: string[];
}

function countResolutionState(state: string): number {
  return CURRENT_CATALOG_TAXA.filter(
    (taxon) => taxon.resolutionStatus === state,
  ).length;
}

export function evaluateG1CurrentCatalogAcceptance():
  G1CurrentCatalogAcceptance {
  const productIds = new Set(PLANTS.map((plant) => plant.id));
  const projectedProductIds = new Set(
    CURRENT_CATALOG_TAXA.flatMap((taxon) => taxon.productPlantIds),
  );

  const exactResolved = countResolutionState('externally_resolved');
  const reconciled = countResolutionState('externally_reconciled');
  const conflicted = countResolutionState('conflicted');
  const localSeed = countResolutionState('local_seed');

  const requiredApprovedSourceSuffixes = [
    ':catalogue-of-life',
    ':world-flora-online',
    ':kew-powo-wcvp',
    ':ipni',
  ];
  const approvedCoreIds = SOURCE_REGISTRY.filter(
    (source) => source.status === 'approved_core',
  ).map((source) => source.id);

  const conflictsBlockAutomaticConceptChanges =
    CURRENT_TAXONOMY_CONFLICTS.every(
      (conflict) =>
        evaluateTaxonomyOperation(
          conflict.taxonId,
          'preferred_name_autoselect',
        ) === 'deny' &&
        evaluateTaxonomyOperation(
          conflict.taxonId,
          'external_accepted_id_promotion',
        ) === 'deny' &&
        evaluateTaxonomyOperation(
          conflict.taxonId,
          'taxon_merge',
        ) === 'review' &&
        evaluateTaxonomyOperation(
          conflict.taxonId,
          'cross_source_evidence_merge',
        ) === 'review',
    );

  const checks: G1AcceptanceCheck[] = [
    {
      id: 'all_product_cards_mapped',
      passed:
        TOTAL_PLANTS === 150 &&
        productIds.size === 150 &&
        projectedProductIds.size === 150 &&
        [...productIds].every((id) => projectedProductIds.has(id)),
      observed:
        `${productIds.size} product IDs / ${projectedProductIds.size} projected IDs`,
      expected: '150 / 150',
    },
    {
      id: 'canonical_taxon_count',
      passed: CURRENT_CATALOG_TAXA.length === 149,
      observed: String(CURRENT_CATALOG_TAXA.length),
      expected: '149',
    },
    {
      id: 'no_local_seed',
      passed: localSeed === 0,
      observed: String(localSeed),
      expected: '0',
    },
    {
      id: 'resolution_state_partition',
      passed:
        exactResolved === 137 &&
        reconciled === 7 &&
        conflicted === 5 &&
        exactResolved + reconciled + conflicted === 149,
      observed:
        `resolved=${exactResolved}, reconciled=${reconciled}, conflicted=${conflicted}`,
      expected: 'resolved=137, reconciled=7, conflicted=5',
    },
    {
      id: 'wfo_safe_coverage',
      passed: Object.keys(WFO_SAFE_ACCEPTED_IDS).length === 144,
      observed: String(Object.keys(WFO_SAFE_ACCEPTED_IDS).length),
      expected: '144 safe accepted-concept links',
    },
    {
      id: 'plant_name_graph',
      passed: CURRENT_CATALOG_PLANT_NAMES.length === 156,
      observed: String(CURRENT_CATALOG_PLANT_NAMES.length),
      expected: '156 name records',
    },
    {
      id: 'catalog_ipni_coverage',
      passed:
        CATALOG_NAME_NOMENCLATURE_COVERAGE.catalogNames === 149 &&
        CATALOG_NAME_NOMENCLATURE_COVERAGE.catalogNamesWithIpniLsid ===
          147 &&
        CATALOG_NAME_NOMENCLATURE_COVERAGE.catalogNamesWithoutIpniLsid ===
          2,
      observed:
        `${CATALOG_NAME_NOMENCLATURE_COVERAGE.catalogNamesWithIpniLsid}/${CATALOG_NAME_NOMENCLATURE_COVERAGE.catalogNames}`,
      expected: '147/149 catalog names with stable IPNI LSID',
    },
    {
      id: 'taxonomy_assertions',
      passed: CURRENT_CATALOG_TAXONOMY_ASSERTIONS.length === 171,
      observed: String(CURRENT_CATALOG_TAXONOMY_ASSERTIONS.length),
      expected: '171 active taxonomy assertions',
    },
    {
      id: 'nomenclature_assertions',
      passed: CURRENT_CATALOG_NOMENCLATURE_ASSERTIONS.length === 156,
      observed: String(CURRENT_CATALOG_NOMENCLATURE_ASSERTIONS.length),
      expected: '156 active nomenclatural assertions',
    },
    {
      id: 'conflicts_explicit',
      passed:
        CURRENT_TAXONOMY_CONFLICTS.length === 5 &&
        CURRENT_TAXONOMY_CONFLICTS.every(
          (conflict) => conflict.status === 'active',
        ),
      observed: String(CURRENT_TAXONOMY_CONFLICTS.length),
      expected: '5 explicit active authority conflicts',
    },
    {
      id: 'conflicts_block_auto_concept_changes',
      passed: conflictsBlockAutomaticConceptChanges,
      observed: conflictsBlockAutomaticConceptChanges
        ? 'guarded'
        : 'unguarded',
      expected:
        'autoselect/accepted-ID promotion denied; merge/evidence collapse reviewed',
    },
    {
      id: 'required_sources_approved',
      passed: requiredApprovedSourceSuffixes.every((suffix) =>
        approvedCoreIds.some((id) => id.endsWith(suffix)),
      ),
      observed: approvedCoreIds.join(', '),
      expected: 'COL, WFO backbone, Kew taxonomy backbone, IPNI approved_core',
    },
    {
      id: 'taxonomy_snapshot_pinned',
      passed:
        CURRENT_CATALOG_TAXONOMY_SNAPSHOT.policyVersion ===
          'gpb-g1-taxonomy-resolution-v2' &&
        CURRENT_CATALOG_TAXONOMY_SNAPSHOT.taxonomyVersions
          .worldFloraOnline?.includes('2026-06') === true &&
        CURRENT_CATALOG_TAXONOMY_SNAPSHOT.taxonomyVersions
          .catalogueOfLife?.includes('2026-09-25 XR') === true,
      observed:
        `${CURRENT_CATALOG_TAXONOMY_SNAPSHOT.taxonomyVersions.catalogueOfLife} / ${CURRENT_CATALOG_TAXONOMY_SNAPSHOT.taxonomyVersions.worldFloraOnline}`,
      expected: 'pinned COL 2026-09-25 XR + WFO 2026-06',
    },
  ];

  return {
    scope: 'current_catalog_foundation',
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    evaluatedAt: '2026-10-07',
    checks,
    limitations: [
      'This acceptance covers the current 150 product cards / 149 canonical taxa, not all world plant taxa.',
      'Five taxon concepts intentionally remain authority-conflicted.',
      'Two catalog synonym-name records intentionally lack a promoted stable IPNI LSID.',
      'Global-scale WFO/COL indexing, vernacular-name coverage, distribution and identification remain later G1/G2 work.',
    ],
  };
}

export const G1_CURRENT_CATALOG_ACCEPTANCE =
  evaluateG1CurrentCatalogAcceptance();
