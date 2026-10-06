# YAKU Global Plant Brain — Implementation Plan

> App Store初回公開のP0/P1は `../APP_STORE_RELEASE_FINALIZATION.md` が優先。  
> 本書はGlobal Plant Brainを段階的に構築する中長期ロードマップ。

## 1. 実装原則

- 現行アプリを捨てて全面rewriteしない。
- 現在の150種・PlantDefinition・Observationを最初のProduct Projectionとして利用する。
- 巨大データ取り込み前にID / Claim / Provenance / Rights / Safety基盤を作る。
- 1 PR = 1目的の既存方針を維持する。
- 外部サービス契約/秘密情報が必要な機能は、実環境なしで「動いているふり」を作らない。
- Safety-critical変更は通常機能より高いReview Gateを通す。

## 2. 全体フェーズ

### G0 — Architecture Foundation

最優先。大量データをまだ入れない。

実装:
- YAKU canonical IDs
- SourceRef v2
- SourceRegistry
- RightsPolicy
- KnowledgeProvenance
- Atomic Claim
- Assertion/version model
- temporal fields
- staging/production status
- dependency metadata

現行150種へ `yakuTaxonConceptId` を割り当てる準備を行う。

### G1 — Global Taxonomy Foundation

- Catalogue of Life
- WFO
- WCVP/POWO
- IPNI
- synonym/name resolution
- Taxon Concept/versioning
- vernacular-name graph

現在150種を正式taxonへ解決し、external IDsを推測で埋めない。

成果:
- world taxonomy lookup
- taxon IDs
- current/synonym mapping
- source/version traceability

### G2 — Identification 2.0

- backend Identification Orchestrator
- provider adapters
- Pl@ntNet等
- score calibration
- morphology evidence
- geo/season soft priors
- NBO
- open-set / abstention
- safe taxonomic fallback
- dangerous-pair policy

成果:
- Active Evidence Identification
- YAKU-ID benchmark v1
- provider comparison
- model/version tracking

### G3 — Safety Brain

Medicinal efficacyより先にSafetyを強化。

- dangerous lookalike graph
- poisoning incidents
- intrinsic toxicity
- special populations
- interactions
- product alerts
- signal sources
- source-scoped warning claims

現行GREEN/YELLOW/REDはProjectionに格下げし、正本は多軸Safety Graphへ。

### G4 — Medicinal Identity

- MPNS
- Japanese Pharmacopoeia / Non-JPS
- EMA herbal sources
- USP HMC
- Chinese / Indian standards等

Taxon / MedicinalMaterial / Preparationを分離。

### G5 — Chemical Brain

- ChEBI
- PubChem
- NPASS
- LOTUS
- COCONUT
- ChEMBL
- BindingDB
- UniProt
- Reactome

Compound occurrenceとActivity Evidenceを分離する。

### G6 — Clinical Evidence Brain

- PubMed
- Europe PMC
- ClinicalTrials.gov
- WHO ICTRP
- systematic review metadata
- trial-publication linkage
- PICOT
- RoB
- Evidence Synthesis
- GRADE-style certainty

### G7 — Processing / Cultivation / Metabolic Brain

- MaterialBatch
- harvest
- drying
- storage
- extraction
- fermentation
- metabolomics
- gene/enzyme/pathway
- environment
- microbiome/endophyte

### G8 — Tradition / Rights

- Kampo
- TCM
- Ayurveda
- Siddha
- Unani
- Sowa-Rigpa
- folk/ethnobotanical knowledge
- Community authority
- access restrictions
- benefit-sharing metadata

Restricted knowledgeを取得量競争にしない。

### G9 — Living Brain

- Source Watchers
- diff ingestion
- correction/retraction monitoring
- dependency invalidation
- automatic re-evaluation
- conflict detection
- curator console
- expert queue
- knowledge timeline
- answer reproducibility

### G10 — Research-grade Plant Intelligence

基盤が成熟してから。

- voucher/DNA integration
- phylogenomics
- research dataset export
- chemical digital twin
- causal/predictive models

PredictionとEvidenceを分離する。

## 3. 推奨最初のPR群

App Store release workとは別branch/seriesで行う。

### GPB-001 — Architecture docs
本ディレクトリの設計を正本化。コード変更なし。

### GPB-002 — SourceRef v2 + Rights types
既存SourceRefを破壊せず、v2型/adapterを追加。安全critical sourceから移行。

### GPB-003 — Canonical ID types
`YakuTaxonConceptId`等のbranded ID / mapping tableを追加。

### GPB-004 — Source Registry
source metadata / license / integration modeをコードまたは管理JSONで正規化。

