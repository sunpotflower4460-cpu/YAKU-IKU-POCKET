# YAKU-IKU POCKET（薬育ポケット）

## プロジェクト概要
野草・スパイス・ハーブをAI画像認識でスキャンし、ポケモン図鑑のように収集する養生ゲームアプリ。

## 技術スタック
- **フレームワーク**: React Native + Expo SDK 52
- **言語**: TypeScript
- **ナビゲーション**: Expo Router v4（Bottom Tab）
- **状態管理**: Zustand + AsyncStorage（永続化）
- **UIライブラリ**: @expo/vector-icons, expo-linear-gradient
- **カメラ**: expo-camera（Phase 1はモック）

## ディレクトリ構成
```
app/
  _layout.tsx          # ルートレイアウト（Stack）
  (tabs)/
    _layout.tsx        # タブレイアウト
    index.tsx          # ホーム画面
    scan.tsx           # スキャン画面
    zukan.tsx          # 図鑑一覧画面
    profile.tsx        # プロフィール画面
  plant/
    [id].tsx           # 植物詳細画面

src/
  types/index.ts       # 型定義
  constants/colors.ts  # カラーパレット
  data/plants.ts       # 植物データ127種
  store/useGameStore.ts# Zustand ストア
  utils/mockAI.ts      # モックAI認識
  components/
    PlantCard.tsx      # 図鑑カード
    RarityStars.tsx    # レアリティ星
    DangerBadge.tsx    # 危険度バッジ
    DisclaimerBanner.tsx # 免責事項
    ScanResultModal.tsx  # スキャン結果モーダル
```

## デザインガイドライン
- **テーマ**: ポケモン図鑑風ゲームUI
- **メインカラー**: パステルグリーン（#A8D8A8〜#2E7D32）
- **背景**: #F0F7F0
- **危険度**: 🟢GREEN / 🟡YELLOW / 🔴RED の3段階
- **レアリティ**: ★1（灰）〜★5（金）

## 図鑑データ
- 日本の野草: 67種
- スパイス・ハーブ: 60種
- 合計: 127種（150種を目標に順次拡充中）

## AI認識
- Phase 1: モック（ランダム判定、レアリティ加重）
- Phase 2: 実APIに差し替え予定（`src/utils/mockAI.ts`を修正）

## 安全性
- 全画面に免責事項バナー表示
- 🔴RED植物は強調アラート
- 🟡YELLOW植物は注意事項表示
- 「必ず専門家に確認を」の文言を常時表示

## 開発コマンド
```bash
npm install         # 依存関係インストール
npm start           # Expo開発サーバー起動
npm run android     # Android起動
npm run ios         # iOS起動
npm run web         # Web起動
```

## Phase 2以降の予定
- 実際のカメラ撮影 + AI API連携
- 植物画像の追加
- ソーシャル機能（コレクション共有）
- 季節イベント
- 地域別植物データ
