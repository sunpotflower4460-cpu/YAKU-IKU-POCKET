# YAKU Global Plant Brain — Overview

> Status: **PROPOSED / LONG-TERM SOURCE OF TRUTH**  
> Last updated: 2026-10-06  
> Scope: 薬育ポケットの世界植物・薬草知識基盤  
> Release relationship: App Store初回公開については `../APP_STORE_RELEASE_FINALIZATION.md` を優先する。本ディレクトリはリリース後を含む中長期設計の正本。  
> Core principle: **「全部知っている」ではなく、「人類が現在どこまで知っているかを、根拠・時点・権利・不確実性を失わず辿れる」システムを作る。**

## 1. 最終目標

薬育ポケットは最終的に、次の2つを同時に満たす。

### 1.1 Global Plant Identification

世界中の植物について、分類学上の植物へアクセスでき、写真だけでなく複数画像・器官・形態・地域・季節・生態を統合して候補を絞る。種まで判断できなければ属・科で安全に止まり、未知種・未学習種・hybrid/cultivarを既知種へ無理に押し込まない。危険な類似種が存在するときは必要証拠量を増やし、必要なら専門家・標本・DNAへエスカレーションできる。

### 1.2 Herbal Intelligence

薬用植物について、植物名、生薬名、使用部位、加工状態、伝統利用、薬局方、品質規格、成分、生合成、標的、作用機序、前臨床、臨床Evidence、安全性、相互作用、誤同定事故、加工・保存・栽培、文化、法規、保全、出典・権利までをEvidence Chainとして接続する。

## 2. 永久原則

1. **AIはEvidenceではない。** AIは検索・抽出・整理・比較・説明を担当し、事実の発生源にはならない。
2. **ClaimはAtomicにする。** 植物ページ単位で「出典あり」にせず、taxonomy / morphology / toxicity / traditional use / chemistry / clinical等のClaimごとにSourceを持つ。
3. **Contextを失わない。** Same species ≠ same material、same material ≠ same preparation、compound activity ≠ plant efficacy、traditional use ≠ clinical efficacy。
4. **分からないを正式な状態にする。** species / genus / family / candidate set / unknown / unresolved / out-of-scopeを許可する。
5. **SafetyではFalse Safeを最重視する。** 危険植物を安全側へ確定する誤りを、通常のspecies誤認より強く罰する。
6. **知識を上書きしない。** Sourceが変わったらAssertionを追加し、現在Viewを再計算する。
7. **権利を失わない。** 公開情報・商用利用可能・RAG可能・学習可能は別概念。Record/Claim単位でRightsを保持する。
8. **伝統知は文化文脈とauthorityを保持する。** 取得できるから利用してよい、とは扱わない。
9. **安全・医療ClaimをLLM confidenceで開放しない。**
10. **PredictionとEvidenceを分離する。** 将来Chemical Digital Twin等を導入しても、予測結果を観測事実へ昇格させない。

## 3. 上位アーキテクチャ

```text
                       PRODUCT LAYER
                            │
      ┌─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
   Observe/Scan         Plant Detail           Ask YAKU
      │                     │                     │
      └─────────────────────┼─────────────────────┘
                            ▼
                       YAKU Brain API
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
Identification Brain   Knowledge Brain       Safety Brain
       │                    │                    │
       └──────────────┬─────┴──────────────┬─────┘
                      ▼                    ▼
                Evidence Engine        Rights Gate
                      │                    │
                      └──────────┬─────────┘
                                 ▼
                      Living Evidence Graph
                                 │
 ┌────────────┬────────────┬─────┴─────┬─────────────┐
 ▼            ▼            ▼           ▼             ▼
Taxonomy   Medicinal    Chemical    Clinical      Tradition
 ▼            ▼            ▼           ▼             ▼
Specimen   Material      Target       Trial        Community
 ▼            ▼            ▼           ▼             ▼
DNA       Processing     Pathway     Evidence        Rights
 │
Ecology / Climate / Conservation / Plant Health
```

## 4. Product PlaneとKnowledge Plane

### Product Plane

現在の `Plant`, `PlantDefinition`, `Observation`, `IdentificationState`, `SafetyProfile` を保持する。高速、オフライン、UI向け、App Store v1向けのProjection層。

### Knowledge Plane

世界taxonomy、specimen、DNA、薬局方、literature、chemistry、clinical、safety、traditional knowledge、provenance、rightsを保持する詳細層。

Product PlaneはKnowledge Planeから必要部分だけmaterializeする。現在の150種は「Global Brain最初の150 Taxon Projection」として扱い、作り直し前提にしない。

## 5. 中核モジュール

- Canonical Identity / Taxon Concept Resolver
- Active Evidence Identification
- Medicinal Material / Preparation
- Chemical / Metabolic Causal Brain
- Clinical Evidence Brain
- Safety Brain
- Traditional Knowledge + Cultural Rights
- Source / Rights / Provenance
- Living Update / Retraction / Conflict Detection
- Expert Review / Curator Console
- YAKU-ID Global Benchmark

詳細は以下を参照。

- `01_DOMAIN_MODEL.md`
- `02_IDENTIFICATION_AND_BENCHMARK.md`
- `03_MEDICINAL_EVIDENCE_AND_SAFETY.md`
- `04_SOURCES_RIGHTS_AND_LIVING_GRAPH.md`
- `05_IMPLEMENTATION_PLAN.md`
- `06_SOURCE_CATALOG.md`
- `07_GOVERNANCE_REVIEW_AND_ACCEPTANCE.md`
- `08_G1_TAXONOMY_RESOLUTION.md`
- `09_G1_CROSS_SOURCE_RECONCILIATION.md`
- `10_G1_VERSIONED_TAXONOMY_ASSERTIONS.md`

## 6. Definition of Done

Global Plant Brainは「全データを集め終わったら完成」ではない。以下を満たした状態を完成条件とする。

- **Identity**: 世界植物taxonomyへYAKU内部ID経由でアクセスできる。
- **Identification**: 答えられる範囲と答えられない範囲をBenchmarkで定量化できる。
- **Medicinal Knowledge**: Plant / Material / Preparation / Claimが分離される。
- **Evidence**: 全重要ClaimからSourceへ戻れる。
- **Safety**: 危険な誤認を通常の誤認より強く抑制できる。
- **Rights**: Knowledge Node/Claimごとに利用権限を判定できる。
- **Updating**: taxonomy・研究・安全警告・撤回等を継続検出できる。
- **Auditability**: 過去の回答をKnowledge Snapshotまで含めて再現できる。
- **Honesty**: unknown / conflict / insufficient evidenceをそのまま表現できる。

最終形は「植物図鑑」「植物識別AI」「薬草辞典」のどれか一つではなく、**Living Plant Intelligence System**である。
