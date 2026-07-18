# App Store 提出チェックリスト（APP_STORE_RELEASE_CHECKLIST）

> 統合仕様書 §17 準拠。✅=完了 / ⬜=未 / 🔒=開発者本人のみ対応可。

## 安全性（§20 Safety）
- [x] 本番でランダム植物が返らない
- [x] 判定不能を正常結果として扱える（`IdentificationState`）
- [x] UIに「食用可 / 食用可能」0件（CIで検査）
- [x] 薬効の医学的断定を撤去（伝統的用途表現）
- [x] 危険候補（類似種）に警告（`SafetyBanner`）
- [x] デモ結果でXP・履歴・図鑑が増えない
- [ ] 🔒 APIキーが配布物にない（実AI導入=PR14でバックエンド化）

## 提出ブロッカー（🔒 本人対応）
- [ ] 本番アイコン / スプラッシュ（現状プレースホルダー）
- [ ] Privacy Policy 実URL / Terms 実URL（`src/constants/app.ts` は example.com）
- [ ] Support URL / Support email 導線
- [ ] App Privacy 回答（画像・位置・診断データの扱い、実AI時は第三者送信を明記）
- [ ] 年齢レーティング質問票（毒/死・健康表現を反映）
- [ ] EAS projectId / Apple ID / Team ID / App ID（`eas.json` 仮値）
- [ ] TestFlight 実機テスト（SE相当/標準/Pro Max、ダーク、VoiceOver実機確認、文字最大、オフライン、API障害、空データ、100件履歴）
- [x] 端末内データ削除機能（§17）→ PR13で実装（設定 > すべてのデータを削除）
- [ ] Reviewer Notes（デモ/実AIモードの説明）

## エンジニアリング（§20 Engineering）
- [x] typecheck pass
- [x] unit test pass（jest, 107件）
- [x] lint（PR15で eslint-config-expo 導入、CIに追加。0 errors）
- [ ] expo-doctor / web export / preview build / secret scan（web exportはCIに導入済み。expo-doctor/preview build/secret scanは残り）

## アクセシビリティ（§20 A11y, PR15＋PR25で対応したコード範囲）
- [x] アイコンのみのボタンにaccessibilityLabel付与（フラッシュ/カメラ切替/検索クリア/お気に入り等の監査・修正。PR25でv3追加分の再訪チップ/実践記録追加・削除/未同定観察削除/部位タグ・写真削除/入手経路選択/関連植物カードにも拡張）
- [x] Reduce Motion対応（`useReduceMotion`フック新設。スキャン中の演出・レア発見時のシマー/スパークル・Skeletonの点滅ループを、OS設定がオンの間は無効化。PR25でv3追加分の新規ループアニメーションにも同じフックが適用済みであることを確認）
- [x] 色だけに依存しない情報伝達（カレンダーの観察数セルにaccessibilityLabelで件数を明示。危険度バッジは既存から色+テキストラベル。PR25で植物詳細の「関連植物」カードの危険度ドット色のみの表現にも日本語ラベルを追加）
- [x] Dynamic Type: `DynamicText`（PR7）で`allowFontScaling`を明示的に有効化
- [x] 入れ子Pressableの解消（PR25でFieldbook v2の再訪予定リストの行内Pressable入れ子を解消し、フォーカス順序を正常化）
- [ ] 🔒 VoiceOver実機での通し確認、Dynamic Type最大時のレイアウト崩れ目視確認（TestFlightでの実機テストに委譲）

## App Store 説明（§17 禁止/推奨）
- 禁止: 「正確に植物を判定」「食べられる野草が分かる」「薬効が分かる」「安全性を保証」「専門家の代わり」「医療用途」
- 推奨: 「植物観察を補助」「候補を比較して学べる」「自分のフィールドノート」「採取・摂取判断には使用しない」
