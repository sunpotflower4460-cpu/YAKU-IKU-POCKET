import { PLANTS } from '../data/plants';
import { Plant } from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Result of a Claude Vision identification attempt.
 *
 * IMPORTANT (safety): we NEVER substitute a random plant when Claude cannot
 * identify the specimen. Misidentifying e.g. トリカブト (deadly) as an edible
 * plant is unacceptable, so an unconfident/unknown result must surface as
 * `unidentified` rather than a confident guess.
 */
export type ClaudeScanOutcome =
  | { status: 'identified'; plant: Plant; confidence: number; reason?: string }
  | { status: 'unidentified'; reason?: string };

// Plant list for prompt context
const PLANT_NAMES_LIST = PLANTS.map(
  (p) => `${p.name}（${p.nameEn} / ${p.nameLatin}）`
).join('\n');

interface ClaudeIdentifyResult {
  identified: boolean;
  plantName?: string;
  confidence: number;
  reason?: string;
}

async function callClaudeVision(
  base64Image: string,
  apiKey: string
): Promise<ClaudeIdentifyResult> {
  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `あなたは植物同定の専門家です。この画像を解析して、以下のリストの中から最も一致する植物を特定してください。

【データベースの植物リスト】
${PLANT_NAMES_LIST}

以下のJSON形式のみで回答してください（前後に説明文は不要です）：
{
  "identified": true または false,
  "plantName": "特定できた場合の日本語名（上記リストに存在する名前のみ）",
  "confidence": 72から99の整数（AIの確信度）,
  "reason": "特定の根拠を1〜2文で"
}

注意：
- リストにない植物や不明な場合は identified を false にしてください
- plantName はリストの日本語名と完全に一致させてください`,
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
  const plantName = typeof obj.plantName === 'string' ? obj.plantName : undefined;
  const confidence = typeof obj.confidence === 'number' ? obj.confidence : NaN;
  const reason = typeof obj.reason === 'string' ? obj.reason : undefined;

  return { identified, plantName, confidence, reason };
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
 * Identify a plant from a base64-encoded JPEG image using Claude Vision API.
 *
 * Returns `unidentified` (never a random guess) when Claude is not confident,
 * when the returned name is not in the database, or when the confidence value
 * is missing/invalid.
 */
export async function recognizePlantWithClaude(
  base64Image: string,
  apiKey: string
): Promise<ClaudeScanOutcome> {
  const result = await callClaudeVision(base64Image, apiKey);

  if (!result.identified || !result.plantName) {
    return { status: 'unidentified', reason: result.reason };
  }

  const plant = findPlantByName(result.plantName);
  if (!plant) {
    // Claude named something not in our curated database — treat as unknown
    // rather than mapping it onto an arbitrary entry.
    return { status: 'unidentified', reason: result.reason };
  }

  const confidence =
    result.confidence >= 1 && result.confidence <= 100
      ? Math.round(result.confidence)
      : NaN;
  if (Number.isNaN(confidence)) {
    return { status: 'unidentified', reason: result.reason };
  }

  return { status: 'identified', plant, confidence, reason: result.reason };
}
