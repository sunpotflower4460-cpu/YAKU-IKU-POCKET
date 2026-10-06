# YAKU Global Plant Brain — Medicinal Evidence & Safety

## 1. Medicinal Brainの基本

「植物ごとの効能一覧」を作らない。

```text
Taxon
↓
Medicinal Material
↓
Preparation
↓
Traditional / Pharmacopoeial / Regulatory / Scientific Claims
↓
Chemical Evidence
↓
Human Evidence
↓
Safety Evidence
```

`effects: string[]` のようなflat fieldは最終正本にはしない。

## 2. Evidenceを混ぜない

永久ルール:

```text
Traditional use
≠ Pharmacopoeial quality standard
≠ Biological activity
≠ Clinical efficacy
≠ Regulatory approval

Molecular activity
≠ Cell result
≠ Animal result
≠ Human result

No evidence
≠ Evidence of no effect
```

## 3. 薬草Identity Layer

中心候補:

- Kew MPNS — medicinal plant/name/material reference bridge
- Japanese Pharmacopoeia / Non-JPS
- EMA herbal monographs
- European Pharmacopoeia
- USP Herbal Medicines Compendium
- Chinese Pharmacopoeia
- PCIM&H Ayurveda/Siddha/Unani etc.

薬局方は主にidentity/qualityを示す。薬局方収載をclinical efficacyの証明として扱わない。

## 4. Quality Layer

Material/Preparationに対し、

- identity
- foreign matter
- moisture
- ash
- marker compounds
- assay
- pesticide
- heavy metal
- microorganism
- contaminant
- storage

を持つ。

Analytical marker ≠ active constituent を区別する。

```ts
type ConstituentRole =
  | 'active_constituent'
  | 'analytical_marker'
  | 'quality_marker'
  | 'toxic_marker'
  | 'unknown_role';
```

## 5. Clinical Evidence Brain

中心単位はPaperではなくTrial。

```text
Clinical Question (PICOT)
↓
Trial
├ registry
├ protocol
├ primary publication
├ secondary publications
└ results
↓
Outcome Result
↓
Risk of Bias
↓
Systematic Review / Meta-analysis
↓
Certainty (GRADE-style)
↓
Regulatory Assessment
```

## 6. PICOT

```ts
interface ClinicalQuestion {
  id: string;
  materialId: string;
  preparationId?: string;
  population: string;
  indication: string;
  comparator: string;
  outcome: string;
  measurementInstrument?: string;
  timepoint: string;
}
```

Evidence certaintyはPlant単位ではなくQuestion/Outcome単位。

## 7. Herbal Intervention Fingerprint

同一speciesでも試験製品を無条件にまとめない。

```text
Botanical identity
Plant part
Preparation
Extraction solvent
Drug-extract ratio
Standardization
Marker compounds
Manufacturer
Product/batch
Dose
Frequency
Route
Duration
```

Fingerprint差が大きい研究はintervention heterogeneityとして保持する。

## 8. Trial / Publication Relation

```text
Trial A
├ Paper 1 primary
├ Paper 2 subgroup
├ Paper 3 safety
└ Paper 4 follow-up
```

4 papersを4 trialsと数えない。

Explicit registry ID linkageとinferred linkageを区別する。

## 9. Study Quality

RCT:
- RoB 2等のresult-specific risk-of-bias

Non-randomized:
- ROBINS-I等

Systematic review:
- protocol
- search completeness
- risk-of-bias assessment
- synthesis method
- publication bias
- certainty assessment

PRISMA準拠 = high certaintyとはしない。

## 10. Evidence Synthesis

```ts
interface EvidenceSynthesis {
  clinicalQuestionId: string;
  includedTrialIds: string[];

  synthesisType: 'narrative' | 'meta_analysis' | 'network_meta_analysis';
  pooledEffect?: unknown;
  heterogeneity?: unknown;

  riskOfBiasSummary: string;
  inconsistency: string;
  indirectness: string;
  imprecision: string;
  publicationBias: string;

  certainty: 'high' | 'moderate' | 'low' | 'very_low';
  lastEvaluatedAt: string;
}
```

「新論文が追加された」と「結論が変化した」を分離する。

## 11. Regulatory Assessment

```ts
interface RegulatoryAssessment {
  jurisdiction: string;
  authority: string;

  category:
    | 'traditional_use'
    | 'well_established_use'
    | 'approved_drug'
    | 'not_authorized'
    | 'withdrawn'
    | 'other';

  indication?: string;
  materialId?: string;
  preparationId?: string;

  assessmentDate?: string;
  sourceRef: string;
}
```

EMA Traditional Useを「臨床有効性確立」へ変換しない。

## 12. Safety Brain

安全性を一つの`dangerLevel`へ潰さない。

