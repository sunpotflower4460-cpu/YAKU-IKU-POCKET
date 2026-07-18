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
  // セリ — resembles the deadly ドクゼリ.
  p008: [
    {
      name: 'ドクゼリ',
      inDbId: 'p037', // catalogued PR24
      severity: 'high_risk',
      note: '猛毒のドクゼリと外見が非常に似ています。水辺では専門家の確認なしに採取・摂取しないでください。',
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
};

/** Return the dangerous look-alikes for a plant (empty if none catalogued). */
export function getSafetyWarnings(plantId: string): LookalikeRisk[] {
  return DANGEROUS_LOOKALIKES[plantId] ?? [];
}

/** True when a plant has at least one high-risk look-alike. */
export function hasDangerousLookalike(plantId: string): boolean {
  return getSafetyWarnings(plantId).some((r) => r.severity === 'high_risk');
}
