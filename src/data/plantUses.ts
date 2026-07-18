// 暮らし（Cooking & Living Hub）コンテンツ（v3 §10-§11, PR22）.
//
// Honesty policy: this app has no verified source for specific recipes,
// dosages, or preparation steps for any of its 50 species — inventing them
// would be exactly the kind of "動いているように見えて実際は繋がっていな
// い" content this project has refused to ship since PR6. So every entry
// below is either:
//   (a) a generic, universally-true activity that needs no species-specific
//       fact to be honest ("press it, sketch it, note it"), or
//   (b) the plant's existing, already-reviewed `effects` tags (traditional
//       lore, evidenceLevel: 'traditional_record' — never medical claims).
// Gate 2 categories (料理/飲む/保存/クラフト等 that need real preparation
// steps) intentionally have NO entries yet — the 暮らし screen shows them
// as "情報準備中" rather than inventing steps. See docs/BLUEPRINT_V3.md.

import { Plant } from '../types';
import { PlantUse } from '../types/plantUse';

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
    uses.push({
      id: `${plant.id}_cook`,
      plantId: plant.id,
      category: 'food',
      title: '料理に使う',
      summary: '確認済みの調理法データは準備中です。',
      partsUsed: [],
      allowedOrigins: ['store_bought_food', 'home_grown_verified'],
      evidenceLevel: 'unverified',
      warnings: [],
      contraindications: [],
      sourceRefs: [],
    });
  }

  return uses;
}