```text
Safety
├ Intrinsic Toxicity
├ Dose / Exposure
├ Organ Toxicity
├ Herb–Drug Interaction
├ Herb–Herb Interaction
├ Pregnancy
├ Lactation
├ Pediatrics
├ Older adults
├ Hepatic impairment
├ Renal impairment
├ Allergy
├ Identification Risk
├ Product Quality
└ Pharmacovigilance
```

現行GREEN/YELLOW/REDはProduct UI向けのProjectionとして保持し、正本は多軸Safety Graphへ移行する。

## 13. Hazard vs Risk

```text
Hazard = 危険になり得る性質
Risk = 実際の使用条件で危害が起こる可能性
```

「toxic compoundあり」から「このPreparationは危険」と直接推論しない。

## 14. Safety Claim

```ts
interface SafetyClaim {
  id: string;
  subjectType: string;
  subjectId: string;

  hazardType: string;
  population?: string;
  preparationId?: string;
  doseContext?: string;
  duration?: string;
  route?: string;

  effect: string;
  severity?: string;
  reversibility?: string;

  evidenceType: string;
  causalityStatus:
    | 'unknown'
    | 'suspected'
    | 'possible'
    | 'probable'
    | 'established';

  sourceRefs: string[];
}
```

## 15. Special Population

```text
general adult
pregnancy
lactation
infant
child
adolescent
older adult
hepatic impairment
renal impairment
```

成人データを小児・妊娠等へ自動外挿しない。

`NO_DATA` を `SAFE` に変換しない。

## 16. Interaction Graph

```text
Herbal Material
↓
Compound
↓
CYP / transporter / receptor / target
↓
Drug
↓
PK or PD consequence
```

Evidence level:

```text
mechanistic potential
in vitro
human PK
case report
clinical outcome
regulatory warning
```

理論的相互作用と人で確認された相互作用を区別する。

## 17. Organ Toxicity

Liver / kidney / cardiac / neurological等を独立軸で持つ。

Case reportが存在することとcausality establishedを区別する。Preparation / adulteration / alcohol / dose / susceptibility等のcontextを失わない。

## 18. Poisoning Incident Graph

```ts
interface PoisoningIncident {
  id: string;
  toxicTaxonId: string;
  mistakenForTaxonId?: string;

  date?: string;
  country?: string;
  region?: string;

  exposedCount?: number;
  hospitalizedCount?: number;
  deathCount?: number;

  exposureRoute?: string;
  plantPart?: string;
  confirmationMethod?: string;

  sourceRef: string;
}
```

Identification BrainのSafety Priorへ接続する。

## 19. Product Safety

Taxon SafetyとCommercial Product Safetyを分ける。

```ts
interface ProductSafetyAlert {
  id: string;
  productName: string;
  manufacturer?: string;

  claimedIngredients: string[];
  detectedIngredients: string[];

  issue:
    | 'adulteration'
    | 'contamination'
    | 'mislabeling'
    | 'microbial'
    | 'heavy_metal'
    | 'pesticide'
    | 'other';

  jurisdiction: string;
  authority: string;
  action?: string;
  alertDate?: string;
  sourceRef: string;
}
```

## 20. Pharmacovigilance

VigiAccess、CAERS、JADER等のreportはSignalとして扱い、因果関係を自動確定しない。

Report countだけで製品同士の安全性比較をしない。

```text
Signal ≠ Causality
```

## 21. Processing / Cultivation

```text
Cultivation
↓
Harvest
↓
Raw Material Batch
↓
Drying
↓
Storage
↓
Preparation
↓
Chemical Profile
↓
Clinical / Safety Evidence
```

乾燥・保存・煎じ・浸出・抽出・蒸留・発酵・調理をchemical transformation eventとして扱う。

## 22. Tradition Brain

Knowledge Traditionを分離する。

- Kampo
- TCM
- Ayurveda
- Siddha
- Unani
- Sowa-Rigpa
- Japanese folk medicine
- European historical herbalism
- regional ethnomedicine
- community-specific knowledge

Original terminologyを保持し、Biomedical ontologyへ一対一変換しない。

## 23. Three Truth Layers

### Cultural Truth
その文化・communityではどう理解/利用されてきたか。

### Scientific Evidence
現代科学では何が確認されているか。

### Regulatory Status
各法域でどう規制/評価されているか。

3つが異なっていてよい。AIは「結局どれが正しいか」に無理に潰さない。

## 24. Benefit–Risk

Clinical BenefitとSafetyを別Graphで評価し、表示時に並べる。

```text
Clinical Benefit Evidence
          │
          ▼
  Evidence Explanation
          ▲
          │
Safety Evidence
```

個別医療判断や服用推奨を自動化するためのengineにはしない。
