// Gate 0-3 determination (v3 §10.3, PR21).
//
// The gate a user has reached caps which PlantUse content categories can be
// shown for a given observation. This is deliberately conservative and
// data-driven (identification state + source origin + look-alike risk) —
// never inferred from AI confidence scores alone.

import { DangerLevel } from '../types';
import { IdentificationState } from '../types/observation';
import { PlantUse, PlantUseCategory, SourceOrigin, UseGate } from '../types/plantUse';

const CONFIRMED_STATES: IdentificationState[] = ['user_selected', 'community_supported', 'expert_verified'];

/** This app does not provide wild-harvest instructions in its initial release (v3 §10.3 Gate 3). */
const GATE3_SUPPORTED = false;

/**
 * Origins whose species identity was established by a channel independent of
 * the user's own field-ID skill — a retailer's food-safety chain, a nursery
 * label — so a dangerous WILD look-alike isn't a real risk for that specific
 * specimen (PR33). This is the single source of truth for that distinction;
 * anything NOT in this list (including any future SourceOrigin value nobody
 * has added here yet) fails CLOSED and stays subject to the look-alike cap
 * below, rather than a future addition silently bypassing it (PR34).
 *
 * Note this only relaxes the *look-alike* risk, not the general self-report
 * weakness of `origin` itself (still just a user tapping a button, with no
 * verification) — see PlantUse.allowedOrigins / isUseUnlocked() below, which
 * additionally restricts nursery_plant/store_bought_herb away from content
 * (like a specific real recipe) that was only ever cited for confirmed food
 * purchases or verified home-grown specimens.
 */
const NON_FIELD_ORIGINS: readonly SourceOrigin[] = [
  'store_bought_food',
  'store_bought_herb',
  'home_grown_verified',
  'nursery_plant',
];

export function determineMaxGate(params: {
  origin: SourceOrigin;
  identificationState: IdentificationState;
  hasDangerousLookalike: boolean;
  /** The plant's own inherent danger (not a look-alike risk) — RED never earns gate2+. */
  plantDanger?: DangerLevel;
}): UseGate {
  const { origin, identificationState, hasDangerousLookalike, plantDanger } = params;

  // Species not confirmed by the user (still just AI candidates, or
  // unidentified): learning only.
  if (!CONFIRMED_STATES.includes(identificationState)) return 'gate0';
  // Belt-and-suspenders: even if content generation is careful never to
  // offer ingestion content for a RED plant, the gate itself should never
  // read as "unlocked for use" for something this app flags as dangerous.
  if (plantDanger === 'RED') return 'gate0';

  // A dangerous look-alike caps the gate at gate0 unless the origin is one of
  // the NON_FIELD_ORIGINS above (see that constant's comment for the
  // reasoning and the fail-closed rationale).
  if (!NON_FIELD_ORIGINS.includes(origin) && hasDangerousLookalike) return 'gate0';

  if (NON_FIELD_ORIGINS.includes(origin)) return 'gate2';

  switch (origin) {
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

/**
 * Whether a use *category* has reached its required gate — the gate-rank
 * check only, with no `allowedOrigins` check. Do NOT use this to decide
 * whether to render a `PlantUse` card as unlocked; that check must also
 * enforce `allowedOrigins`, so use `isUseUnlocked` for that instead (PR34).
 * This stays exported for cases that need the gate-only fact — e.g.
 * distinguishing "gate not reached" from "origin not allowed" when composing
 * a locked-state message.
 */
export function isCategoryUnlocked(category: PlantUseCategory, achievedGate: UseGate): boolean {
  return isGateAtLeast(achievedGate, requiredGateForCategory(category));
}

/**
 * Whether a specific PlantUse card should render as unlocked (PR34). This is
 * the check the plant detail screen should call instead of
 * `isCategoryUnlocked` directly — `PlantUse.allowedOrigins` had been declared
 * on every use since PR22 but was never actually consulted anywhere, so a
 * card whose content is only valid for e.g. `store_bought_food` (a real,
 * cited recipe) would render as unlocked for ANY origin that reaches the
 * category's gate, including `nursery_plant` — an origin this app cannot
 * verify any better than a wild find (see NON_FIELD_ORIGINS's comment).
 *
 * An empty `allowedOrigins` is treated as "not origin-restricted" (unlocked
 * whenever the category gate is reached) rather than "never unlockable" —
 * every use currently in this app's content sets a non-empty list, but a
 * future one that genuinely has no origin restriction shouldn't be
 * permanently hidden by omission.
 */
export function isUseUnlocked(use: PlantUse, achievedGate: UseGate, origin: SourceOrigin): boolean {
  if (!isCategoryUnlocked(use.category, achievedGate)) return false;
  if (use.allowedOrigins.length === 0) return true;
  return use.allowedOrigins.includes(origin);
}
