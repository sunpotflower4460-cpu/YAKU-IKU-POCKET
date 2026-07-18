# v3 統合プロダクト設計図 対応計画（BLUEPRINT_V3）

> 元資料: `YAKU-IKU-POCKET_integrated_product_blueprint_v3_20260718.md`（ユーザー提供）。
> 前提: PR6〜PR15（安全性再構築・デザイン基盤・観察フロー・知識スキーマ・Explore・Fieldbook初版・
> バックエンド判断保留・アクセシビリティ/QA）は完了済み。本書はv3設計図とその差分をPR16〜PR25に
> 分割する計画書で、`docs/IMPLEMENTATION_ROADMAP.md`のv1計画を継承・拡張する。

## 現状とv3の差分（ギャップ分析）

### すでに満たしている項目
- **タブ構成**（v3 §4.1）: 今日/観察/探す/記録は既にv3の意図（今日・観察・探す学ぶ・わたしの記録）と一致。追加のリネームは行わない
- **確認レベルの分離**（v3 §7.4 `ObservationConfidence`）: `IdentificationState`（unidentified/candidates/user_selected/community_supported/expert_verified）がPR6から存在し、AIスコアと確認状態を既に分離済み
- **セクション単位の検証状態**（v3 §15 `ContentVerification`）: `PlantDefinition.reviewStatus`（unverified/editorial/expert）がPR11から存在
- **危険類似種の優先警告**（v3 §18.2）: `safety.ts`の`DANGEROUS_LOOKALIKES`とPR10の`assessCandidateSafety`が既に実装済み
- **デモ/本番分離・ランダム不返却・食用可表現の全廃**（v3 §18, Phase 0）: PR6完了済み
- **複数写真・部位ガイド・候補3件・比較UI**（v3 §6, §7, Phase 1）: PR9/PR10完了済み

### 新規に必要な項目（PR16〜PR25で対応）
- **`PlantUse`/`SourceOrigin`/`UseEvidenceLevel`と利用ゲート**（v3 §10, §16.2）: 未着手。料理・栽培・保存等のコンテンツと入手経路別ゲートは存在しない
- **Subject Router**（v3 §12）: 未着手。現状Claude Visionは常に50種図鑑内からの識別のみを試みる
- **現物確認チェックリスト（`TraitCheck`）**（v3 §7.3, §6.3）: 未着手。候補比較はカード単位で、特徴ごとの一致/不一致/未確認チェックはまだ無い
- **Fieldbook v2**（v3 §9）: 未着手。現状はスキャン履歴リスト＋観察数カレンダーのみで、タイムライン/植物別/再訪/自然文検索は無い
- **学習体験の3段階構成**（v3 §8）: 未着手。植物詳細は単一の読み物構成
- **Core Guideコンテンツの深化と拡充**（v3 §19 Phase 2, §20 PR24）: 現状50種。実写真・外部データベース出典・専門家レビューは今回のサンドボックスでは取得できない制約は継続する

### この開発環境の制約（正直な前提）
- **実写真ライセンス取得は不可**: v3 §14.3は「絵文字を主画像にしない」を求めるが、実写真の権利処理はできないため、引き続き絵文字＋テキストベースの表現を維持する
- **外部データベース連携（GBIF/POWO/Pl@ntNet等）は不可**: PR14で判断保留済みの理由がそのまま適用される。Subject Routerもルールベース＋Claude Visionのプロンプト設計の範囲に留める
- **位置情報・地図は不可**: 位置情報収集の同意フロー自体が未実装（PR14判断保留に含まれる）ため、Fieldbook v2の「地図」表示は本計画では対象外とする
- **150種目標について**: ユーザーの意向を踏まえ、実在する日本の身近な野草・ハーブについて一般的に確立された植物学・伝統利用の知識をもとに、既存50種と同じ`reviewStatus: 'editorial'`の方針で新規種を追加し150種を目指す。個別の外部データベースID・実写真・査読済み論文の引用は捏造せず、引き続き空のまま出典待ちとする

## PR16〜PR25 計画（v3 §20を本環境向けに調整）

| PR | v3のテーマ | 本環境での実装範囲 |
|---|---|---|
| PR16 | Product Architecture v3 | Feature flags基盤、本計画書、状態モデルの棚卸し（新規タブ変更なし=既に整合） |
| PR17 | Observation Core | 写真の永続ディレクトリ保存（旧監査C8の恒久対応）、未識別のまま記録するモードの明示化、再訪記録の型/UI |
| PR18 | Compare in the Field | `TraitCheck`型と現物確認チェックリストUI |
| PR19 | Learning Experience | 植物詳細を30秒/3分/深く学ぶの3段階に再構成 |
| PR20 | Fieldbook v2 | タイムライン/植物別/場所タグ/再訪予定/自然文検索（地図は対象外） |
| PR21 | Uses Safety Architecture | `PlantUse`/`SourceOrigin`/`UseEvidenceLevel`型とGate 0〜3ロジック |
| PR22 | Cooking & Living | 植物詳細の「暮らし」タブ、購入品/栽培品優先コンテンツ、`PracticeRecord` |
| PR23 | Subject Router | Claude Visionに被写体分類ステージを追加し、対応外でも空白にしない |
| PR24 | Core Guide Content | 既存50種のPlantUse/比較データ拡充＋新規種追加で150種を目指す（editorial・絵文字表現を継続） |
| PR25 | App Store Quality | v3追加分のa11y/QA確認、ドキュメント最終化 |

各PRは既存の運用（実装→`npm run check`→Playwrightでの実機相当確認→ロードマップ文書更新→コミット→PR→マージ）を踏襲する。
