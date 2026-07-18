// Derives PlantDefinition (§10.1) from the existing, already-vetted `Plant`
// dataset. Additive and read-only at runtime — does not replace `PLANTS` or
// touch any persisted user data (see docs/MIGRATION_PLAN.md).

import { PLANTS } from './plants';
import { DANGEROUS_LOOKALIKES } from './safety';
import { DangerLevel, Plant } from '../types';
import { SafetyLevel } from '../types/observation';
import { PlantDefinition } from '../types/plantDefinition';

/**
 * Family/genus, authored from well-established botanical knowledge (editorial
 * confidence — not cross-checked against GBIF/POWO/YList; see reviewStatus).
 * Every one of the 50 catalogued species has an entry — verified by a test.
 */
const FAMILY_GENUS: Record<string, { family: string; genus: string }> = {
  p001: { family: 'キク科 (Asteraceae)', genus: 'タンポポ属 (Taraxacum)' },
  p002: { family: 'キク科 (Asteraceae)', genus: 'ヨモギ属 (Artemisia)' },
  p003: { family: 'ドクダミ科 (Saururaceae)', genus: 'ドクダミ属 (Houttuynia)' },
  p004: { family: 'オオバコ科 (Plantaginaceae)', genus: 'オオバコ属 (Plantago)' },
  p005: { family: 'トクサ科 (Equisetaceae)', genus: 'トクサ属 (Equisetum)' },
  p006: { family: 'マメ科 (Fabaceae)', genus: 'クズ属 (Pueraria)' },
  p007: { family: 'ヒガンバナ科 (Amaryllidaceae)', genus: 'ネギ属 (Allium)' },
  p008: { family: 'セリ科 (Apiaceae)', genus: 'セリ属 (Oenanthe)' },
  p009: { family: 'トクサ科 (Equisetaceae)', genus: 'トクサ属 (Equisetum)' },
  p010: { family: 'ウコギ科 (Araliaceae)', genus: 'タラノキ属 (Aralia)' },
  p011: { family: 'キク科 (Asteraceae)', genus: 'フキ属 (Petasites)' },
  p012: { family: 'コバノイシカグマ科 (Dennstaedtiaceae)', genus: 'ワラビ属 (Pteridium)' },
  p013: { family: 'ゼンマイ科 (Osmundaceae)', genus: 'ゼンマイ属 (Osmunda)' },
  p014: { family: 'ユリ科 (Liliaceae)', genus: 'カタクリ属 (Erythronium)' },
  p015: { family: 'セリ科 (Apiaceae)', genus: 'ミツバ属 (Cryptotaenia)' },
  p016: { family: 'アブラナ科 (Brassicaceae)', genus: 'ナズナ属 (Capsella)' },
  p017: { family: 'ナデシコ科 (Caryophyllaceae)', genus: 'ハコベ属 (Stellaria)' },
  p018: { family: 'シソ科 (Lamiaceae)', genus: 'シソ属 (Perilla)' },
  p019: { family: 'タデ科 (Polygonaceae)', genus: 'イタドリ属 (Reynoutria)' },
  p020: { family: 'キキョウ科 (Campanulaceae)', genus: 'ツリガネニンジン属 (Adenophora)' },
  p021: { family: 'キキョウ科 (Campanulaceae)', genus: 'キキョウ属 (Platycodon)' },
  p022: { family: 'レンプクソウ科 (Adoxaceae)', genus: 'ニワトコ属 (Sambucus)' },
  p023: { family: 'シソ科 (Lamiaceae)', genus: 'オドリコソウ属 (Lamium)' },
  p024: { family: 'キンポウゲ科 (Ranunculaceae)', genus: 'トリカブト属 (Aconitum)' },
  p025: { family: 'キジカクシ科 (Asparagaceae)', genus: 'スズラン属 (Convallaria)' },
  p026: { family: 'スベリヒユ科 (Portulacaceae)', genus: 'スベリヒユ属 (Portulaca)' },
  p027: { family: 'キク科 (Asteraceae)', genus: 'シオン属 (Aster)' },
  p028: { family: 'タデ科 (Polygonaceae)', genus: 'ギシギシ属 (Rumex)' },
  p029: { family: 'マメ科 (Fabaceae)', genus: 'ソラマメ属 (Vicia)' },
  p030: { family: 'キク科 (Asteraceae)', genus: 'アザミ属 (Cirsium)' },
  p031: { family: 'フウロソウ科 (Geraniaceae)', genus: 'フウロソウ属 (Geranium)' },
  p032: { family: 'リンドウ科 (Gentianaceae)', genus: 'センブリ属 (Swertia)' },
  p033: { family: 'タデ科 (Polygonaceae)', genus: 'ギシギシ属 (Rumex)' },
  p034: { family: 'ワスレグサ科 (Hemerocallidaceae)', genus: 'ワスレグサ属 (Hemerocallis)' },
  p035: { family: 'キク科 (Asteraceae)', genus: 'ムカシヨモギ属 (Erigeron)' },
  p036: { family: 'ナス科 (Solanaceae)', genus: 'ハシリドコロ属 (Scopolia)' },
  p037: { family: 'セリ科 (Apiaceae)', genus: 'ドクゼリ属 (Cicuta)' },
  p038: { family: 'ヒガンバナ科 (Amaryllidaceae)', genus: 'スイセン属 (Narcissus)' },
  p039: { family: 'イヌサフラン科 (Colchicaceae)', genus: 'イヌサフラン属 (Colchicum)' },
  p040: { family: 'ヒガンバナ科 (Amaryllidaceae)', genus: 'ネギ属 (Allium)' },
  p041: { family: 'キジカクシ科 (Asparagaceae)', genus: 'ギボウシ属 (Hosta)' },
  p042: { family: 'シュロソウ科 (Melanthiaceae)', genus: 'シュロソウ属 (Veratrum)' },
  p043: { family: 'ナス科 (Solanaceae)', genus: 'チョウセンアサガオ属 (Datura)' },
  p044: { family: 'ウコギ科 (Araliaceae)', genus: 'タラノキ属 (Aralia)' },
  p045: { family: 'コウヤワラビ科 (Onocleaceae)', genus: 'クサソテツ属 (Matteuccia)' },
  p046: { family: 'イラクサ科 (Urticaceae)', genus: 'ウワバミソウ属 (Elatostema)' },
  p047: { family: 'シソ科 (Lamiaceae)', genus: 'カキドオシ属 (Glechoma)' },
  p048: { family: 'ケシ科 (Papaveraceae)', genus: 'キケマン属 (Corydalis)' },
  p049: { family: 'キンポウゲ科 (Ranunculaceae)', genus: 'キンポウゲ属 (Ranunculus)' },
  p050: { family: 'ヤマゴボウ科 (Phytolaccaceae)', genus: 'ヤマゴボウ属 (Phytolacca)' },
  p051: { family: 'サトイモ科 (Araceae)', genus: 'テンナンショウ属 (Arisaema)' },
  p052: { family: 'アケビ科 (Lardizabalaceae)', genus: 'アケビ属 (Akebia)' },
  p053: { family: 'ツユクサ科 (Commelinaceae)', genus: 'ツユクサ属 (Commelina)' },
  p054: { family: 'サトイモ科 (Araceae)', genus: 'ハンゲ属 (Pinellia)' },
  h001: { family: 'シソ科 (Lamiaceae)', genus: 'ラベンダー属 (Lavandula)' },
  h002: { family: 'シソ科 (Lamiaceae)', genus: 'アキギリ属 (Salvia)' },
  h003: { family: 'シソ科 (Lamiaceae)', genus: 'イブキジャコウソウ属 (Thymus)' },
  h004: { family: 'シソ科 (Lamiaceae)', genus: 'メボウキ属 (Ocimum)' },
  h005: { family: 'シソ科 (Lamiaceae)', genus: 'ハッカ属 (Mentha)' },
  h006: { family: 'キク科 (Asteraceae)', genus: 'シカギク属 (Matricaria)' },
  h007: { family: 'シソ科 (Lamiaceae)', genus: 'アキギリ属 (Salvia)' },
  h008: { family: 'シソ科 (Lamiaceae)', genus: 'ハナハッカ属 (Origanum)' },
  h009: { family: 'セリ科 (Apiaceae)', genus: 'ウイキョウ属 (Foeniculum)' },
  h010: { family: 'セリ科 (Apiaceae)', genus: 'イノンド属 (Anethum)' },
  h011: { family: 'セリ科 (Apiaceae)', genus: 'コエンドロ属 (Coriandrum)' },
  h012: { family: 'ショウガ科 (Zingiberaceae)', genus: 'ウコン属 (Curcuma)' },
  h013: { family: 'クスノキ科 (Lauraceae)', genus: 'ニッケイ属 (Cinnamomum)' },
  h014: { family: 'ショウガ科 (Zingiberaceae)', genus: 'ショウズク属 (Elettaria)' },
  h015: { family: 'フトモモ科 (Myrtaceae)', genus: 'フトモモ属 (Syzygium)' },
  h016: { family: 'シキミ科 (Schisandraceae)', genus: 'シキミ属 (Illicium)' },
  h017: { family: 'アヤメ科 (Iridaceae)', genus: 'クロッカス属 (Crocus)' },
  h018: { family: 'ラン科 (Orchidaceae)', genus: 'バニラ属 (Vanilla)' },
  h019: { family: 'イネ科 (Poaceae)', genus: 'オガルカヤ属 (Cymbopogon)' },
  h020: { family: 'セリ科 (Apiaceae)', genus: 'オランダゼリ属 (Petroselinum)' },
  h021: { family: 'セリ科 (Apiaceae)', genus: 'ボウフウゼリ属 (Anthriscus)' },
  h022: { family: 'キク科 (Asteraceae)', genus: 'ヨモギ属 (Artemisia)' },
  h023: { family: 'マメ科 (Fabaceae)', genus: 'アスパラサス属 (Aspalathus)' },
  h024: { family: 'キク科 (Asteraceae)', genus: 'ムラサキバレンギク属 (Echinacea)' },
  h025: { family: 'レンプクソウ科 (Adoxaceae)', genus: 'ニワトコ属 (Sambucus)' },
  h026: { family: 'ショウガ科 (Zingiberaceae)', genus: 'ショウガ属 (Zingiber)' },
  h027: { family: 'ヒガンバナ科 (Amaryllidaceae)', genus: 'ネギ属 (Allium)' },
  h028: { family: 'シソ科 (Lamiaceae)', genus: 'ハナハッカ属 (Origanum)' },
  h029: { family: 'ヒガンバナ科 (Amaryllidaceae)', genus: 'ネギ属 (Allium)' },
  h030: { family: 'セリ科 (Apiaceae)', genus: 'ミツバグサ属 (Pimpinella)' },
  h031: { family: 'セリ科 (Apiaceae)', genus: 'ヒメウイキョウ属 (Carum)' },
  h032: { family: 'セリ科 (Apiaceae)', genus: 'クミン属 (Cuminum)' },
  h033: { family: 'シソ科 (Lamiaceae)', genus: 'コウスイハッカ属 (Melissa)' },
  h034: { family: 'ニクズク科 (Myristicaceae)', genus: 'ニクズク属 (Myristica)' },
  h035: { family: 'ナス科 (Solanaceae)', genus: 'トウガラシ属 (Capsicum)' },
  h036: { family: 'アブラナ科 (Brassicaceae)', genus: 'アブラナ属 (Brassica)' },
  h037: { family: 'ショウガ科 (Zingiberaceae)', genus: 'ショウガ属 (Zingiber)' },
  h038: { family: 'アブラナ科 (Brassicaceae)', genus: 'ワサビ属 (Eutrema)' },
  h039: { family: 'セリ科 (Apiaceae)', genus: 'シシウド属 (Angelica)' },
  h040: { family: 'キク科 (Asteraceae)', genus: 'ゴボウ属 (Arctium)' },
  h041: { family: 'シナノキ科 (Malvaceae)', genus: 'ツナソ属 (Corchorus)' },
  h042: { family: 'クワ科 (Moraceae)', genus: 'クワ属 (Morus)' },
  h043: { family: 'ミカン科 (Rutaceae)', genus: 'カンキツ属 (Citrus)' },
  h044: { family: 'ミカン科 (Rutaceae)', genus: 'サンショウ属 (Zanthoxylum)' },
  h045: { family: 'イラクサ科 (Urticaceae)', genus: 'イラクサ属 (Urtica)' },
  h046: { family: 'ムラサキ科 (Boraginaceae)', genus: 'ルリジサ属 (Borago)' },
  h047: { family: 'シソ科 (Lamiaceae)', genus: 'ヤナギハッカ属 (Hyssopus)' },
  h048: { family: 'マメ科 (Fabaceae)', genus: 'コロハ属 (Trigonella)' },
};

