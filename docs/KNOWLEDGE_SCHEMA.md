# 知識スキーマ（KNOWLEDGE_SCHEMA）

> 統合仕様書 §10 準拠。**実装は PR11（Knowledge Schema）**。本書はアウトライン。PR6では型の一部のみ先行導入。

## 先行導入済み（PR6, `src/types/observation.ts`）
- `IdentificationState`（unidentified / candidates / user_selected / community_supported / expert_verified）
- `SafetyLevel` / `SafetyProfile`（level/toxicParts/confusedWith/handling/ingestion/incident/emergency/sources）

## PR11 で導入予定
- **PlantDefinition**：taxonomy（scientificName/accepted/和名/英名/synonyms/family/genus/taxonIds{gbif,powo,inaturalist,plantnet,ylist}）, classification, morphology, ecology, phenology, safety, conservation, culturalUses, lookalikeIds, sourceRefs, reviewStatus。
- **Observation**：photos[]（ObservationPhoto: organ/quality）, location（precision: none/region/approximate/exact）, habitatTags, userTraits, identification（state/candidates/selectedTaxonId/provider/modelVersion）, safetyFlags, note, favorite, reanalysisStatus。
- **SourceRef**：id/title/publisher/url/accessedAt/license/scope。

## 移行
現行 `Plant`/`ScanRecord` → 上記へは `MIGRATION_PLAN.md` の version 2/3 で変換。GREEN/YELLOW/RED は `SafetyProfile.level` へ段階的に移行し、表示層から色単独判定を廃止。
