# 実装ロードマップ（IMPLEMENTATION_ROADMAP）

> 統合仕様書 §19, §22 準拠。1PR=1目的。デザインとデータ破壊を同一PRに混ぜない。

## 状態
| PR | テーマ | 状態 |
|---|---|---|
| （監査1次, PR#5 merged） | バグ/安全表現/設定 | ✅ merged |
| （監査2次, R1–R4） | 実AIランダム除去・表現緩和・ストア堅牢化・AppState | ✅ 本PRに統合 |
| PR6 | Safety & Product Repositioning | ✅ merged |
| PR7 | Design Foundation（トークン/ダーク/タイポ/コンポーネント基盤） | ✅ merged |
| PR8 | Navigation & Today（タブ再設計/Today Hero） | ✅ merged |
| PR9 | Observe Capture Flow（複数写真/部位/処理段階） | ✅ merged |
| **PR10** | **Candidate Results & Compare（複数候補/スコア/比較/安全ブロック）** | 🟡 本PR |
| PR11 | Knowledge Schema（PlantDefinition/taxonomy/migration/50種変換） | ⬜ |
| PR12 | Explore（検索/高度フィルター/分類/地域/表示切替） | ⬜ |
| PR13 | Fieldbook（Observation中心/タイムライン/地図/再解析/export・delete） | ⬜ |
| PR14 | Backend & Real Identification（proxy/Pl@ntNet等/taxonomy/rate limit/consent） | ⬜ |
| PR15 | Accessibility / QA / App Store（VoiceOver/Dynamic Type/CI/E2E/assets） | ⬜ |

## PR8 スコープ（完了）
含む: タブ再構成（今日/観察/探す/記録）、Today画面の情報階層再設計（Hero=「観察を始める」1CTA→最近の観察→季節→観察チャレンジ→1分で学ぶ→コレクション進捗→安全情報）、「1分で学ぶ」学習カード新設（危険類似種の見分け方を優先表示）。
検証中に発見した実害バグとして同梱: Web版で `Haptics.*` が未対応例外を投げてオンボーディング等がクラッシュする問題を `src/utils/haptics.ts` の安全ラッパーで解消（`npm run web`／Vercelデプロイ対象のため対応）。

## PR9 スコープ（本PR）
含む:
- **複数写真撮影**（1〜5枚、`src/types/capture.ts`）: 撮影ごとにサムネイル追加、部位タグ（自動/全体/葉/花/実/樹皮/茎/その他、タップでサイクル）、個別削除
- **実AIへの複数画像送信**: `claudeAI.ts` を1枚→複数枚対応に拡張し、Claude Vision APIへ全写真を1リクエストで送信（部位情報も添えて照合精度を上げる）。単一/複数画像とも同じ安全ルール（未特定・エラー時にランダムを返さない）を維持し、ユニットテストで固定
- **正直な処理段階表示**: 「写真を確認中」→「(Claude Vision AI が解析中 / デモモードで候補を表示中)」→「安全情報を確認中」の3段階を、実際に実行する処理のみ表示（仕様書§7.4「実際に行っていない処理を表示しない」を遵守）

含まない（後続へ委譲、意図的にスコープ外）:
- **撮影品質スコア**（sharpness/brightness等の数値化）: 実際の画像解析なしに数値をでっち上げることは「安全性・誠実性」の原則に反するため、本PRでは実装しない。真の計測には端末上の画像解析または将来のバックエンド（PR14）が必要
- **ギャラリー取込**（`expo-image-picker`）: 新規ネイティブ依存の追加はこの検証環境で実機確認できないため見送り。次PRで安全に追加可能
- **モード切替**（1株識別/複数写真/病気害虫/観察だけ記録）: 複数写真は常時対応済みのため専用トグルは省略。「病気害虫を調べる」はPhase D（§8.4）として明示的に後回し。「観察だけ記録」（未識別のまま保存）はObservationスキーマ変更を伴うためPR11/13に委譲
- 候補比較UI(PR10)・PlantDefinition全面移行(PR11)・Explore/Fieldbook本格刷新(PR12/13)・バックエンド/実AI(PR14)

## 検証（PR9）
- `npm run check`（typecheck + jest 32件、claudeAI複数画像テスト7件を追加）green
- Expo web + Playwright（fakeカメラデバイス）で実機相当の確認: 2枚撮影→部位タグ切替→識別→処理段階表示→デモ結果（記録されない安全表示付き）まで一貫して動作をスクリーンショット確認済み

## PR10 スコープ（本PR）
含む:
- **複数候補の返却**: `claudeAI.ts` のプロンプト/レスポンスを単一識別→最大3件のランク付き候補配列に変更。DB外・信頼度欠落の候補は個別に除外（1件も無ければ`unidentified`）し、**ランダム不返却の安全ルールは維持**
- **CandidateScore**（`src/types/observation.ts`）: `visionScore`（モデル自身の確信度）と`seasonScore`（`isPlantInSeason`で実計算、ローカル算出・捏造なし）のみを実装。`regionScore`/`morphologyScore`は実データが無いため意図的に省略（後述）
- **候補比較UI**（`ScanResultModal`）: 実AIが2件以上の候補を返した場合のみ「候補を{N}件に絞りました」を表示し断定しない。候補カード（絵文字/学名/危険度バッジ/一致度/季節適合チップ）をタップで選択でき、選択中の候補の詳細が下に表示される。デモモードは候補配列を持たないため単一結果ビューのまま変化なし（回帰なし・Playwrightで確認済み）
- **候補横断の安全ブロック**（`src/utils/candidateSafety.ts`）: 1位候補が安全でも、**候補のどれかがRED、または危険な類似種を持つ場合は必ず警告**（§7.5「候補1位が安全側でも警告」）。既存の`safety.ts`データを再利用し新規の危険判定ロジックは持ち込まない

含まない（後続へ委譲、意図的にスコープ外）:
- **regionScore（地域適合）**: 位置情報の収集自体が未実装（同意画面含めPR14/後続の権限まわりの検討が必要）のため、捏造せず省略
- **morphologyScore・構造化された形態比較**（葉の形/花弁数など）: `Plant`型に構造化フィールドが無く、50種分の本物の形態データを新規に用意するのはPR11（Knowledge Schema）のスコープ。本PRでは危険類似種の`note`（既存データ）をそのまま見分けヒントとして活用するに留める
- **AI確認質問**（候補の差を埋める追加質問UI）: 上記の形態データが無いと本物の質問を生成できないため、フェイクなQ&Aを実装しない方針で見送り。PR11でmorphologyデータが揃った後に着手
- 「判定せず保存」「候補を比較する」独立画面など、Observationスキーマ変更を伴う保存アクションはPR11/13へ委譲

## 検証（PR10）
- `npm run check`（typecheck + jest 44件、claudeAI複数候補テスト・candidateSafetyテスト・ScanResultModalコンポーネントテストを追加）green
- Expo web + Playwright でデモモードの単一結果ビューに回帰が無いことをスクリーンショットで確認（デモは候補配列を返さないため比較UIは実AI有効時のみ発火）

## 既存改善の回帰防止（§1）
ハイドレーション後セッション開始 / ローカル日付 / カメラ拒否→設定誘導 / ErrorBoundary / モーダル戻る / 画像フォールバック / モック明示 / 危険警告 / TS strict / プライバシー導線枠 / typecheck。CIで typecheck+test＋禁止語grepにより後退を検知。
