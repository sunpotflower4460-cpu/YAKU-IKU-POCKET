import { IdentificationCandidate } from '../types/observation';
import { getSafetyWarnings, LookalikeRisk } from '../data/safety';

export interface CandidateSafetyResult {
  /** Any candidate itself is classified as dangerous (RED). */
  hasDangerousCandidate: boolean;
  /** Any candidate has a catalogued dangerous look-alike. */
  hasLookalikeRisk: boolean;
  /** Deduplicated look-alike warnings across all candidates. */
  warnings: LookalikeRisk[];
}

/**
 * Cross-checks every candidate in a result (not just the top-ranked one), so
 * a dangerous possibility is never hidden just because it didn't rank #1
 * (§7.5 "候補1位が安全側でも警告").
 */
export function assessCandidateSafety(candidates: IdentificationCandidate[]): CandidateSafetyResult {
  const hasDangerousCandidate = candidates.some((c) => c.plant.danger === 'RED');

  const seen = new Set<string>();
  const warnings: LookalikeRisk[] = [];
  for (const c of candidates) {
    for (const w of getSafetyWarnings(c.plant.id)) {
      const key = `${c.plant.id}:${w.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push(w);
    }
  }

  return { hasDangerousCandidate, hasLookalikeRisk: warnings.length > 0, warnings };
}
