# YAKU Global Plant Brain — Canonical Domain Model

> 本書はGlobal Plant BrainのCanonical Entity / Claim / Evidence設計を定義する。  
> 現行の `PlantDefinition` 等はProduct Projectionとして残し、本書のモデルへ段階移行する。

## 1. ID原則

外部DBのIDをPrimary Keyにしない。必ずYAKU内部Canonical IDを持ち、外部IDはcross-referenceとする。

```text
YakuTaxonConceptID
YakuPlantNameID
YakuSpecimenID
YakuMaterialID
YakuPreparationID
YakuBatchID
YakuCompoundID
YakuTargetID
YakuTrialID
YakuClaimID
YakuSourceID
YakuAuthorityID
```

外部Sourceのtaxonomy改定・ID変更・統合/分割から内部参照を守る。

## 2. Taxon Concept

species nameではなく「誰の分類体系でどの範囲を指すtaxonか」を管理する。

```ts
interface TaxonConcept {
  id: string;
  rank: string;
  acceptedName: string;
  accordingTo: SourceVersionRef;
  parentConceptId?: string;
  validFrom?: string;
  validUntil?: string;

  externalIds: {
    col?: string;
    wfo?: string;
    wcvp?: string;
    gbif?: string;
    plantnet?: string;
    inaturalist?: string;
  };
}

type TaxonConceptRelation =
  | 'congruent'
  | 'includes'
  | 'included_in'
  | 'partially_overlaps'
  | 'disjoint'
  | 'uncertain';
```

過去論文のtaxonを現行conceptへ黙って置換しない。Claimはpublication時点のTaxon Conceptへ紐づけ、Resolverがcurrent mappingを生成する。

## 3. Plant Name Graph

名前はidentityそのものではない。

```ts
interface PlantName {
  id: YakuPlantNameID;
  value: string;
  language?: string;
  script?: string;
  region?: string;
  communityId?: string;

  type:
    | 'scientific'
    | 'synonym'
    | 'vernacular'
    | 'pharmaceutical'
    | 'crude_drug'
    | 'traditional';

  role?:
    | 'catalog_scientific'
    | 'preferred_accepted'
    | 'authority_usage';

  taxonConceptIds: YakuTaxonConceptID[];

  nomenclaturalIds?: {
    ipniLsid?: string;
    wfoNameUsageId?: string;
  };

  sourceRefIds: YakuSourceID[];
}
```

同じ俗名が複数taxaを指し得る。1 taxonが多数の俗名を持つことも前提とする。**IPNI LSIDはTaxon ConceptではなくPlant Nameへ付与する。** 命名記録とaccepted taxon判断を分離することで、後からsynonym関係や分類体系が変わっても名称履歴を保持する。

## 4. Specimen / Molecular Identity

```text
Taxon Concept
  ↓
Voucher Specimen
  ↓
Tissue Sample
  ↓
DNA/RNA Extract
  ↓
Sequence
```

```ts
type IdentificationEvidenceLevel =
  | 'photo_only'
  | 'morphology_supported'
  | 'expert_determined'
  | 'voucher_backed'
  | 'dna_supported'
  | 'type_linked';
```

Herbarium、type specimen、DNA barcode、genomic resourceを将来接続できるようにする。

## 5. Cultivar / Hybrid / Strain / Chemotype

formal taxonomyとは別軸で保持する。

```ts
interface BiologicalVariant {
  id: string;
  taxonConceptId: string;
  type: 'cultivar' | 'strain' | 'accession' | 'chemotype' | 'hybrid';
  name?: string;
  parentTaxonConceptIds?: string[];
  sourceRefs: string[];
}
```

chemotypeはtaxonomic rankではなくchemical phenotypeとして扱う。

## 6. Medicinal Material

Plantと生薬・薬用原料を分離する。

