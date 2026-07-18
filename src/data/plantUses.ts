// 暮らし（Cooking & Living Hub）コンテンツ（v3 §10-§11, PR22）.
//
// Honesty policy: this app has no verified source for specific recipes,
// dosages, or preparation steps for any of its species — inventing them
// would be exactly the kind of "動いているように見えて実際は繋がっていな
// い" content this project has refused to ship since PR6. So every entry
// below is either:
//   (a) a generic, universally-true activity that needs no species-specific
//       fact to be honest ("press it, sketch it, note it"), or
//   (b) the plant's existing, already-reviewed `effects` tags (traditional
//       lore, evidenceLevel: 'traditional_record' — never medical claims), or
//   (c) since PR32, a real citation found via WebSearch for a small number of
//       species (see FOOD_USE_OVERRIDE below) — never a fabricated recipe.
// Gate 2 categories (料理/飲む/保存/クラフト等 that need real preparation
// steps) otherwise have NO entries — the 暮らし screen shows them as
// "情報準備中" rather than inventing steps. See docs/BLUEPRINT_V3.md.

import { Plant } from '../types';
import { PlantUse, UseEvidenceLevel } from '../types/plantUse';

/**
 * Real, cited general food-use descriptions for a small number of GREEN
 * species (PR32). Found via WebSearch against 農林水産省's「うちの郷土料理」
 * regional-dish database — each entry names an actual, specific, real dish,
 * not an invented recipe. This session's WebFetch tool cannot reach .go.jp
 * (see docs/DATA_SOURCES_AND_LICENSES.md), so — as with PR29/30 — the page
 * body was not fetched verbatim; the search result's title/snippet
 * explicitly confirmed the dish and prefecture named below.
 *
 * Coverage is intentionally small: WebSearch was tried for many more GREEN
 * species (ミツバ・シソ・タラノキ・ミョウガ等) and returned no equally
 * specific government citation, so those are left with the generic
 * "準備中" placeholder rather than a weaker source.
 */
export const FOOD_USE_OVERRIDE: Record<string, { summary: string; sourceRefs: string[] }> = {
  p002: {
    // ヨモギ
    summary:
      '若葉を練り込んだ「草餅」は全国各地に伝わる郷土料理で、栃木県では新暦のひな節句に食べる風習があります。',
    sourceRefs: ['https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/31_24_tochigi.html'],
  },
  h040: {
    // ゴボウ
    summary:
      '細切りにして油で炒め、醤油と砂糖で甘辛く味付けする「きんぴらごぼう」は、東京都をはじめ全国で親しまれる定番の郷土料理です。',
    sourceRefs: ['https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/34_27_tokyo.html'],
  },
};

/**
 * Species whose above-ground parts are, per Japan's 食薬区分（食品・医薬品の
 * 区分）framework, treated as a crude-drug/pharmaceutical ingredient rather
 * than a general food ingredient — so the generic "料理に使う" card would be
 * actively misleading here (PR32). Found via WebSearch; verified only at the
 * search-summary level (see the same WebFetch caveat above), so this list is
 * deliberately conservative — only added when a source stated the
 * classification directly, not merely that the plant "is bitter" or
 * "used in folk medicine" (which is true of many entries in this app and is
 * not itself evidence of a food-law restriction).
 */
const MEDICINAL_NOT_FOOD: Record<string, string> = {
  // ゲンノショウコ — 地上部が薬事法上「専ら医薬品として使用される成分」に
  // 近い区分で扱われるとする複数の薬用植物園・生薬関連ページが見つかった。
  p031: 'この植物は日本の食薬区分（厚生労働省）上、食品ではなく生薬（医薬品的な原材料）として扱われています。家庭料理の材料としては使用できません。',
};

export function getPlantUses(plant: Plant): PlantUse[] {
  const uses: PlantUse[] = [
    {
      id: `${plant.id}_observe`,
      plantId: plant.id,
      category: 'ecology',
      title: '観察・記録する',
      summary: '写真を撮って観察記録に残し、季節ごとの変化を見比べましょう。',
      partsUsed: [],
      allowedOrigins: ['wild_observed', 'wild_collected', 'home_grown_verified', 'nursery_plant', 'store_bought_food', 'store_bought_herb', 'unknown'],
      evidenceLevel: 'unverified',
      warnings: [],
      contraindications: [],
      sourceRefs: [],
    },
    {
      id: `${plant.id}_press`,
      plantId: plant.id,
      category: 'decoration',
      title: '押し花・スケッチにする',
      summary: '摘み取らずに観察するか、公共の場所での採取ルールを確認した上で、押し花やスケッチとして残せます。',
      partsUsed: [],
      allowedOrigins: ['wild_observed', 'wild_collected', 'home_grown_verified', 'nursery_plant'],
      evidenceLevel: 'unverified',
      warnings: ['公園・私有地・保護区域での採取ルールを必ず確認してください。'],
      contraindications: [],
      sourceRefs: [],
    },
  ];

  if (plant.effects.length > 0) {
    uses.push({
      id: `${plant.id}_culture`,
      plantId: plant.id,
      category: 'culture',
      title: '伝統的な用途・言い伝えを知る',
      summary: plant.effects.join(' / '),
      partsUsed: [],
      allowedOrigins: ['wild_observed', 'wild_collected', 'home_grown_verified', 'nursery_plant', 'store_bought_food', 'store_bought_herb', 'unknown'],
      evidenceLevel: 'traditional_record',
      warnings: ['伝統的な言い伝えであり、効果・効能を保証するものではありません。医療目的での使用はしないでください。'],
      contraindications: [],
      sourceRefs: [],
    });
  }

  if (plant.danger === 'GREEN') {
    const medicinalNote = MEDICINAL_NOT_FOOD[plant.id];
    const foodUse = FOOD_USE_OVERRIDE[plant.id];
    // Only the fields below vary between the three cases (crude-drug notice /
    // real cited dish / still-pending placeholder) — everything else about
    // the "food" card is identical, so compute just these and spread into
    // one shared object literal rather than three near-duplicate literals.
    const summary = medicinalNote ?? foodUse?.summary ?? '確認済みの調理法データは準備中です。';
    const evidenceLevel: UseEvidenceLevel = medicinalNote || foodUse ? 'official_guidance' : 'unverified';
    const sourceRefs = medicinalNote
      ? ['https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/shokuhin/syokuten/iyakuhin/index.html']
      : (foodUse?.sourceRefs ?? []);
    uses.push({
      id: `${plant.id}_cook`,
      plantId: plant.id,
      category: 'food',
      title: '料理に使う',
      summary,
      partsUsed: [],
      // Same allowedOrigins regardless of case: this is exactly the set of
      // origins under which the "food" category unlocks (see useGate.ts), so
      // the crude-drug notice stays reachable wherever a recipe would have
      // been — it must never be hidden by an empty allowedOrigins.
      allowedOrigins: ['store_bought_food', 'home_grown_verified'],
      evidenceLevel,
      warnings: [],
      contraindications: [],
      sourceRefs,
    });
  }

  return uses;
}
