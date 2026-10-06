# YAKU Global Plant Brain — Identification & Benchmark

## 1. 正式パラダイム

名称: **Active Evidence Identification**

一発でspeciesを返すclassifierではなく、

```text
観察
↓
候補生成
↓
不足証拠の特定
↓
次に見るべき器官/特徴を要求
↓
再評価
↓
安全なtaxonomic rankで停止
```

する。

## 2. Identification Pipeline

```text
Capture
↓
Image Quality Gate
↓
Plant / Non-Plant Router
↓
Plant Group Router
↓
Vision Ensemble
↓
Taxonomy Resolver
↓
Regional / Ecological Prior
↓
Season / Phenology Prior
↓
Morphology Evidence
↓
Dangerous Lookalike Graph
↓
Conflict Detector
↓
Next Best Observation
↓
Safe Taxonomic Resolution
↓
Persist IdentificationState
```

## 3. Image / Subject Quality

最低限判定する。

- non-plant
- multiple plants
- blurred
- too dark / overexposed
- too distant
- insufficient diagnostic structure
- processed/dried material
- mushroom/lichen/algae等の別scope
- artificial plant/object

不良入力へ無理にspecies候補を返さない。

## 4. Vision Ensemble

候補Provider:

- Pl@ntNet
- Plant.id等のsecondary commercial engine
- future YAKU Vision
- future specialist models
- VLM reasoning specialist

Provider出力:

```ts
interface ProviderCandidate {
  provider: string;
  modelVersion: string;
  taxonExternalId?: string;
  rawScore?: number;
  rank: string;
}
```

異なるProviderのconfidenceを単純平均しない。YAKU Benchmarkで各Providerをcalibrateし、YAKU内部Evidenceへ変換する。

## 5. Specialist Router

世界全植物を1 general modelだけで処理しない。

```text
General Plant Router
├ grasses
├ sedges/rushes
├ ferns
├ trees
├ orchids
├ cacti/succulents
├ aquatic plants
├ seedlings
├ cultivars/hybrids
└ general vascular plant
```

植物群ごとに必要撮影器官・形態質問・専門modelを変える。

## 6. Multi-organ Evidence

現行最大5写真設計を活かす。

推奨PhotoOrgan:

- whole plant
- leaf top
- leaf underside
- flower front
- flower side
- fruit/seed
- bark
- stem
- special diagnostic organ

「同じ個体」の複数写真を前提にする。

## 7. Morphology Evidence

Vision scoreとは独立して、

```text
leaf arrangement
leaf margin/shape
hairs
stem shape
sap/latex
thorn
petal count
ligule/sheath
sori
fruit structure
scent (user observation)
```

等をStructured Traitとして扱う。

ユーザー回答は `yes / no / unknown` とし、unknownを強制選択させない。

## 8. Next Best Observation (NBO)

候補集合A/B/Cに対し、最も識別情報量が大きい器官/traitを要求する。

例:

```text
A vs B
決定的差 = 葉裏の毛
→ 「葉裏を撮影してください」
```

NBOは「追加写真の枚数を増やす」ためではなく、**最小観察回数で最大の不確実性低減**を目指す。

## 9. Geographic / Ecological Priors

soft priorとして使用する。

- occurrence
- native/introduced/naturalized/invasive/cultivated status
- season
- phenology
- altitude
- climate
- habitat

`region outside known range => probability 0`は禁止。外来・逸出・新分布を考慮する。

## 10. Safe Taxonomic Resolution

```text
十分なspecies evidence
→ species

species未解決、genusは強い
→ Genus sp.

genus未解決、familyは強い
→ Family

不十分
→ unresolved / unidentified
```

現在の `IdentificationState` は引き続きconfirmation stateとして利用し、taxonomic resolutionとは別軸にする。

```text
Taxonomic resolution: species/genus/family/unresolved
Verification state: candidates/user_selected/community_supported/expert_verified
```

## 11. Safety Critical Identification

危険な誤同定pairが候補に含まれる場合は別モードへ移る。

