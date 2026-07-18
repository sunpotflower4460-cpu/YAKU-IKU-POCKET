// Knowledge schema (PR11, §10.1 PlantDefinition).
//
// This is an ADDITIVE, parallel dataset built on top of the existing `Plant`
// type — it does not replace `Plant` or touch anything persisted in
// AsyncStorage (plant data is static code, never user-saved, so there is no
// migration risk here; see docs/MIGRATION_PLAN.md). Screens keep using
// `Plant` as before; `PlantDefinition` is available for richer detail views
// in later PRs (Explore/Fieldbook, §7.6–§7.8).
//
// Honesty policy (carried over from PR6–10): every field here is either
// derived from data already vetted in this app (danger level, habitat,
// season, look-alikes, traditional-use tags) or authored from well-established
// botanical knowledge (family/genus for common species). Fields that would
// require an external authoritative database we have not queried — taxon IDs,
// citations, conservation status, native/invasive status — are left
// `undefined` rather than guessed. See docs/DATA_SOURCES_AND_LICENSES.md.

import { SafetyProfile } from './observation';

export interface TaxonIds {
  gbif?: string;
  powo?: string;
  inaturalist?: string;
  plantnet?: string;
  ylist?: string;
}

export interface Taxonomy {
  scientificName: string;
  acceptedName?: string;
  japaneseNames: string[];
  englishNames: string[];
  synonyms: string[];
  /** Family (科), e.g. "キク科 (Asteraceae)". Editorial-level botanical knowledge — see reviewStatus. */
  family?: string;
  /** Genus (属), e.g. "タンポポ属 (Taraxacum)". */
  genus?: string;
  /** External database identifiers. Left empty until real API integration (PR14) — never guessed. */
  taxonIds: TaxonIds;
}

export interface Classification {
  category: string;
  growthForm?: string;
  lifecycle?: string;
  nativeStatus?: string;
}

/** Structured morphology — intentionally sparse in PR11; see IMPLEMENTATION_ROADMAP.md. */
export interface MorphologyProfile {
  notes?: string;
}

export interface EcologyProfile {
  habitat?: string;
}

export interface PhenologyProfile {
  season?: string;
}

export interface ConservationProfile {
  status?: string;
}

export interface CulturalUseRecord {
  /** e.g. "消化促進" — carried over from the existing `effects` tags. */
  label: string;
  /** Always present: these are folklore/traditional-use tags, not medical claims. */
  evidenceStatus: 'traditional_folklore';
}

export interface PlantDefinition {
  id: string;
  taxonomy: Taxonomy;
  classification: Classification;
  morphology: MorphologyProfile;
  ecology: EcologyProfile;
  phenology: PhenologyProfile;
  safety: SafetyProfile;
  conservation?: ConservationProfile;
  culturalUses?: CulturalUseRecord[];

  /** IDs of other PlantDefinitions this one is commonly confused with. */
  lookalikeIds: string[];
  /** Citations backing this entry. Empty until real sources are attached. */
  sourceRefs: string[];
  reviewedAt?: string;
  /**
   * - 'unverified' : not yet cross-checked against any authoritative source.
   * - 'editorial'  : authored using general botanical knowledge (this app's
   *                  current baseline for taxonomy/safety fields).
   * - 'expert'     : confirmed by a qualified reviewer against cited sources.
   */
  reviewStatus: 'unverified' | 'editorial' | 'expert';
}