```ts
interface MedicinalMaterial {
  id: string;
  taxonConceptIds: string[];
  plantPart: string;
  processingState?: string;
  pharmaceuticalNames: string[];
  traditionalNames: string[];
  pharmacopoeialRefs: string[];
}
```

`Taxon ≠ MedicinalMaterial` を永久ルールとする。

## 7. Preparation

```ts
type PreparationMethod =
  | 'infusion'
  | 'decoction'
  | 'maceration'
  | 'tincture'
  | 'extract'
  | 'powder'
  | 'expressed_juice'
  | 'essential_oil'
  | 'distillation'
  | 'fermentation'
  | 'cooking'
  | 'other';

interface Preparation {
  id: string;
  materialId: string;
  method: PreparationMethod;
  solvent?: string;
  temperature?: number;
  duration?: string;
  concentration?: string;
  drugExtractRatio?: string;
  standardization?: string;
  provenanceType:
    | 'traditional'
    | 'culinary'
    | 'pharmacopoeial'
    | 'regulated_product'
    | 'research_extract'
    | 'industrial';
}
```

研究extractから家庭用recipeを逆算しない。

## 8. Material Batch / Context

同じspeciesでも環境・成長段階・処理でchemical profileが変わる。

```ts
interface MaterialBatch {
  id: string;
  taxonConceptId: string;
  variantId?: string;
  origin?: GeoContext;
  growthStage?: string;
  harvestDate?: string;
  plantPart: string;

  environment?: EnvironmentalContext;
  drying?: ProcessingEvent;
  storage?: StorageContext;

  qualityTests: QualityTestResult[];
}
```

## 9. Compound Identity

```ts
interface Compound {
  id: string;
  inchiKey?: string;
  smiles?: string;
  formula?: string;

  pubchemCid?: string;
  chebiId?: string;
  chemblId?: string;
  npassId?: string;
  lotusId?: string;
  coconutId?: string;

  names: string[];
  chemicalClasses: string[];
}
```

構造ベースのidentityを優先し、名称揺れを正規化する。

## 10. Compound Occurrence / Analytical Confidence

```ts
type MetaboliteIdentificationConfidence =
  | 'confirmed_with_standard'
  | 'high_confidence_spectral'
  | 'putative_compound'
  | 'compound_class_only'
  | 'unknown_feature';

interface CompoundOccurrence {
  id: string;
  materialOrBatchId: string;
  compoundId?: string;
  unknownFeatureId?: string;

  presence: boolean;
  concentration?: number;
  unit?: string;

  analyticalMethod?: string;
  identificationConfidence: MetaboliteIdentificationConfidence;
  sourceRef: string;
}
```

`m/z一致 = 化合物確定`にはしない。Unknown featureも後から同定できるKnowledgeとして残す。

## 11. Gene / Enzyme / Biosynthesis

```text
Genome
↓
Gene
↓
Expression
↓
Protein / Enzyme
↓
Reaction
↓
Biosynthetic Pathway
↓
Compound
```

```ts
type CausalEvidenceLevel =
  | 'association'
  | 'time_sequence'
  | 'perturbation'
  | 'knockout'
  | 'add_back'
  | 'sterile_control'
  | 'isotope_tracing'
  | 'mechanistically_validated';
```

永久ルール:

- gene present ≠ gene expressed
- gene expressed ≠ enzyme active
- enzyme active ≠ metabolite produced
- metabolite in tissue ≠ plant itself produced it
- candidate pathway ≠ experimentally validated pathway

## 12. Microbiome / Producer Attribution

```ts
interface MetaboliteOriginEvidence {
  compoundOrFeatureId: string;
  hostTaxonId: string;

  producer:
    | 'plant'
    | 'endophyte'
    | 'rhizosphere_microbe'
    | 'mixed'
    | 'unknown';

  method:
    | 'genomic'
    | 'transcriptomic'
    | 'isotope_tracing'
    | 'sterile_culture'
    | 'isolated_microbe'
    | 'correlation_only';

  evidenceLevel: CausalEvidenceLevel;
  sourceRefs: string[];
}
```