/**
 * A handful of plants have explicit, structured toxic-part lists already
 * stated in their existing `warningNote` text — extracted verbatim rather
 * than parsed heuristically. Every other plant gets an empty array (no parts
 * asserted beyond what the existing warningNote/description already says).
 */
const TOXIC_PARTS_OVERRIDE: Record<string, string[]> = {
  p022: ['生の実', '葉', '樹皮'], // ニワトコ — stated in warningNote
  p025: ['全草', '根', '花', '実', '（生けた）水'], // スズラン — stated in warningNote
};

function toSafetyLevel(danger: DangerLevel): SafetyLevel {
  if (danger === 'RED') return 'high_risk';
  if (danger === 'YELLOW') return 'caution';
  return 'general_observation';
  // 'avoid_contact' is not yet used — our 3-tier GREEN/YELLOW/RED data has no
  // distinct "avoid touching but not otherwise risky" category today.
}

/** Look-alike graph, built from safety.ts in both directions (a→b implies b is also worth flagging against a). */
function buildLookalikeIdMap(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a)!.add(b);
  };
  for (const [plantId, risks] of Object.entries(DANGEROUS_LOOKALIKES)) {
    for (const risk of risks) {
      if (!risk.inDbId) continue;
      add(plantId, risk.inDbId);
      add(risk.inDbId, plantId);
    }
  }
  return map;
}

