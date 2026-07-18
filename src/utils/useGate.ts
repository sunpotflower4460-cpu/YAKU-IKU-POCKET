// Gate 0-3 determination (v3 §10.3, PR21).
//
// The gate a user has reached caps which PlantUse content categories can be
// shown for a given observation. This is deliberately conservative and
// data-driven (identification state + source origin + look-alike risk) —
// never inferred from AI confidence scores alone.

import { DangerLevel } from '../types';
import { IdentificationState } from '../types/observation';
import { PlantUseCategory, SourceOrigin, UseGate } from '../types/plantUse';

const CONFIRMED_STATES: IdentificationState[] = ['user_selected', 'community_supported', 'expert_verified'];

/** This app does not provide wild-harvest instructions in its initial release (v3 §10.3 Gate 3). */
const GATE3_SUPPORTED = false;

export function determineMaxGate(params: {
  origin: SourceOrigin;
  identificationState: IdentificationState;
  hasDangerousLookalike: boolean;
  /** The plant's own inherent danger (not a look-alike risk) — RED never earns gate2+. */
  plantDanger?: DangerLevel;
}): UseGate {
  const { origin, identificationState, hasDangerousLookalike, plantDanger } = params;

  // Species not confirmed by the user (still just AI candidates, or
  // unidentified), or a dangerous look-alike exists: learning only.
  if (!CONFIRMED_STATES.includes(identificationState)) return 'gate0';
  if (hasDangerousLookalike) return 'gate0';
  // Belt-and-suspenders: even if content generation is careful never to
  // offer ingestion content for a RED plant, the gate itself should never
  // read as "unlocked for use" for something this app flags as dangerous.
  if (plantDanger === 'RED') return 'gate0';

  switch (origin) {
    case 'store_bought_food':
    case 'store_bought_herb':
    case 'home_grown_verified':
    case 'nursery_plant':
      return 'gate2';
    case 'wild_observed':
      return 'gate1';
    case 'wild_collected':
      // Gate 3 (actual harvest/use instructions) isn't supported yet; a
      // wild-collected specimen still only unlocks the same observation-safe
      // tier as a merely-observed one.
      return GATE3_SUPPORTED ? 'gate3' : 'gate1';
    case 'unknown':
    default:
      return 'gate0';
  }
}

const GATE_RANK: Record<UseGate, number> = { gate0: 0, gate1: 1, gate2: 2, gate3: 3 };

/** The minimum gate required before a use category's content may be shown at all. */
export function requiredGateForCategory(category: PlantUseCategory): UseGate {
  switch (category) {
    case 'ecology':
    case 'culture':
      return 'gate0';
    case 'cultivation':
    case 'garden':
    case 'decoration':
      return 'gate1';
    case 'food':
    case 'drink':
    case 'preservation':
    case 'craft':
    case 'dye':
    case 'fragrance':
    case 'traditional_medicine':
    default:
      return 'gate2';
  }
}

export function isGateAtLeast(achieved: UseGate, required: UseGate): boolean {
  return GATE_RANK[achieved] >= GATE_RANK[required];
}

export function isCategoryUnlocked(category: PlantUseCategory, achievedGate: UseGate): boolean {
  return isGateAtLeast(achievedGate, requiredGateForCategory(category));
}
