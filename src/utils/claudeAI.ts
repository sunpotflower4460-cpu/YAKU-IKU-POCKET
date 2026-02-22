import { PLANTS } from '../data/plants';
import { Plant } from '../types';
import { ScanResult } from './mockAI';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

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

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Claude API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text: string = data?.content?.[0]?.text ?? '';

  // Extract JSON block from response
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in Claude response: ${text}`);
  }

  return JSON.parse(jsonMatch[0]) as ClaudeIdentifyResult;
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
 * Falls back to a random plant if Claude cannot identify one in the database.
 */
export async function recognizePlantWithClaude(
  base64Image: string,
  discoveredIds: string[],
  apiKey: string
): Promise<ScanResult> {
  const result = await callClaudeVision(base64Image, apiKey);

  let plant: Plant | undefined;

  if (result.identified && result.plantName) {
    plant = findPlantByName(result.plantName);
  }

  // Fallback: random plant from database
  if (!plant) {
    plant = PLANTS[Math.floor(Math.random() * PLANTS.length)];
  }

  const confidence =
    result.confidence && result.confidence >= 1 && result.confidence <= 100
      ? result.confidence
      : Math.floor(72 + Math.random() * 27);

  const isNewDiscovery = !discoveredIds.includes(plant.id);

  return { plant, confidence, isNewDiscovery };
}
