import { ScanResult, recognizePlant } from './mockAI';
import { recognizePlantWithClaude } from './claudeAI';
import { CapturedPhoto } from '../types/capture';

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
 * Discriminated outcome of a scan.
 *
 * - `identified`   : a concrete plant to show / optionally register.
 * - `unidentified` : real AI could not confidently match a database plant.
 *                    We deliberately do NOT invent a random plant here.
 * - `error`        : real AI call failed (network/timeout/malformed response).
 *                    We deliberately do NOT fall back to a random mock result.
 */
export type ScanOutcome =
  | ({ status: 'identified'; usedRealAI: boolean } & ScanResult)
  | { status: 'unidentified'; usedRealAI: true; reason?: string }
  | { status: 'error'; usedRealAI: true; message: string };

/**
 * Scan one or more captured photos of the same specimen and return an
 * identification outcome.
 *
 * - If `photos` is non-empty AND EXPO_PUBLIC_CLAUDE_API_KEY is set
 *   → calls Claude Vision API (real AI) with all photos in one request.
 *     Unknown/failed results surface as `unidentified` / `error` — never a
 *     random guess.
 * - Otherwise → uses weighted-random mock AI (demo mode), which always
 *   returns an `identified` result flagged with `usedRealAI: false`.
 */
export async function scanPlant(
  discoveredIds: string[],
  photos: CapturedPhoto[] = []
): Promise<ScanOutcome> {
  if (photos.length > 0 && CLAUDE_API_KEY) {
    try {
      const outcome = await recognizePlantWithClaude(photos, CLAUDE_API_KEY);
      if (outcome.status === 'unidentified') {
        return { status: 'unidentified', usedRealAI: true, reason: outcome.reason };
      }
      const isNewDiscovery = !discoveredIds.includes(outcome.plant.id);
      return {
        status: 'identified',
        usedRealAI: true,
        plant: outcome.plant,
        confidence: outcome.confidence,
        isNewDiscovery,
        reason: outcome.reason,
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

  // Demo mode (no key / no photos): mock always returns a plant.
  const result = await recognizePlant(discoveredIds);
  return { status: 'identified', usedRealAI: false, ...result };
}
