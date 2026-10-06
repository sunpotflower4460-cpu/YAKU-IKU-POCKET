# YAKU Global Plant Brain — Sources, Rights & Living Evidence Graph

## 1. 基本方針

Global Plant Brainは「Web上の全情報をコピーした巨大DB」にはしない。

```text
L0 OPEN CORE
L1 LICENSED CORE
L2 REFERENCE FEDERATION
L3 RESTRICTED KNOWLEDGE
```

に分ける。

## 2. Storage Layer Policy

### L0 — Open Core

明示的に商用利用・保存・再利用可能な範囲を自前DBへ保持。

候補例:
- WFO taxonomic backbone
- Catalogue of Life
- ChEBI
- UniProtの利用可能範囲
- Reactome annotation
- COCONUT distribution dataの適用可能範囲

### L1 — Licensed Core

契約・Share-Alike・帰属等の条件を満たして保持。

候補例:
- ChEMBL
- GtoPdb
- commercial identification providers
- future licensed Kew/MPNS data

### L2 — Reference Federation

ID・metadata・URL・必要時API query中心。

候補例:
- PubMed/copyrighted abstracts or full text
- Cochrane
- WHO documents
- some EMA document families
- proprietary pharmacopoeia text
- source-specific datasets

### L3 — Restricted Knowledge

permission / community authority / contractが必要。

- protected traditional knowledge
- secret/sacred/community-only records
- TKDL等のrestricted corpus
- rights不明データ

## 3. Source Registry

全外部Sourceをregistry化する。

```ts
interface SourceRegistryEntry {
  id: string;
  name: string;
  purpose: string[];

  sourceType:
    | 'api'
    | 'bulk'
    | 'document'
    | 'registry'
    | 'database'
    | 'community';

  accessMethod?: string;
  updateCadence?: string;

  policyId: string;
  lastTermsReviewAt: string;

  status:
    | 'approved'
    | 'conditional'
    | 'reference_only'
    | 'restricted'
    | 'blocked'
    | 'needs_review';
}
```

「2026年10月に確認したTerms」を永続真実にしない。Terms/License自体もversioned sourceとして定期再監査する。

## 4. Rights Policy

```ts
interface RightsPolicy {
  id: string;
  licenseType?: string;

  commercialUse:
    | 'allowed'
    | 'permission_required'
    | 'prohibited'
    | 'unknown';

  localStorage: 'allowed' | 'conditional' | 'prohibited' | 'unknown';
  redistribution: 'allowed' | 'conditional' | 'prohibited' | 'unknown';
  derivativeDatabase: 'allowed' | 'conditional' | 'prohibited' | 'unknown';

  attributionRequired: boolean;
  shareAlike: boolean;

  aiRag: 'allowed' | 'conditional' | 'prohibited' | 'unknown';
  aiEmbedding: 'allowed' | 'conditional' | 'prohibited' | 'unknown';
  aiTraining: 'allowed' | 'conditional' | 'prohibited' | 'unknown';
  aiEvaluation: 'allowed' | 'conditional' | 'prohibited' | 'unknown';

  permissionRequired: boolean;
  notes?: string;
  checkedAt: string;
  policyVersion?: string;
}
```

RAG / embedding / training / fine-tuning / evaluationを同一視しない。

## 5. Record-level Rights

Source全体に1個のlicenseを付けるだけでは不十分。

GBIF、PubChem、BindingDB等のaggregation sourceでは元record/provenanceを保持し、Node/Edge/ClaimごとのRightsを判定する。

派生Claimは `derivedFrom` を保持し、必要に応じてupstream policyの最も厳しい条件を継承する。

## 6. Traditional Knowledge Access Policy

