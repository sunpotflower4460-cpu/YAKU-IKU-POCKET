# 実装ロードマップ（IMPLEMENTATION_ROADMAP）

> 統合仕様書 §19, §22 準拠。1PR=1目的。デザインとデータ破壊を同一PRに混ぜない。

## 状態
| PR | テーマ | 状態 |
|---|---|---|
| （監査1次, PR#5 merged） | バグ/安全表現/設定 | ✅ merged |
| （監査2次, R1–R4） | 実AIランダム除去・表現緩和・ストア堅牢化・AppState | ✅ 本PRに統合 |
| **PR6** | **Safety & Product Repositioning** | 🟡 本PR |
| PR7 | Design Foundation（トークン/ダーク/タイポ/コンポーネント基盤） | ⬜ |
| PR8 | Navigation & Today（タブ再設計/Today Hero） | ⬜ |
| PR9 | Observe Capture Flow（複数写真/部位/品質/段階/オフライン保存） | ⬜ |
| PR10 | Candidate Results & Compare（複数候補/スコア/比較/確認質問） | ⬜ |
| PR11 | Knowledge Schema（PlantDefinition/taxonomy/migration/50種変換） | ⬜ |
| PR12 | Explore（検索/高度フィルター/分類/地域/表示切替） | ⬜ |
| PR13 | Fieldbook（Observation中心/タイムライン/地図/再解析/export・delete） | ⬜ |
| PR14 | Backend & Real Identification（proxy/Pl@ntNet等/taxonomy/rate limit/consent） | ⬜ |
| PR15 | Accessibility / QA / App Store（VoiceOver/Dynamic Type/CI/E2E/assets） | ⬜ |

## PR6 スコープ（本PR）
含む: ランダム除去(実AI)・判定不能の正式化・禁止表現撤去・クエスト文言・安全ルールモデル(look-alike)・デモ/本番分離(デモ非永続)・アトミック保存・Unit Test/CI・docs。
含まない（後続へ委譲）: デザインシステム(PR7)・タブ/Today刷新(PR8)・複数写真撮影(PR9)・候補比較UI(PR10)・PlantDefinition全面移行(PR11)・バックエンド/実AI(PR14)。

## 既存改善の回帰防止（§1）
ハイドレーション後セッション開始 / ローカル日付 / カメラ拒否→設定誘導 / ErrorBoundary / モーダル戻る / 画像フォールバック / モック明示 / 危険警告 / TS strict / プライバシー導線枠 / typecheck。CIで typecheck+test＋禁止語grepにより後退を検知。
