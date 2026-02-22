import { ScanResult, recognizePlant } from './mockAI';
import { recognizePlantWithClaude } from './claudeAI';

/**
 * API key from environment variable.
 * Set EXPO_PUBLIC_CLAUDE_API_KEY in your .env file to enable Claude Vision.
 * If not set, falls back to mock AI.
 */
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

/**
 * Scan a plant image and return identification result.
 *
 * - If base64Image is provided AND EXPO_PUBLIC_CLAUDE_API_KEY is set
 *   → calls Claude Vision API (real AI)
 * - Otherwise → uses weighted-random mock AI (Phase 1 fallback)
 */
export async function scanPlant(
  discoveredIds: string[],
  base64Image?: string
): Promise<ScanResult & { usedRealAI: boolean }> {
  if (base64Image && CLAUDE_API_KEY) {
    try {
      const result = await recognizePlantWithClaude(
        base64Image,
        discoveredIds,
        CLAUDE_API_KEY
      );
      return { ...result, usedRealAI: true };
    } catch (err) {
      console.warn('[AI] Claude Vision failed, falling back to mock:', err);
      // Fall through to mock
    }
  }

  const result = await recognizePlant(discoveredIds);
  return { ...result, usedRealAI: false };
}
