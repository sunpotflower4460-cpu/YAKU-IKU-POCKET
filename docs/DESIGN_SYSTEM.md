# デザインシステム（DESIGN_SYSTEM）

> 統合仕様書 §3〜§5, §13, §14 準拠。**基盤は PR7 で実装済み**。個別画面への適用は各PR（PR8 Today, PR9 Observe, PR10 Compare, PR12 Explore, PR13 Fieldbook）で順次。

## PR7 実装済み
- `src/theme/tokens.ts`（space/radius/type/weight/motion/minTapTarget）
- `src/theme/colors.ts`（`AppColors` light/dark 各24キー）
- `src/theme/ThemeProvider.tsx`（`useColorScheme()` 追従、`useTheme()` フック）
- `src/ui/`: AppScreen, Surface, ElevatedCard, PrimaryButton, SecondaryButton, IconButton, SectionHeader, StatusPill, EmptyState, Skeleton, DynamicText
- `app/_layout.tsx` に `ThemeProvider`＋`SafeAreaProvider` を接続、StatusBarをテーマ追従に
- 既存 `src/constants/colors.ts`（`Colors`）は後方互換のため維持。各画面は自身のPRで新トークンへ移行

## コンセプト
**Living Field Guide** = Forest Field Guide × Natural History Museum × Apple Native。

## トークン（PR7で `src/theme/` に実装予定）
- カラー: セマンティック名（canvas / surface* / text* / border* / accent* / status* / rarity*）。ライト/ダーク両対応（`useColorScheme()` + アプリ設定）。ハードコード色を排除（現状は `src/constants/colors.ts`）。
- 余白: 4pt基準スケール。角丸: control 10–12 / card 16–18 / major 22–28 / sheet 28–32 / pill 999。
- タイポ: システムフォント + Dynamic Type。太字を乱用しない。
- タップ領域: 44×44pt以上（hitSlop併用）。モーション: 140–420ms、Reduce Motion尊重。

## 視覚階層
Level A(Primary,1画面1つ) / B(Secondary) / C(Tertiary) / D(Safety)。深度 Z0 Canvas〜Z3 Overlay。Glass/BlurはZ2–Z3のみ。

## 共通コンポーネント（§13, PR7で `src/ui/`）
AppScreen, AppHeader, SectionHeader, PrimaryButton, SecondaryButton, IconButton, Surface, ElevatedCard, InfoRow, StatusPill, SafetyBanner(✅PR6実装済), EmptyState, Skeleton, BottomSheet, SearchField, FilterChip, SegmentedControl, PhotoCarousel, CandidateCard, CandidateComparison, SourceList, ObservationCard, DynamicText。各コンポーネントで light/dark/disabled/loading/pressed/error/Dynamic Type/VoiceOver/Reduce Motion を検証。

## 禁止（§21）
全カード強い影 / 全面ガラス / 緑金の多用で高級感 / Emojiを操作アイコン化 / 色だけで危険度表現。