### GPB-005 — Claim & Provenance core
Atomic Claim、Assertion、Provenance、ReviewStateを導入。まだUIへ全面露出しない。

### GPB-006 — Current 150 projection mapping
150種をCanonical Taxonへマッピング。推測ID禁止。Coverage reportを生成。

### GPB-007 — Safety Claim migration
RED→critical YELLOWの順でSafety Claimをsource-scope付きへ移行。

### GPB-008 — Taxonomy Resolver service
COL/WFO等のadapter、cache、version metadata。

### GPB-009 — Identification Backend
App Store Finalizationで要求済みのserver-side proxyをGlobal Brain APIの最初のserviceとして実装。

### GPB-010 — YAKU-ID benchmark harness
model/providerを同じdatasetで比較するCLI/CI基盤。

## 4. Backend Architecture

初期はModular Monolith。

論理module:

```text
API Gateway
Identification Orchestrator
Taxonomy Resolver
Knowledge Query
Evidence Engine
Safety Engine
Rights Gate
Source Connectors
Ingestion Pipeline
Update Watchers
Curator API
Benchmark Runner
```

早期microservice化は避ける。

## 5. Storage

### PostgreSQL
正本:
- canonical entities
- claims
- source refs
- provenance
- rights
- versions
- review states
- event metadata

### JSONB
source-specific / pre-normalized metadata。

### pgvector
RAG / semantic retrieval / duplicate claim search。

### Object storage
許可されたsource snapshot / image / PDF / scientific raw data。

### Graph projection
必要になった段階でNeo4j等へ投影。最初からGraph DBを唯一のSoRにしない。

## 6. API Direction

Public/Product API例:

```text
POST /v1/identify
GET  /v1/taxa/:id
GET  /v1/taxa/:id/knowledge
GET  /v1/taxa/:id/safety
GET  /v1/taxa/:id/medicinal-materials
GET  /v1/claims/:id
GET  /v1/sources/:id
POST /v1/observations
POST /v1/identifications/:id/evidence
```

Internal:

```text
POST /internal/ingest
POST /internal/review
POST /internal/recompute
POST /internal/benchmark
```

## 7. UI Evolution

現行Product UXを壊さず段階追加。

Plant detail候補:

```text
30秒で知る
3分で見分ける
深く学ぶ
  ├ なぜこの判断？
  ├ 薬草として
  ├ 研究
  ├ 安全性
  └ 出典・更新履歴
```

内部は複雑でもユーザーには、

- 伝統的な利用
- 人での研究
- 安全性
- 公的評価

を明確に分ける。

## 8. Quality Gates

### Structural
- schema validation
- DB constraints
- rights completeness

### Semantic
- invalid evidence transitions
- safety invariants
- no-data vs safe
- in-vitro vs clinical

### Behavioral
- YAKU-ID benchmark
- dangerous-pair regression
- answer QA

### Release
- source/license terms review
- security/secret scan
- dependency audit
- production data migration rehearsal

## 9. Metrics

Identification:
- Top-1/Top-3
- genus/family
- open-set
- calibration
- dangerous false-safe
- risk-coverage

Knowledge:
- taxonomy coverage
- source-backed claim ratio
- medicinal material coverage
- safety coverage
- clinical coverage
- expert-reviewed ratio
- stale critical claim count
- unresolved conflict count

Operations:
- ingestion failure
- source freshness
- update lag
- reviewer queue
- cost per identification
- provider latency

## 10. いま実装しないもの

基盤前に着手しない。

- proprietary全Sourceの大量scraping
- 自前世界規模Vision model
- Neo4j全面移行
- 全論文の全文RAG
- 全Traditional Knowledge ingestion
- DNA解析UI
- medical recommendation engine
- ingestion/服用可否判定
- Chemical Digital Twin

## 11. Global BrainとApp Store Releaseの優先順位

初回App Store公開のP0をGlobal Brainのために延期しない。

順序:

```text
App Store P0 finalization
↓
Release / stable baseline
↓
G0 foundation
↓
G1 taxonomy
↓
G2 identification
↓
G3 safety
↓
remaining Global Brain phases
```

ただし、App Store P0で行うBackend proxy / identification-state integrity / scoped sources / safety copy修正はGlobal Brainと互換な形で実装する。

## 12. Completion Criteria

Global Brainは「データ件数」では完成判定しない。

- source traceability
- rights enforcement
- unknown/abstention
- safety asymmetry
- versioning
- reproducibility
- continuous update
- benchmarked identification
- expert escalation
- context-preserving medicinal evidence

が成立した時点で、Living Plant Intelligence Systemとしての基盤が完成したと判断する。
