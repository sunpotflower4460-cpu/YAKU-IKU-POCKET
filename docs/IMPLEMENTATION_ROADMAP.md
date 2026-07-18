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
| **PR9** | **Observe Capture Flow（複数写真/部位/処理段階）** | 🟡 本PR |
| PR10 | Candidate Results & Compare（複数候補/スコア/比較/確認質問） | ⬜ |
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

## 既存改善の回帰防止（§1）
ハイドレーション後セッション開始 / ローカル日付 / カメラ拒否→設定誘導 / ErrorBoundary / モーダル戻る / 画像フォールバック / モック明示 / 危険警告 / TS strict / プライバシー導線枠 / typecheck。CIで typecheck+test＋禁止語grepにより後退を検知。
