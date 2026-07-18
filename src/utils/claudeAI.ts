import { PLANTS } from '../data/plants';
import { Plant } from '../types';
import { CapturedPhoto, ORGAN_LABEL } from '../types/capture';
import { IdentificationCandidate } from '../types/observation';
import { getCurrentSeason, isPlantInSeason } from './season';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MAX_CANDIDATES = 3;

/**
 * Result of a Claude Vision identification attempt.
 *
 * IMPORTANT (safety): we NEVER substitute a random plant when Claude cannot
 * identify the specimen. Misidentifying e.g. トリカブト (deadly) as an edible
 * plant is unacceptable, so an unconfident/unknown result must surface as
 * `unidentified` rather than a confident guess.
 *
 * `identified` returns a ranked candidate LIST (§7.5 "候補を理解して選ぶ"),
 * never a single unearned certainty — 1 candidate is the common case, up to
 * MAX_CANDIDATES when Claude reports more than one plausible match.
 */
export type ClaudeScanOutcome =
  | { status: 'identified'; candidates: IdentificationCandidate[] }
  | { status: 'unidentified'; reason?: string };

// Plant list for prompt context
const PLANT_NAMES_LIST = PLANTS.map(
  (p) => `${p.name}（${p.nameEn} / ${p.nameLatin}）`
).join('\n');

interface RawCandidate {
  plantName?: string;
  confidence: number;
  reason?: string;
}

interface ClaudeIdentifyResult {
  identified: boolean;
  candidates: RawCandidate[];
  reason?: string; // top-level reason used only when identified=false
}

async function callClaudeVision(
  photos: CapturedPhoto[],
  apiKey: string
): Promise<ClaudeIdentifyResult> {
  // Multiple photos (e.g. whole plant + leaf close-up) are sent in a single
  // message so Claude can cross-reference organs, per §9.2A "複数画像".
  const imageBlocks = photos.map((p) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: p.base64 },
  }));
  const organNote =
    photos.length > 1
      ? `\n\n提供された${photos.length}枚の写真は、それぞれ次の部位です（順番通り）: ${photos
          .map((p) => ORGAN_LABEL[p.organ])
          .join('、')}`
      : '';

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 768,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          {
            type: 'text',
            text: `あなたは植物同定の専門家です。この画像を解析して、以下のリストの中から一致する可能性のある植物を、最大${MAX_CANDIDATES}件、確信度が高い順に挙げてください。断定はせず、候補として提示してください。${organNote}

【データベースの植物リスト】
${PLANT_NAMES_LIST}

以下のJSON形式のみで回答してください（前後に説明文は不要です）：
{
  "identified": true または false,
  "candidates": [
    { "plantName": "リストに存在する日本語名", "confidence": 40から99の整数, "reason": "根拠を1〜2文で" }
  ]
}

注意：
- リストにない植物や、植物として不明な場合は identified を false にし、candidates は空配列にしてください
- plantName はリストの日本語名と完全に一致させてください
- 確信が持てない候補は無理に含めなくてよい（1件だけでも構いません）
- 候補は confidence の高い順に並べてください`,
          },
        ],
      },
    ],
  };

  // Abort the request if the API takes too long (avoids a hung scan spinner).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Claude API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text: string = data?.content?.[0]?.text ?? '';

  // Extract JSON block from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in Claude response: ${text}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Malformed JSON in Claude response: ${jsonMatch[0]}`);
  }

  // Runtime validation — never trust the shape of an LLM response.
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Claude response is not an object');
  }
  const obj = parsed as Record<string, unknown>;
  const identified = obj.identified === true;
  const rawCandidates = Array.isArray(obj.candidates) ? obj.candidates : [];
  const candidates: RawCandidate[] = rawCandidates
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      plantName: typeof c.plantName === 'string' ? c.plantName : undefined,
      confidence: typeof c.confidence === 'number' ? c.confidence : NaN,
      reason: typeof c.reason === 'string' ? c.reason : undefined,
    }));

  return {
    identified,
    candidates,
    reason: typeof obj.reason === 'string' ? obj.reason : undefined,
  };
}

function findPlantByName(name: string): Plant | undefined {
  const lower = name.toLowerCase().trim();
  return PLANTS.find(
    (p) =>
      p.name === name.trim() ||
      p.nameEn.toLowerCase() === lower ||
      p.nameLatin.toLowerCase() === lower
  );
}

/**
 * Identify a plant from one or more captured photos using Claude Vision API.
 *
 * Returns `unidentified` (never a random guess) when Claude reports nothing
 * confident, or when every candidate fails validation (not in our database,
 * or missing/invalid confidence). Valid candidates are capped at
 * MAX_CANDIDATES and annotated with a locally-computed season fit — never a
 * fabricated score.
 */
export async function recognizePlantWithClaude(
  photos: CapturedPhoto[],
  apiKey: string
): Promise<ClaudeScanOutcome> {
  const result = await callClaudeVision(photos, apiKey);

  if (!result.identified || result.candidates.length === 0) {
    return { status: 'unidentified', reason: result.reason };
  }

  const season = getCurrentSeason();
  const seen = new Set<string>();
  const candidates: IdentificationCandidate[] = [];

  for (const raw of result.candidates) {
    if (candidates.length >= MAX_CANDIDATES) break;
    if (!raw.plantName) continue;

    const plant = findPlantByName(raw.plantName);
    // Claude named something not in our curated database — skip rather than
    // mapping it onto an arbitrary entry.
    if (!plant || seen.has(plant.id)) continue;

    const confidence =
      raw.confidence >= 1 && raw.confidence <= 100 ? Math.round(raw.confidence) : undefined;
    // A candidate with no usable confidence is dropped, not defaulted to a
    // made-up number.
    if (confidence === undefined) continue;

    seen.add(plant.id);
    candidates.push({
      plant,
      score: {
        visionScore: confidence,
        seasonScore: isPlantInSeason(plant.season, season) ? 1 : 0,
        overallRank: candidates.length + 1,
      },
      reason: raw.reason,
    });
  }

  // Keep the model's own ranking (already requested high→low) but re-sort
  // defensively in case the response wasn't ordered, then fix overallRank.
  candidates.sort((a, b) => (b.score.visionScore ?? 0) - (a.score.visionScore ?? 0));
  candidates.forEach((c, i) => {
    c.score.overallRank = i + 1;
  });

  if (candidates.length === 0) {
    return { status: 'unidentified', reason: result.reason };
  }

  return { status: 'identified', candidates };
}
