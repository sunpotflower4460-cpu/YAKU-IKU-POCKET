// Look-alike / toxicity rule engine (PR6).
//
// This data — NOT an LLM — is the source of truth for "this observation could
// be confused with something dangerous". It is deliberately conservative: when
// an otherwise-edible plant has a toxic look-alike, we surface a warning so a
// misidentification can never be treated as a safe-to-eat result.
//
// Sources to formalise in DATA_SOURCES_AND_LICENSES.md: 厚生労働省「自然毒のリス
// ク」・消費者庁の食中毒注意喚起。現状は編集部レベル(editorial)。

export interface LookalikeRisk {
  /** Display name of the dangerous look-alike. */
  name: string;
  /** Id in our own dataset, if the look-alike is also catalogued. */
  inDbId?: string;
  severity: 'caution' | 'high_risk';
  /** Short, actionable note (how they are confused / how to tell apart). */
  note: string;
}

/**
 * Keyed by the plant the user is likely looking at. Each entry lists the
 * dangerous species it is commonly confused with.
 */
export const DANGEROUS_LOOKALIKES: Record<string, LookalikeRisk[]> = {
  // ノビル — resembles the highly toxic スイセン and スズラン.
  p007: [
    {
      name: 'スイセン',
      inDbId: 'p038', // catalogued PR24
      severity: 'high_risk',
      note: '葉がよく似ています。ノビル特有のネギ臭が無ければ口にしないでください。スイセンは嘔吐・けいれん等を起こします。',
    },
    {
      name: 'スズラン',
      inDbId: 'p025',
      severity: 'high_risk',
      note: '葉が似ており、強心配糖体による死亡事故例があります。',
    },
    {
      name: 'イヌサフラン',
      inDbId: 'p039', // catalogued PR24
      severity: 'high_risk',
      note: 'ヒガンバナ科の細長い葉と混同されることがあります。コルヒチンによる死亡事故例があります。',
    },
  ],
  // セリ — resembles the deadly ドクゼリ and the naturalised ドクニンジン.
  p008: [
    {
      name: 'ドクゼリ',
      inDbId: 'p037', // catalogued PR24
      severity: 'high_risk',
      note: '猛毒のドクゼリと外見が非常に似ています。水辺では専門家の確認なしに採取・摂取しないでください。',
    },
    {
      name: 'ドクニンジン',
      inDbId: 'p065', // catalogued PR27
      severity: 'high_risk',
      note: 'ニンジンやパセリに似た葉を持つ帰化植物の猛毒種です。茎の赤紫の斑点の有無を確認し、不安があれば口にしないでください。',
    },
  ],
  // ヨモギ — confused with the deadly トリカブト (in our dataset).
  p002: [
    {
      name: 'トリカブト',
      inDbId: 'p024',
      severity: 'high_risk',
      note: '猛毒のトリカブトやニリンソウと若葉が似ており、混同による死亡事故が報告されています。',
    },
  ],
  // ミツバ — leaves resemble the naturalised ドクニンジン.
  p015: [
    {
      name: 'ドクニンジン',
      inDbId: 'p065', // catalogued PR27
      severity: 'high_risk',
      note: 'パセリのような葉を持つ帰化植物の猛毒種と混同されることがあります。見慣れない場所に生えているセリ科の草を自己判断で採らないでください。',
    },
  ],
  // ウド — young shoots resemble the deadly ハシリドコロ in early spring.
  p010: [
    {
      name: 'ハシリドコロ',
      inDbId: 'p036', // catalogued PR24
      severity: 'high_risk',
      note: '春先の若芽がよく似ています。トロパンアルカロイドによる中毒死亡事故が報告されています。',
    },
  ],
  // フキ — young shoots (フキノトウ以前の若芽) resemble the deadly ハシリドコロ.
  p011: [
    {
      name: 'ハシリドコロ',
      inDbId: 'p036', // catalogued PR24
      severity: 'high_risk',
      note: '春先の若芽がよく似ています。トロパンアルカロイドによる中毒死亡事故が報告されています。',
    },
  ],
  // ギョウジャニンニク — young leaves resemble the deadly バイケイソウ.
  p040: [
    {
      name: 'バイケイソウ',
      inDbId: 'p042', // catalogued PR26
      severity: 'high_risk',
      note: '春の若葉が非常によく似ています。ギョウジャニンニクには強いニンニク臭がありますが、バイケイソウには臭いがありません。誤食による中毒死亡事故が報告されています。',
    },
  ],
  // オオバギボウシ（ウルイ） — young leaves resemble the deadly バイケイソウ.
  p041: [
    {
      name: 'バイケイソウ',
      inDbId: 'p042', // catalogued PR26
      severity: 'high_risk',
      note: '春の若葉が非常によく似ています。葉脈の走り方や毛の有無を慎重に確認し、不安があれば採らないでください。',
    },
  ],
  // ミョウガ — young leaves resemble the deadly イヌサフラン.
  h037: [
    {
      name: 'イヌサフラン',
      inDbId: 'p039',
      severity: 'high_risk',
      note: '春に出る若葉が似ていることがあります。栽培品以外の見慣れない葉を食用にする際は注意してください。',
    },
  ],
  // ゴボウ — the root is confused with the deadly チョウセンアサガオ, and with a
  // toxic look-alike weed sharing part of its Japanese name.
  h040: [
    {
      name: 'チョウセンアサガオ',
      inDbId: 'p043', // catalogued PR26
      severity: 'high_risk',
      note: '根がゴボウと似ており、家庭菜園での混同誤食事故が報告されています。',
    },
    {
      name: 'ヨウシュヤマゴボウ',
      inDbId: 'p050', // catalogued PR26
      severity: 'high_risk',
      note: '名前が紛らわしいだけで別種ですが、市販の「山ごぼう漬け」はモリアザミ等の別植物であり、野生のヨウシュヤマゴボウの根とは無関係です。全草有毒のため誤って採取しないでください。',
    },
  ],
  // モロヘイヤ — leaves are confused with the deadly チョウセンアサガオ.
  h041: [
    {
      name: 'チョウセンアサガオ',
      inDbId: 'p043', // catalogued PR26
      severity: 'high_risk',
      note: '葉の形がモロヘイヤと似ており、家庭菜園での混同誤食事故が報告されています。',
    },
  ],
};

/** Return the dangerous look-alikes for a plant (empty if none catalogued). */
export function getSafetyWarnings(plantId: string): LookalikeRisk[] {
  return DANGEROUS_LOOKALIKES[plantId] ?? [];
}

/** True when a plant has at least one high-risk look-alike. */
export function hasDangerousLookalike(plantId: string): boolean {
  return getSafetyWarnings(plantId).some((r) => r.severity === 'high_risk');
}