## 13. Biological Target / Activity

```ts
interface BiologicalTarget {
  id: string;
  targetType: string;
  name: string;
  organism?: string;

  uniprotId?: string;
  geneId?: string;
  hgncId?: string;
  chemblTargetId?: string;
  iupharTargetId?: string;
}

interface ActivityEvidence {
  id: string;
  compoundId: string;

  level: 'molecular' | 'in_vitro' | 'in_vivo' | 'human';
  targetId?: string;

  endpoint?: 'Ki' | 'Kd' | 'IC50' | 'EC50' | 'AC50' | 'MIC' | 'LD50' | 'other';
  relation?: string;
  value?: number;
  unit?: string;

  experimentalSystem?: string;
  sourceRef: string;
}
```

Ki/Kd/IC50等を一つのpotency scoreへ潰さない。

## 14. Atomic Knowledge Claim

```ts
type ClaimEvidenceClass =
  | 'cultural_record'
  | 'traditional_use'
  | 'pharmacopoeial'
  | 'regulatory_traditional_use'
  | 'regulatory_well_established_use'
  | 'preclinical'
  | 'clinical_observational'
  | 'rct'
  | 'systematic_review'
  | 'regulatory_approved_drug'
  | 'insufficient_evidence'
  | 'conflicting_evidence';

interface KnowledgeClaim {
  id: string;
  subjectType: string;
  subjectId: string;

  predicate: string;
  object: unknown;

  context: {
    materialId?: string;
    preparationId?: string;
    population?: string;
    jurisdiction?: string;
    traditionId?: string;
    timepoint?: string;
  };

  evidenceClass: ClaimEvidenceClass;
  sourceRefs: string[];
  provenanceId: string;

  status:
    | 'raw'
    | 'auto_extracted'
    | 'source_validated'
    | 'ai_validated'
    | 'curator_reviewed'
    | 'expert_reviewed'
    | 'community_approved';

  createdAt: string;
  evaluatedAt?: string;
}
```

## 15. SourceRef / Provenance

現行のbare URL配列から次へ拡張する。

```ts
interface SourceRef {
  id: string;
  title: string;
  publisher?: string;
  url?: string;
  doi?: string;
  sourceRecordId?: string;

  scope: Array<
    | 'taxonomy'
    | 'morphology'
    | 'distribution'
    | 'toxicity'
    | 'lookalike'
    | 'traditional_use'
    | 'food_use'
    | 'chemistry'
    | 'mechanism'
    | 'clinical'
    | 'incident'
    | 'regulation'
    | 'other'
  >;

  sourcePublishedAt?: string;
  sourceUpdatedAt?: string;
  retrievedAt: string;
  sourceVersion?: string;
}

interface KnowledgeProvenance {
  id: string;
  sourceRefIds: string[];
  extractionActivityId?: string;
  modelVersion?: string;
  reviewerIds?: string[];
  transformation?: string;

  rightsPolicyId: string;
}
```

## 16. Temporal Model

4種類の時間を分ける。

1. Reality time — 研究・事故・採取等が起きた時刻
2. Source time — Sourceが公開/更新された時刻
3. Ingestion time — YAKUが取得した時刻
4. Evaluation time — YAKUが判断し直した時刻

Historical sourceは古いからstaleなのではない。

```ts
type TemporalRole =
  | 'historical_record'
  | 'current_status'
  | 'evolving_science';
```

## 17. Product Projection

現行 `PlantDefinition` はKnowledge Graphの全情報を保持しない。

```text
Global Knowledge Graph
        ↓ projection
PlantDefinition / SafetyProfile / Product Cards
        ↓
Mobile UI
```

Projectionには必ず `yakuTaxonConceptId`, `knowledgeSnapshotId`, `sourceCoverage` を将来的に追加できる設計とする。
