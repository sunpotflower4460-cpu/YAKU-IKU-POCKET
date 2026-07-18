// Uses Safety Architecture (v3 §10, §16.2, PR21).
//
// This module defines the data model and gating rules for "how a plant can
// be used in daily life" content (cooking, drinks, cultivation, crafts...).
// It intentionally ships with NO per-plant content in this PR — only the
// types and the gate-determination logic. Populating real PlantUse records
// (PR22) requires deciding, species by species, what can honestly be said
// without inventing recipes, dosages, or preparation steps this app has no
// verified source for.

/** How the user obtained the specimen this observation/use is based on. */
export type SourceOrigin =
  | 'wild_observed'
  | 'wild_collected'
  | 'home_grown_verified'
  | 'nursery_plant'
  | 'store_bought_food'
  | 'store_bought_herb'
  | 'unknown';

/** How strong the evidence behind a usage claim is — never conflate tradition with proven efficacy. */
export type UseEvidenceLevel =
  | 'official_guidance'
  | 'established_food_use'
  | 'published_reference'
  | 'traditional_record'
  | 'community_practice'
  | 'unverified';

export const USE_EVIDENCE_LABEL: Record<UseEvidenceLevel, string> = {
  official_guidance: '公的情報',
  established_food_use: '一般的な食利用',
  published_reference: '文献記録',
  traditional_record: '伝統利用',
  community_practice: '地域での利用例',
  unverified: '未確認',
};

export interface PreparationGuide {
  steps: string[];
  notes?: string[];
}

export type PlantUseCategory =
  | 'food'
  | 'drink'
  | 'cultivation'
  | 'preservation'
  | 'craft'
  | 'dye'
  | 'fragrance'
  | 'decoration'
  | 'garden'
  | 'ecology'
  | 'culture'
  | 'traditional_medicine';

export interface PlantUse {
  id: string;
  plantId: string;
  category: PlantUseCategory;
  title: string;
  summary: string;
  partsUsed: string[];
  /** Origins from which this use is considered safe enough to surface (§10.3 gates). */
  allowedOrigins: SourceOrigin[];
  evidenceLevel: UseEvidenceLevel;
  preparation?: PreparationGuide;
  warnings: string[];
  contraindications: string[];
  sourceRefs: string[];
  reviewedAt?: string;
}

/**
 * The four content-safety gates (v3 §10.3). Gate 0 is learning-only info;
 * Gate 3 (wild-collection instructions) is out of scope for this app's
 * initial release regardless of origin/evidence (see docs/BLUEPRINT_V3.md).
 */
export type UseGate = 'gate0' | 'gate1' | 'gate2' | 'gate3';

export const USE_GATE_LABEL: Record<UseGate, string> = {
  gate0: '学習のみ',
  gate1: '一般的な暮らし情報',
  gate2: '栽培・購入品向け利用',
  gate3: '野生採取を伴う情報（初版では非対応）',
};