const LOOKALIKE_ID_MAP = buildLookalikeIdMap();

function toPlantDefinition(plant: Plant): PlantDefinition {
  const fg = FAMILY_GENUS[plant.id];
  const warningNotes = plant.warningNote ? [plant.warningNote] : [];

  return {
    id: plant.id,
    taxonomy: {
      scientificName: plant.nameLatin,
      japaneseNames: [plant.name],
      englishNames: [plant.nameEn],
      synonyms: [],
      family: fg?.family,
      genus: fg?.genus,
      taxonIds: {}, // real external DB IDs require API access — see PR14
    },
    classification: {
      category: plant.category,
    },
    morphology: {}, // intentionally sparse — see IMPLEMENTATION_ROADMAP.md
    ecology: { habitat: plant.habitat },
    phenology: { season: plant.season },
    safety: {
      level: toSafetyLevel(plant.danger),
      toxicParts: TOXIC_PARTS_OVERRIDE[plant.id] ?? [],
      confusedWith: (DANGEROUS_LOOKALIKES[plant.id] ?? []).map((r) => r.name),
      handlingWarnings: warningNotes,
      ingestionWarnings: warningNotes,
      officialIncidentNotes: [], // no public-agency-sourced data attached yet
      sourceRefs: [],
    },
    culturalUses: plant.effects.map((label) => ({
      label,
      evidenceStatus: 'traditional_folklore' as const,
    })),
    lookalikeIds: [...(LOOKALIKE_ID_MAP.get(plant.id) ?? [])],
    sourceRefs: [],
    reviewStatus: 'editorial',
  };
}

export const PLANT_DEFINITIONS: PlantDefinition[] = PLANTS.map(toPlantDefinition);

export function getPlantDefinitionById(id: string): PlantDefinition | undefined {
  return PLANT_DEFINITIONS.find((d) => d.id === id);
}
