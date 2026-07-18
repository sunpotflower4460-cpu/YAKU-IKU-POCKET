# データ移行計画（MIGRATION_PLAN）

> 統合仕様書 §12.4, §21「既存永続データをmigrationなしで変更しない」準拠。

## 永続ストア
- キー: `yaku-iku-storage`（AsyncStorage / Zustand persist）
- 現行スキーマ `version: 1`（PR6時点）。`migrate(persisted, version)` を実装済み（`src/store/useGameStore.ts`）。

## 原則
1. **破壊的変更をしない**：フィールドは追加のみ。リネーム/削除時は必ず `migrate` で旧→新へ変換。
2. **バージョンを上げるたびに migrate を拡張**：`version` を +1 し、対応する変換分岐を追加。
3. **壊れたデータのフォールバック**：不正な永続値は既定値へ寄せ、クラッシュさせない。
4. **ユーザーデータとゲーム定義データを分離**：植物定義(`PLANTS`)はコード同梱の静的データで永続化しない。ユーザーデータ（discovered/scanHistory/xp/notes等）のみ永続化。

## PR6 の移行影響
- 追加のみ（`_hasHydrated` は非永続、`recordObservation` は既存フィールドを使用）。**既存セーブは無変換で読める**。→ version据え置き(1)。

## 今後の移行ポイント
- **PR11 KNOWLEDGE_SCHEMA**：`Plant` → `PlantDefinition`（taxonomy/morphology/ecology/safety/sources）。表示層の GREEN/YELLOW/RED を `SafetyProfile.level` へ段階移行。→ `version: 2`、`Plant.danger` を `SafetyLevel` へマップする migrate を追加。
- **PR13 Fieldbook**：`ScanRecord` → `Observation`（複数写真/候補/状態/位置）。旧 `scanHistory` を `Observation` へ変換する migrate（1写真・`user_selected`相当へ）。
- **画像**：キャッシュURI→`expo-file-system` documentDirectory へコピー（§12.5, PR9/PR13）。移行時に既存URIは壊れていれば破棄（フォールバック実装済み）。