```ts
interface KnowledgeAccessPolicy {
  visibility:
    | 'public'
    | 'metadata_only'
    | 'restricted'
    | 'community_only'
    | 'secret';

  researchUse:
    | 'allowed'
    | 'permission_required'
    | 'prohibited';

  commercialUse:
    | 'allowed'
    | 'permission_required'
    | 'prohibited';

  aiRag:
    | 'allowed'
    | 'permission_required'
    | 'prohibited';

  aiTraining:
    | 'allowed'
    | 'permission_required'
    | 'prohibited';

  redistribution:
    | 'allowed'
    | 'permission_required'
    | 'prohibited';

  consentStatus?: string;
  benefitSharingRequired: boolean;
  authorityId?: string;
  localContextsLabels?: string[];
}
```

Restricted knowledgeはLLM contextへ投入後に隠すのではなく、Retrieval前に除外する。

## 7. Provenance

W3C PROV的なEntity / Activity / Agentモデルを参考に、次を追跡できるようにする。

```text
Original Source
↓
Ingestion Activity
↓
Extraction Activity
↓
Normalized Evidence
↓
Claim
↓
Synthesis Activity
↓
Assessment / User Answer
```

AIが抽出したClaimは使用model/version/input sourceを保持する。特定modelの不具合発見時に、そのmodelが生成に関与したClaimを再監査できるようにする。

## 8. Living Evidence Graph

Mutableな「現在値」だけを保存しない。

```text
Source Snapshot
↓
Assertion
↓
Claim
↓
Assessment
↓
Current View
```

Sourceが変更されたら古いAssertionを消さず、新Assertionを追加し、Resolver/EvaluatorがCurrent Viewを更新する。

## 9. Knowledge Lifecycle

```text
RAW
↓
AUTO_EXTRACTED
↓
SOURCE_VALIDATED
↓
AI_VALIDATED
↓
CURATOR_REVIEWED
↓
EXPERT_REVIEWED
```

伝統知には必要に応じて `COMMUNITY_APPROVED` を追加する。

Production GraphとStaging Graphを分離する。

## 10. Ingestion Pipeline

```text
External Source
↓
Raw Snapshot / Reference
↓
Schema Parsing
↓
Normalization
↓
Identity Resolution
↓
Rights Gate
↓
Structural Validation
↓
Evidence Validation
↓
Risk Routing
↓
Staging
↓
Review / Promotion
↓
Production Graph
```

AI extraction直後にProductionへ自動投入しない。

## 11. Semantic Invariants

Schema validationだけではなく、意味の矛盾を機械検出する。

例:

```text
evidenceType = IN_VITRO
AND
clinicalEfficacyEstablished = true
→ invalid

pregnancyEvidence = NO_DATA
AND
pregnancyStatus = ESTABLISHED_SAFE
→ invalid

sourceRights.aiRag = prohibited
AND
embeddingExists = true
→ invalid
```

将来的にSHACL等のGraph validation、DB constraints、domain testsを併用する。

## 12. Conflict Detection

Conflict Type:

```text
IDENTITY_CONFLICT
TAXONOMY_CONFLICT
MEASUREMENT_CONFLICT
CLINICAL_DIRECTION_CONFLICT
SAFETY_CONFLICT
REGULATORY_CONFLICT
TEMPORAL_CONFLICT
SOURCE_VERSION_CONFLICT
TRANSLATION_CONFLICT
```

ただしtrue conflict判定前に以下を比較する。

```text
same taxon?
same material?
same preparation?
same population?
same outcome?
same timeframe?
same jurisdiction?
same evidence level?
```

Context差なら矛盾ではない。

## 13. Dependency Graph

```text
Paper
↓
Compound Claim
↓
Mechanism Claim
↓
Clinical Explanation
↓
Plant Page
```

Sourceがretracted/corrected/invalidatedされたら依存Claimを逆引きし、`stale / requires_review / invalidated`へ変更して再評価する。

## 14. Update Watchers

- Taxonomy Watcher
- Literature Watcher
- Trial Watcher
- Safety Watcher
- Regulatory Watcher
- Retraction/Correction Watcher
- License Watcher
- Traditional Knowledge Steward

