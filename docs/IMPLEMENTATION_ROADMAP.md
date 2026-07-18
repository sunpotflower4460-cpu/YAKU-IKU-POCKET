# 実装ロードマップ（IMPLEMENTATION_ROADMAP）

> 統合仕様書 §19, §22 準拠。1PR=1目的。デザインとデータ破壊を同一PRに混ぜない。

## 状態
| PR | テーマ | 状態 |
|---|---|---|
| （監査1次, PR#5 merged） | バグ/安全表現/設定 | ✅ merged |
| （監査2次, R1–R4） | 実AIランダム除去・表現緩和・ストア堅牢化・AppState | ✅ 本PRに統合 |
| PR6 | Safety & Product Repositioning | ✅ merged |
| PR7 | Design Foundation（トークン/ダーク/タイポ/コンポーネント基盤） | ✅ merged |
| **PR8** | **Navigation & Today（タブ再設計/Today Hero）** | 🟡 本PR |
| PR9 | Observe Capture Flow（複数写真/部位/品質/段階/オフライン保存） | ⬜ |
| PR10 | Candidate Results & Compare（複数候補/スコア/比較/確認質問） | ⬜ |
| PR11 | Knowledge Schema（PlantDefinition/taxonomy/migration/50種変換） | ⬜ |
| PR12 | Explore（検索/高度フィルター/分類/地域/表示切替） | ⬜ |
| PR13 | Fieldbook（Observation中心/タイムライン/地図/再解析/export・delete） | ⬜ |
| PR14 | Backend & Real Identification（proxy/Pl@ntNet等/taxonomy/rate limit/consent） | ⬜ |
| PR15 | Accessibility / QA / App Store（VoiceOver/Dynamic Type/CI/E2E/assets） | ⬜ |

## PR8 スコープ（本PR）
含む: タブ再構成（今日/観察/探す/記録）、Today画面の情報階層再設計（Hero=「観察を始める」1CTA→最近の観察→季節→観察チャレンジ→1分で学ぶ→コレクション進捗→安全情報）、「1分で学ぶ」学習カード新設（危険類似種の見分け方を優先表示）。
検証中に発見した実害バグとして同梱: Web版で `Haptics.*` が未対応例外を投げてオンボーディング等がクラッシュする問題を `src/utils/haptics.ts` の安全ラッパーで解消（`npm run web`／Vercelデプロイ対象のため対応）。
含まない（後続へ委譲）: 複数写真撮影(PR9)・候補比較UI(PR10)・PlantDefinition全面移行(PR11)・Explore/Fieldbook本格刷新(PR12/13)・バックエンド/実AI(PR14)。既存Colorsベースのスタイルは維持し、新テーマトークンへの全面移行はしていない（Heroの一部のみ活用）。

## 既存改善の回帰防止（§1）
ハイドレーション後セッション開始 / ローカル日付 / カメラ拒否→設定誘導 / ErrorBoundary / モーダル戻る / 画像フォールバック / モック明示 / 危険警告 / TS strict / プライバシー導線枠 / typecheck。CIで typecheck+test＋禁止語grepにより後退を検知。
