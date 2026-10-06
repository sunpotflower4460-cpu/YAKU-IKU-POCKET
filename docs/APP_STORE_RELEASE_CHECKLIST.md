# App Store 提出チェックリスト

> Release source of truth: [APP_STORE_RELEASE_FINALIZATION.md](./APP_STORE_RELEASE_FINALIZATION.md)  
> このチェックリストは提出直前の実行確認用。設計判断・優先順位・完了条件は上記Finalization Designを優先する。  
> ✅=完了 / ⬜=未 / 🔒=開発者アカウント・公開URL・実機等が必要

## R0 — Release baseline

- [ ] PR #42（Living Field Guide UI/UX刷新）をレビューしてmainへマージ
- [ ] マージ後mainでCI成功
- [ ] リリース期間中はmainをPR＋CI経由に限定
- [ ] Release Candidateまでは無関係な機能追加を止める

## R1 — Safety / Plant content

### 既存の安全基盤
- [x] 本番AI失敗時にランダム植物を返さない
- [x] `unidentified` / `out_of_scope` / `error` を正式状態として扱う
- [x] デモ結果でXP・履歴・図鑑を更新しない
- [x] 危険類似種を `SafetyBanner` で表示する基盤がある
- [x] RED 14種に明示的なsourceRefsがある
- [x] UI禁止語（食用可 / 食用可能 / 食用植物 / 安全な収穫 / AI認識精度）をCIで監視

### 公開前に残る安全監査
- [ ] 150種すべてのmedical / health efficacy copyを再監査
- [ ] 「咳止め / 貧血改善 / 睡眠改善 / 記憶力向上 / 利尿作用 / 抗炎症」等を、必要に応じて伝統利用・文化記録表現へ変更
- [ ] アシタバ ↔ チョウセンアサガオを公的根拠付きで確認/追加
- [ ] ゴマ ↔ チョウセンアサガオを公的根拠付きで確認/追加
- [ ] ギョウジャニンニク ↔ イヌサフランを確認/追加
- [ ] オオバギボウシ / ギボウシ類 ↔ イヌサフランを確認/追加
- [ ] セリ ↔ タガラシ、ノビル ↔ ヒガンバナを確認/追加
- [ ] ゲンノショウコ ↔ トリカブトを確認
- [ ] ヨモギ ↔ トリカブトの現在の根拠を再確認
- [ ] RED / safety-critical YELLOWの警告強度を出典本文と照合
- [ ] medical/safety-copy回帰監査をCIへ追加
- [ ] 旧監査文書の「医学的断定は解消済み」等を最終実装と一致させる

## R2 — Identification state integrity

- [ ] `IdentificationState` をScan/Observationへ永続化
- [ ] AI候補のみ = `candidates`
- [ ] ユーザー選択 = `user_selected`
- [ ] `expert_verified` を実際の専門家イベントなしに生成しない
- [ ] `useGate` が推定状態ではなく保存済み状態を参照
- [ ] 低信頼/未解決候補の保守的Gateを追加
- [ ] persist migration / malformed state / duplicate save回帰テストを維持

## R3 — Expo / native toolchain

- [ ] Expo 52 → 53
- [ ] 53 → 54
- [ ] SDK54でNew Architectureを明示検証
- [ ] `observationPhotoStorage.ts` のFileSystem互換性を修正（必要なら `expo-file-system/legacy`）
- [ ] 54 → 55
- [ ] 55 → 56
- [ ] 56 → 57
- [ ] SDK57対応React Native / Router / native modulesへ統一
- [ ] Reanimated直接依存の必要性を再確認し、必要なら対応版へ移行
- [ ] `userInterfaceStyle: automatic` に必要なsystem UI設定を検証
- [ ] 各段階で typecheck
- [ ] 各段階で lint
- [ ] 各段階で Jest
- [ ] 各段階で web export
- [ ] 各段階で `expo-doctor`
- [ ] 最終SDKでcamera / filesystem / router / AsyncStorage / themeをnative smoke test
- [ ] `npm audit --omit=dev --audit-level=high` を再評価
- [ ] 許容状態確定後、production dependency auditをblockingへ戻す

## R4 — Production AI / Security

- [ ] Claude呼び出しを自前Backend/Edge Proxyへ移行
- [ ] Anthropic API keyをサーバーSecretのみで保持
- [ ] `EXPO_PUBLIC_CLAUDE_API_KEY` を配布クライアントから削除
- [ ] クライアントから `api.anthropic.com` への秘密鍵付き直呼びを削除
- [ ] 画像最大5枚をサーバーでも強制
- [ ] MIME / 容量 / request sizeを検証
- [ ] 画像をdecode→resize→re-encodeしメタデータを落とす
- [ ] rate limit
- [ ] timeout
- [ ] daily/provider cost ceiling
- [ ] AIレスポンスをサーバーでもschema validation
- [ ] 写真/base64/raw prompt/raw responseを永続ログへ残さない
- [ ] 429 / 5xx / timeout / malformed responseでもランダム結果を返さない
- [ ] secret scan（gitleaks/TruffleHog等）を実行