要求できるもの:

- multi-organ必須
- morphology confirmation
- higher calibrated threshold
- toxic-lookalike specialist
- species answer withholding
- expert review

ユーザーが食用・薬用目的を示したからといって「安全確認完了」にはしない。アプリは摂取可否判定器にならない。

## 12. Confusion Graph

```ts
interface ConfusionEdge {
  taxonA: string;
  taxonB: string;
  context?: string;
  severity: 'normal' | 'high' | 'critical';
  knownIncidents?: string[];
  distinguishingTraits?: string[];
  sourceRefs: string[];
}
```

実事故Evidenceがあるpairは識別threshold・NBOに反映する。

## 13. YAKU-ID Global Benchmark Suite

単一accuracyを禁止する。最低限以下のSuiteを持つ。

| Suite | 目的 |
|---|---|
| Standard Species | 通常条件 |
| Multi-organ | 複数器官統合 |
| Active Identification | NBOの効率 |
| Taxonomic Hierarchy | species/genus/family |
| Open World | 未学習・未知拒否 |
| Geographic Shift | 地域変化 |
| Seasonal Shift | 生育段階 |
| Long Tail | 希少種 |
| Dangerous Confusion | 毒草誤認 |
| Non-Plant/Bad Input | 異常入力 |

## 14. Metrics

### Accuracy / hierarchy

- Species Top-1
- Species Top-3
- Genus Accuracy
- Family Accuracy
- Macro F1
- Tail Species Accuracy
- Taxonomic Distance Error

### Open-set

- AUROC
- AUPR
- FPR95
- OSCR

### Calibration

- Global ECE
- Classwise ECE
- Tail ECE
- Dangerous-taxa ECE
- Brier Score
- NLL

### Selective Prediction

- Risk-Coverage Curve
- Accuracy at fixed coverage
- Coverage at fixed accuracy
- optional AUGRC

### Safety

- **Dangerous False-Safe Rate**
- Toxic Lookalike Recall
- Dangerous Pair Abstention Quality
- statistical confidence interval / upper bound

0 errors observedでも「誤認率0%」とは表現しない。

## 15. Benchmark Ground Truth

### Gold

expert determination + diagnostic evidence + voucher、可能ならDNA。

### Silver

複数expert consensus +十分な写真+taxonomy consistency。

### Bronze

community identification等。headline benchmarkには使用しない。

## 16. Benchmark Data Hygiene

- same individual leakageを防ぐ
- same observation session leakageを防ぐ
- location/time leakageを管理
- perceptual hash / embeddingsでnear duplicate排除
- source overlapを監査
- Public Dev / Hidden Global / Rotating Fresh Testを分離
- yearly prospective field testを追加

## 17. Regional / Taxonomic Stratification

地域:

- East Asia
- South Asia
- Southeast Asia
- Europe
- North America
- South America
- Africa
- Oceania / Pacific

環境:

- tropical
- temperate
- arid
- alpine
- wetland
- coastal
- urban
- agricultural

taxonomic group:

- bryophyte scope if supported
- fern
- gymnosperm
- monocot
- eudicot
- family-level buckets

Provider coverage外もBenchmarkへ含め、「対象外」を正直に測る。

## 18. Release Gate

新しいProvider/model/ranking policyは自動本番投入しない。

```text
Candidate
↓
Full Benchmark
↓
Safety regression?
↓
Calibration regression?
↓
Region regression?
↓
Tail regression?
↓
PASS
↓
Production
```

平均accuracy向上とSafety悪化を交換しない。

## 19. Error Taxonomy

最低限:

```text
E01 visual similarity
E02 missing diagnostic organ
E03 image quality
E04 geographic prior failure
E05 seasonal mismatch
E06 taxonomy mismatch
E07 synonym resolution
E08 unknown forced prediction
E09 rare class bias
E10 dangerous lookalike
E11 cultivar/hybrid
E12 multi-species contamination
```

Benchmarkは成績表ではなく、次の改善箇所を決める弱点発見器として運用する。
