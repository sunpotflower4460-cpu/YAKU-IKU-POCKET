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

## 現状(PR6〜PR23)
実AI(`claudeAI.ts`)は単一プロバイダの最小版で、未特定/失敗を安全に扱う（ランダム不返却・実行時検証・タイムアウト）。PR9で**複数画像＋部位情報を1リクエストで送信**できるように拡張（`src/types/capture.ts`, `recognizePlantWithClaude(photos, apiKey)`）し、「A. Vision Provider」の複数画像要件をClaude単体で部分的に満たしている。PR10で**最大3件のランク付き候補を返す**ように拡張し（`IdentificationCandidate[]`）、`CandidateComparison`（§13）の最小版を`ScanResultModal`に実装。候補ごとの`seasonScore`はローカルで実計算（`isPlantInSeason`）。`regionScore`（位置情報が未収集）と`morphologyScore`（構造化された形態データが未整備）は実データが無いため意図的に未実装。Regional/Taxonomy Resolver/Knowledge Aggregatorはまだ無い（PR14）。撮影品質スコア（sharpness/brightness等の実測）も未実装 — 実測なしに数値を捏造しない方針のため、実装は端末上解析またはバックエンド連携（PR14）を待つ。PR13で、実AI呼び出しは「APIキーの存在」だけでなく「ユーザーの明示的な同意（`aiConsentGiven`）」も必須条件に変更した（`src/utils/appMode.ts`）。

PR23で「Plant/Non-Plant Rejection」（v3 §12 Subject Router）の最小版を実装。**設計上の原則（LLM一つに識別と説明を同時にさせない）とは異なり**、独立した分類器を新設するのではなく、既存のClaude Vision 1リクエストの中に被写体分類（`subjectCategory`）を先に出力させ、`vascular_plant`（種子植物・シダ植物）と判定された場合のみ候補マッチングへ進む設計にした（`src/types/subject.ts`, `src/utils/claudeAI.ts`）。理由: 別プロバイダの分類器を追加するとAPIコスト・レイテンシが増え、この環境では新規の分類特化モデルの精度を検証する手段も無いため。`vascular_plant`以外（コケ・地衣類/藻類/枯死・加工品/キノコ/昆虫/動物/食材加工品/人工物/複数被写体/判定不能）は`out_of_scope`として、カテゴリ別の正直な案内文とともに返す。未知・未対応のカテゴリ文字列は`unclear`にフォールバックし、`vascular_plant`だと決して誤認しない。将来、真に独立した被写体分類器（例: 軽量ローカルモデル）を導入する場合はこの制約を解消できる。

## PR14 判断保留の理由と、着手時の設計メモ
PR14（バックエンド・実AI連携）はこの開発環境（サーバーをデプロイできない・外部APIキー/契約が無いコードのみのサンドボックス）では実装しないことにした。理由は「動いているように見えて実際は繋がっていない」機能を作り込むと、本プロジェクトの「捏造しない」原則に反するため。以下は、バックエンド環境が用意でき次第そのまま着手できるよう、要件を先出ししたものです（実装済みコードではありません）。

### 最小プロキシAPIの契約案
```
POST /api/identify
Request:
  - images: string[]  // base64 or signed upload URLs, MAX_CAPTURE_PHOTOS(5)枚まで
  - organs: PhotoOrgan[]  // src/types/capture.ts と揃える
  - clientRequestId: string  // 同一リクエストの重複送信防止
Response:
  - candidates: IdentificationCandidate[]  // src/types/observation.ts と互換の形にする
  - unidentified: boolean
  - apiVersion: string
```
- **APIキーはサーバー環境変数のみに置き、クライアントには一切渡さない**（現行の`EXPO_PUBLIC_CLAUDE_API_KEY`直呼び出しを廃止する）
- レート制限: IP/デバイスID単位、同一画像ハッシュの連投は短時間で弾く
- 画像は受信後にリサイズ・EXIF除去してから外部APIへ転送（プライバシー・帯域対策）
- タイムアウト・エラー時は必ず`unidentified`または明示的なエラーを返し、フォールバックでランダム候補を作らない（既存のクライアント側原則をサーバー側にも適用）

### 位置情報同意フロー（Regional Service用）
- 位置情報は**オプトイン**。同意していない場合は`regionScore`を計算せず、UI上も「地域情報なしで判定」であることを明示
- 収集する場合も粗い精度（市区町村レベル等）に丸め、希少種の詳細位置は保存・表示しない

### Taxonomy Resolver / Knowledge Aggregator
- GBIF/POWO/YList等への問い合わせ結果はサーバー側でキャッシュし、`sourceRefs`（`src/types/plantDefinition.ts`）に出典・取得日時を必ず記録
- クライアントの`PlantDefinition.reviewStatus`は、出典が確認できたレコードのみ`'editorial'`→`'expert'`に引き上げる運用とする
