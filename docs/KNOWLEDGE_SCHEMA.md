# 知識スキーマ（KNOWLEDGE_SCHEMA）

> 統合仕様書 §10 準拠。PlantDefinitionはPR11で実装済み。Observationの全面移行は今後（PR13）。

## 先行導入済み（PR6, `src/types/observation.ts`）
- `IdentificationState`（unidentified / candidates / user_selected / community_supported / expert_verified）
- `SafetyLevel` / `SafetyProfile`（level/toxicParts/confusedWith/handling/ingestion/incident/emergency/sources）
- `CandidateScore` / `IdentificationCandidate`（PR10で追加。visionScore/seasonScoreのみ実装、regionScore/morphologyScoreは実データが無いため省略）

## ✅ PR11 で実装済み — PlantDefinition
`src/types/plantDefinition.ts` + `src/data/plantDefinitions.ts`。

- **既存の`Plant`型と並存する追加データセット**。`PLANTS`（永続化されないコード同梱の静的データ）を書き換えず、`PLANT_DEFINITIONS`として派生生成。既存画面の表示は変更していない（UI適用はPR12/13）
- taxonomy: `scientificName`/`japaneseNames`/`englishNames`は既存`Plant`から転記。`family`/`genus`は**50種全件、確立した植物学的知識に基づき新規に編集レベルで付与**（`reviewStatus: 'editorial'`）。`taxonIds`（GBIF/POWO/iNaturalist/Pl@ntNet/YList）は実API連携なしに推測できないため**全件空**（PR14で実装）
- safety: `danger`(GREEN/YELLOW/RED) → `SafetyProfile.level` へ機械的にマッピング。`confusedWith`/`lookalikeIds`は既存`src/data/safety.ts`のデータから**双方向グラフ**として導出。`toxicParts`は既存`warningNote`に明記されている場合のみ抽出（ニワトコ・スズランの2件）、それ以外は空配列（未整理を明示、捏造しない）
- culturalUses: 既存`effects`タグをそのまま`evidenceStatus: 'traditional_folklore'`として転記（医療的断定はしない、PR6の方針を継続）
- morphology: **意図的にスパース**（構造化された形態データは未整備。詳細は下記「今後」）
- sourceRefs: 全件空（引用元が無いものを捏造しない）

テスト: `src/data/__tests__/plantDefinitions.test.ts`（10件）— 50種全件のfamily/genus充足、taxonIds/sourceRefsが空であること、danger→safety.levelの正しさ、look-alikeグラフの双方向性、toxicPartsの過剰記載が無いことを検証。

## 今後（PR12以降）
- **Observation**：photos[]（ObservationPhoto: organ/quality）, location（precision: none/region/approximate/exact）, habitatTags, userTraits, identification（state/candidates/selectedTaxonId/provider/modelVersion）, safetyFlags, note, favorite, reanalysisStatus。既存`ScanRecord`からの移行はPR13（Fieldbook）。
- **SourceRef**：id/title/publisher/url/accessedAt/license/scope。実データソース連携（PR14, `docs/DATA_SOURCES_AND_LICENSES.md`）に伴い付与。
- **morphology詳細**（葉の形/花弁数等）：50種分の構造化データを確度高く用意するには出典付きの追加調査が必要。現状は`notes`のみのスパースな型に留めている。
- **PlantDefinitionのUI表示**（見分けるポイント/類似種/出典）：植物詳細画面（§7.7）はPR12/13で対応。

## 移行
`Plant`（静的データ、AsyncStorageに永続化されない）→`PlantDefinition`の変換に**永続化スキーマの移行は不要**（`docs/MIGRATION_PLAN.md`参照）。将来`ScanRecord`→`Observation`の移行時は`useGameStore`のpersist versionを上げる。
