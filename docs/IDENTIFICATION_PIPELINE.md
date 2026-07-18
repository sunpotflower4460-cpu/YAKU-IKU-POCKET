# 識別パイプライン（IDENTIFICATION_PIPELINE）

> 統合仕様書 §8, §9 準拠。**実装は PR9/PR10/PR14**。本書はアウトライン。

## 原則
LLM一つに写真を送って名前と知識を同時生成させる設計は**禁止**。役割分割したパイプラインにする。

## パイプライン
Capture → Image Quality Gate → Plant/Non-Plant Rejection → Multi-image Species ID → Organ Detection → Regional Flora Prior → Season/Phenology Prior → Taxonomy Normalization → Look-alike & Toxicity Rule Engine → Knowledge Source Aggregation → Candidate Comparison → LLM Explanation Layer → Observation Save。

## 役割
- **A. Vision Provider**：複数画像・部位指定で候補リスト（genus/family fallback, non-plant rejection, confidence, apiVersion）。候補: Pl@ntNet。
- **B. Regional Service**：任意の粗い地域。GBIF/iNaturalist周辺記録。希少種位置は保護。位置なしでも動作。
- **C. Taxonomy Resolver**：学名/accepted/synonym/family/genus/taxonId/和名/旧名。GBIF/POWO/YList。
- **D. Safety Rule Engine**：LLMに任せない。危険/誤食/接触/公的警告。厚労省・消費者庁優先。**PR6で `src/data/safety.ts` として最小実装済**（look-alike）。
- **E. Knowledge Aggregator**：taxonomy/morphology/distribution/phenology/conservation/safety/use/images/stats をカテゴリ別取得。
- **F. LLM Layer**：**検索済み情報の説明に限定**。根拠なき薬効/特徴/断定/安全判定/食用推奨は禁止。sourceID保持。

## 現状(PR6〜PR9)
実AI(`claudeAI.ts`)は単一プロバイダの最小版で、未特定/失敗を安全に扱う（ランダム不返却・実行時検証・タイムアウト）。PR9で**複数画像＋部位情報を1リクエストで送信**できるように拡張（`src/types/capture.ts`, `recognizePlantWithClaude(photos, apiKey)`）し、「A. Vision Provider」の複数画像要件をClaude単体で部分的に満たしている。Regional/Taxonomy Resolver/Knowledge Aggregator/フル候補比較は未実装（PR10/PR14）。撮影品質スコア（sharpness/brightness等の実測）も未実装 — 実測なしに数値を捏造しない方針のため、実装は端末上解析またはバックエンド連携（PR14）を待つ。