Sourceごとに更新頻度を合わせ、毎晩全Sourceを全再取得しない。

## 15. Risk Priority

```text
P0 Safety Critical
P1 Clinical Critical
P2 Taxonomy / Identity
P3 Scientific Knowledge
P4 Descriptive / Cultural
```

重大な毒性・誤認事故・regulatory alert等は高優先で影響範囲を再評価する。

## 16. Risk-adaptive Review

```text
Risk 0 → automatic promotion
Risk 1 → automatic + sample audit
Risk 2 → second AI validation
Risk 3 → human curator
Risk 4 → domain expert mandatory
```

Domain router:

- taxonomy → botanist/taxonomist
- crude drug → pharmacognosy
- clinical → evidence synthesis/medical expert
- toxicology → toxicologist
- chemistry/pathway → natural-product chemist
- traditional knowledge → relevant community/cultural authority

## 17. Freshness

一つのfreshness scoreにしない。

```text
Taxonomy current through ...
Clinical literature searched through ...
Safety alerts checked ...
Regulatory status checked ...
Traditional historical source edition ...
```

Historical sourceは古くてもstaleではない。

```ts
type TemporalRole =
  | 'historical_record'
  | 'current_status'
  | 'evolving_science';
```

## 18. Answer Reproducibility

重要回答に将来的に以下を記録可能にする。

```text
answerId
generatedAt
modelVersion
policyVersion
knowledgeSnapshotId
taxonomySnapshot
clinicalSearchThrough
safetyCheckedAt
sourceRefs
```

「なぜ当時この回答になったか」を再現可能にする。

## 19. Source Matrix — Architecture Intent

以下は設計上の役割分類。契約・Termsは実装直前に必ず再確認する。

| Source family | Primary role | Default integration mode |
|---|---|---|
| COL / WFO | global taxonomy | Open/conditional core |
| WCVP / POWO / IPNI | plant taxonomy/nomenclature | Source-specific |
| GBIF | occurrence/distribution | Record-license aware |
| Pl@ntNet | visual identification | External provider |
| iNaturalist | context/community observation | License-filtered/reference |
| MPNS | medicinal identity | Formal Kew service/license preferred |
| JP / Non-JPS | Japan crude-drug standards | Official-reference + permitted content |
| EMA HMPC | herbal regulatory assessment | Document-family policy |
| USP HMC | herbal quality | permitted standard integration |
| Chinese Pharmacopoeia | Chinese standards | Reference until rights confirmed |
| PCIM&H | Ayurveda/Siddha/Unani standards | Source-specific |
| PubChem | chemical router | contributor-aware |
| ChEBI | chemical ontology | Core candidate |
| NPASS | natural product/activity bridge | terms verification required |
| LOTUS / COCONUT | natural product occurrence/space | source/license aware |
| ChEMBL / BindingDB | bioactivity | share-alike/origin-aware |
| UniProt | protein identity/function | Core candidate |
| Reactome | pathways | core/reference by content type |
| PubMed / Europe PMC | literature discovery | metadata + licensed OA corpus |
| ClinicalTrials.gov / ICTRP | trial registry | structured registry federation |
| Cochrane | high-quality synthesis | reference/licensed only unless permission |
| EFSA / EPA / LiverTox | toxicity | source-specific |
| VigiAccess / CAERS / JADER | safety signal | causality-safe signal layer |
| TKDL / community TK | protected traditional knowledge | restricted/formal access |

## 20. Storage

初期System of RecordはPostgreSQLを推奨。

- relational canonical entities
- JSONB source-specific metadata
- pgvector semantic search
- object storage for permitted snapshots/media/raw data
- search engineは必要規模で追加
- Graph DBは最初からSoRにせず、必要になった時にGraph Projectionとして導入

複雑さよりprovenance / rights / correctnessを優先する。
