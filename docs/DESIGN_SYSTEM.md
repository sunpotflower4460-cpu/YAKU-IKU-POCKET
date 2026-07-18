# デザインシステム（DESIGN_SYSTEM）

> 統合仕様書 §3〜§5, §13, §14 準拠。**実装は PR7（Design Foundation）**。本書はアウトライン。

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
