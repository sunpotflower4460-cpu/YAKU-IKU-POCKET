import { ScanResult, recognizePlant } from './mockAI';
import { recognizePlantWithClaude } from './claudeAI';
import { CapturedPhoto } from '../types/capture';
import { IdentificationCandidate } from '../types/observation';
import { SubjectCategory } from '../types/subject';

/**
 * API key from environment variable.
 * Set EXPO_PUBLIC_CLAUDE_API_KEY in your .env file to enable Claude Vision.
 * If not set, falls back to mock AI (demo mode).
 *
 * NOTE (security): EXPO_PUBLIC_* variables are embedded in the shipped bundle
 * and are extractable. For a production release the key MUST be moved behind a
 * backend proxy — see docs/APP_STORE_AUDIT.md.
 */
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

/**
 * §11 "同意画面": even with a key configured, photos must not be sent to the
 * real AI provider until the user has explicitly consented (Fieldbook
 * settings). Callers pass the current consent value from the store.
 */

/**
 * Discriminated outcome of a scan.
 *
 * - `identified`   : one or more candidates (§7.5 — never a single unearned
 *                    certainty). `plant`/`confidence`/`reason` mirror the top
 *                    candidate for callers that only care about the best
 *                    guess; `candidates` carries the full ranked list (real
 *                    AI only — demo mode has nothing to rank, see below).
 * - `unidentified` : real AI could not confidently match a database plant.
 *                    We deliberately do NOT invent a random plant here.
 * - `out_of_scope` : Subject Router (v3 §12) classified the photo as
 *                    something other than a vascular plant (fungus, insect,
 *                    non-plant object, unclear image...). Carries an honest
 *                    category + guidance instead of a forced plant match.
 * - `error`        : real AI call failed (network/timeout/malformed response).
 *                    We deliberately do NOT fall back to a random mock result.
 */
export type ScanOutcome =
  | ({ status: 'identified'; usedRealAI: boolean; candidates?: IdentificationCandidate[] } & ScanResult)
  | { status: 'unidentified'; usedRealAI: true; reason?: string }
  | { status: 'out_of_scope'; usedRealAI: true; category: SubjectCategory; guidance: string }
  | { status: 'error'; usedRealAI: true; message: string };

/**
 * Scan one or more captured photos of the same specimen and return an
 * identification outcome.
 *
 * - If `photos` is non-empty AND EXPO_PUBLIC_CLAUDE_API_KEY is set
 *   → calls Claude Vision API (real AI) with all photos in one request,
 *     returning up to 3 ranked candidates. Unknown/failed results surface as
 *     `unidentified` / `error` — never a random guess.
 * - Otherwise → uses weighted-random mock AI (demo mode), which always
 *   returns a single `identified` result flagged with `usedRealAI: false`
 *   and no `candidates` list — the mock has no real analysis to rank, so we
 *   don't dress it up as a comparison (see docs/IDENTIFICATION_PIPELINE.md).
 */
export async function scanPlant(
  discoveredIds: string[],
  photos: CapturedPhoto[] = [],
  aiConsentGiven: boolean = false
): Promise<ScanOutcome> {
  if (photos.length > 0 && CLAUDE_API_KEY && aiConsentGiven) {
    try {
      const outcome = await recognizePlantWithClaude(photos, CLAUDE_API_KEY);
      if (outcome.status === 'unidentified') {
        return { status: 'unidentified', usedRealAI: true, reason: outcome.reason };
      }
      if (outcome.status === 'out_of_scope') {
        return {
          status: 'out_of_scope',
          usedRealAI: true,
          category: outcome.category,
          guidance: outcome.guidance,
        };
      }
      const top = outcome.candidates[0];
      const isNewDiscovery = !discoveredIds.includes(top.plant.id);
      return {
        status: 'identified',
        usedRealAI: true,
        plant: top.plant,
        confidence: top.score.visionScore ?? 0,
        isNewDiscovery,
        reason: top.reason,
        candidates: outcome.candidates,
      };
    } catch (err) {
      console.warn('[AI] Claude Vision failed:', err);
      return {
        status: 'error',
        usedRealAI: true,
        message: err instanceof Error ? err.message : 'unknown error',
      };
    }
  }

  // Demo mode (no key / no photos): mock always returns a single plant.
  const result = await recognizePlant(discoveredIds);
  return { status: 'identified', usedRealAI: false, ...result };
}