## R4 — Privacy / Consent

- [ ] AI ON初回に明示的な同意画面
- [ ] 送信先としてAnthropic / Claudeを明示
- [ ] 送信する情報 = 植物写真、と明示
- [ ] v1で送信しない情報（位置・名前・メモ・履歴等）を実装と一致させる
- [ ] 同意OFFで以後の外部送信を停止
- [ ] 既送信データは第三者保持ポリシーに従うことをPrivacy Policyへ記載
- [ ] Anthropicの実契約/設定の保持期間・学習利用条件を提出直前に再確認
- [x] 端末内「すべてのデータを削除」
- [x] 観察データのユーザー主導エクスポート
- [ ] identified observationの個別削除（P1、可能ならv1）
- [ ] final App Privacy回答を実装から確定
- [ ] final native buildでPrivacy Manifest / required-reason API警告を確認

## R5 — Public URLs / Store assets

- [ ] 🔒 本番Privacy PolicyをHTTPS公開
- [ ] 🔒 本番TermsをHTTPS公開
- [ ] 🔒 Support URLをHTTPS公開
- [ ] `PRIVACY_POLICY_URL` のexample.comを削除
- [ ] `TERMS_URL` のexample.comを削除
- [ ] アプリ内リンクとApp Store ConnectのURLを一致
- [ ] 🔒 本番App iconへ差し替え
- [ ] 🔒 本番splashへ差し替え
- [ ] Android adaptive icon / Web faviconも本番素材へ
- [ ] iPhone App Store screenshot 5〜7枚を作成
- [ ] スクリーンショットに「正確に判定」「食べられる」「薬効が分かる」等の危険訴求を使わない

## R5 — EAS / App Store Connect

- [ ] 🔒 EAS projectId / owner
- [ ] 🔒 Apple ID
- [ ] 🔒 App Store Connect App ID
- [ ] 🔒 Apple Team ID
- [ ] Production build number/version確認
- [ ] App name / subtitle
- [ ] Description
- [ ] Keywords
- [ ] Primary / Secondary category
- [ ] Copyright
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] App Privacy
- [ ] Age Rating
- [ ] Review contact
- [ ] Reviewer Notes
- [ ] export compliance回答を最終buildと一致

## R6 — Automated release evidence

Release Candidate SHAに対して以下を記録する。

- [ ] `expo-doctor`
- [ ] typecheck
- [ ] lint
- [ ] Jest（suite/test件数も記録）
- [ ] web export
- [ ] production dependency audit
- [ ] secret scan
- [ ] native production/preview build
- [ ] Privacy Manifest確認
- [ ] build identifier / TestFlight build number
- [ ] App Privacy回答snapshot
- [ ] Age Rating回答snapshot

## R6 — TestFlight real-device QA

詳細は [UI_UX_RELEASE_QA.md](./UI_UX_RELEASE_QA.md) を使用。

最低限:

- [ ] 小型iPhone相当
- [ ] 標準iPhone
- [ ] 大型iPhone
- [ ] Light / Dark
- [ ] VoiceOver
- [ ] 最大Dynamic Type
- [ ] Reduce Motion
- [ ] fresh install
- [ ] persisted-state migration
- [ ] camera初回許可
- [ ] camera拒否→Settings復帰
- [ ] 1枚撮影
- [ ] 複数枚撮影
- [ ] unidentified
- [ ] out_of_scope
- [ ] dangerous candidate / look-alike
- [ ] AI consent OFF
- [ ] AI consent ON
- [ ] offline
- [ ] backend timeout
- [ ] 429
- [ ] provider 5xx
- [ ] malformed provider payload
- [ ] history 100件境界
- [ ] 全データ削除
- [ ] export
- [ ] background / foreground
- [ ] 日跨ぎ

## R7 — Submission

- [ ] すべてのP0が完了
- [ ] Finalization DesignのRelease Completion Definitionを満たす
- [ ] RC commit SHAを固定
- [ ] 審査中は新機能を追加しない
- [ ] Reviewer Notesを最終buildと照合
- [ ] App Store Connectへ提出
- [ ] rejection時は指摘原因だけを最小修正
- [ ] 承認build/commit/tagを記録

## App Store copy guardrails

### 禁止方向
- 「正確に植物を判定」
- 「食べられる野草が分かる」
- 「安全に採取できる」
- 「薬効が分かる」
- 「症状を改善する植物が分かる」
- 「専門家の代わり」
- 「安全性を保証」

### 推奨方向
- 「植物観察を補助」
- 「候補を比較して学べる」
- 「危険な類似植物も一緒に確認」
- 「自分のフィールドノート」
- 「伝統的な利用や植物文化を学ぶ」
- 「採取・摂取判断には使用しない」
