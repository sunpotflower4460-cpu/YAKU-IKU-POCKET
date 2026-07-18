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
| PR10 | Candidate Results & Compare（複数候補/スコア/比較/安全ブロック） | ✅ merged |
| PR11 | Knowledge Schema（PlantDefinition/taxonomy/50種変換） | ✅ merged |
| PR12 | Explore（検索/高度フィルター/分類/表示切替） | ✅ merged |
| PR13 | Fieldbook（学習系実績/観察カレンダー/外観・AI同意・export・delete設定） | ✅ merged |
| PR14 | Backend & Real Identification（proxy/Pl@ntNet等/taxonomy/rate limit/consent） | ✅ 判断保留（設計メモのみ, merged） |
| PR15 | Accessibility / QA（コード範囲: a11yラベル/Reduce Motion/eslint導入） | ✅ merged |
| **PR16〜PR25** | **v3統合設計図対応**（詳細は`docs/BLUEPRINT_V3.md`） | 🟡 進行中（本PRはPR16） |

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

## PR11 スコープ（本PR）
含む:
- **PlantDefinition型**（`src/types/plantDefinition.ts`）: taxonomy（scientificName/japaneseNames/englishNames/synonyms/family/genus/taxonIds）, classification, morphology, ecology, phenology, safety, culturalUses, lookalikeIds, sourceRefs, reviewStatus
- **50種の派生データ**（`src/data/plantDefinitions.ts`）: 既存`Plant`から実行時に`PlantDefinition`を生成。family/genusは50種全件を確立した植物学的知識に基づき新規付与（`reviewStatus: 'editorial'`）。safety.levelはdanger(GREEN/YELLOW/RED)から機械的にマッピング、confusedWith/lookalikeIdsは既存`safety.ts`から双方向グラフとして導出、culturalUsesは既存`effects`をそのまま転記（医療的断定はしない方針を継続）
- **正直な省略**: taxonIds（GBIF/POWO/iNaturalist/Pl@ntNet/YList）とsourceRefsは実API連携が無いため全件空。toxicPartsは既存warningNoteに明記されている場合のみ抽出（2件）、それ以外は空配列
- **既存永続データへの影響なし**: `Plant`はコード同梱の静的データでAsyncStorageに永続化されていないため、persistのversion変更・migrate拡張は不要（`docs/MIGRATION_PLAN.md`に明記）

含まない（後続へ委譲、意図的にスコープ外）:
- **画面へのPlantDefinition適用**（見分けるポイント/類似種/出典の表示）: 「1PR=1目的」の原則により、既存screenのUIは本PRで変更していない。適用はPR12（Explore）/PR13（Fieldbook）
- **morphology詳細**（葉の形/花弁数等の構造化データ）: 50種分を確度高く用意するには出典付き調査が必要なため、`notes`のみのスパースな型に留めた
- **Observation型への移行**（複数写真/候補/位置情報を持つ観察記録）: `ScanRecord`からの移行はPR13（永続データ形状変更を伴うためversion 2への引き上げが必須）

## 検証（PR11）
- `npm run check`（typecheck + jest 54件、plantDefinitions派生ロジックのテスト10件を追加）green
- テストで検証: 50種全件のfamily/genus充足、taxonIds/sourceRefsが空であること（捏造防止）、danger→safety.levelの正しさ、look-alikeグラフの双方向性、toxicPartsが原文の範囲を超えて記載されていないこと

## PR12 スコープ（本PR）
含む:
- **かな正規化検索**（`src/utils/kana.ts`）: ひらがな入力でカタカナ名（例: 「たんぽぽ」→タンポポ）にも一致。既存の英名/学名検索は維持
- **最近の検索**: セッション内のみ保持する検索履歴チップ（永続化はしない — 簡潔さと今回のスコープを優先）
- **科（family）で探す**（PR11のPlantDefinitionデータを利用）: フィルターに新規追加、実データに基づく
- **危険な類似植物で絞り込み**（`hasDangerousLookalike`、既存`safety.ts`を再利用）: 「危険な類似植物」explore入口を実装
- **表示切替**: グリッド（既存）/ リスト（新規コンパクト行）/ 科でまとめる（`SectionList`、PR11データで実グループ化）
- **未観察カードの学びヒント強化**: `PlantCard`にfamilyHintプロップを追加し、「ヒント」の代わりに科名を表示（既存のヒントモーダルにも科の行を追加）。既存の「???」名称の非表示は変更なし（種の特定情報は漏らさない）

含まない（後続へ委譲、意図的にスコープ外）:
- **地域から探す・近くで記録あり**: 位置情報の収集自体が未実装（PR14/権限まわりの検討が必要）
- **在来/外来・保全状態フィルター**: 実データが無いため実装せず、捏造もしない
- **花の色・葉の形フィルター**: `PlantDefinition.morphology`がPR11で意図的にスパースなため、構造化データが揃うまで見送り
- **地図・季節カレンダー表示**: 地図は位置情報が無く実装不可。季節カレンダーは今後の検討（既存Todayの季節スポットライトと重複するため優先度低）

## 検証（PR12）
- `npm run check`（typecheck + jest 58件、kana正規化テスト4件を追加）green
- Expo web + Playwrightで実機相当の確認: グリッド/リスト/科でまとめる の3表示切替、科フィルター（キク科→6種）と危険な類似植物フィルターの組み合わせ（→ヨモギ1種に正しく絞り込み）をスクリーンショット・実測値で確認済み

## PR13 スコープ（本PR）
含む:
- **観察数ベースのカレンダー**（プロフィール/記録タブ）: 従来の「その日発見した最大レアリティで色分け」を廃止し、その日の観察件数に応じた3段階の濃淡（`OBSERVATION_INTENSITY`）に変更。§7.8「レアリティ色ではなく観察数または多様性」に準拠。各セルに件数を含む`accessibilityLabel`を追加（色だけに依存しない）
- **学習系の実績バッジを4件追加**（`app/(tabs)/profile.tsx`）: 科の探求者（5科以上、PR11の`getPlantDefinitionById`を利用）／メモ魔（メモ10件）／季節をまたぐ観察（同一植物を異なる季節に観察、`seasonForDate`で判定）／危険植物を学ぶ（RED植物の安全情報カードを1回以上確認）。既存9件の収集系実績と合わせて13件に。実績判定は`AchievementContext`という明示的な型にまとめ、`string[]`をそのまま渡す旧実装より意図が明確な形に整理
- **ストア拡張**（`useGameStore.ts`）: `themeOverride`（外観設定）、`aiConsentGiven`（実AI利用への同意）、`viewedSafetyCardPlantIds`（安全カード既読記録、上記実績用）、`hasComparedCandidates`（候補比較を使ったか、上記実績用）を追加。全て新規キーの追加のみで既存フィールドを変更しないため、persistの`version`引き上げは不要（欠損時はデフォルト値にフォールバック）
- **危険度に応じたAI利用モードの動的切り替え**: `isDemoMode(aiConsentGiven)`／`canPersistObservations(aiConsentGiven)`（`src/utils/appMode.ts`）を新設し、実AI利用は「APIキーがある」かつ「ユーザーが同意している」の両方を満たす場合のみに限定（旧実装はAPIキーの有無だけで判定しており、同意なしに実AIが呼ばれ得た）。`scanPlant()`・`plant/[id].tsx`（RED植物の安全カード既読記録）を追随させた
- **設定セクション新設**（記録タブ最下部）:
  - 外観（自動/ライト/ダーク、`themeOverride`）
  - AI画像識別への同意トグル（オフ時はデモモードで動作し写真を外部送信しない旨を明記）
  - データエクスポート（`Share` APIでJSON出力。画像URIは含めず、id/plantId/scannedAtのみの履歴・XP・図鑑・メモ・お気に入りを含む）
  - すべてのデータを削除（`Alert.alert`で確認の上`resetAllData()`）
  - データソース・出典について（`docs/DATA_SOURCES_AND_LICENSES.md`と整合する静的パネル、editorialレベルである旨を明記）
  - プライバシーポリシー・利用規約・お問い合わせ（既存導線を統合）

含まない（後続へ委譲、意図的にスコープ外）:
- **観察タイムライン・地図表示**: 位置情報が未実装のため地図は不可。タイムライン専用画面は既存の「スキャン履歴」リストと重複が大きく、本PRでは既存リストのままとした
- **再解析（候補を選び直して再識別）**: バックエンド/実AIの精度に依存する機能でPR14以降に自然に含まれるため見送り
- **実データ出典（GBIF/POWO等）とのリンク**: PR14（バックエンド）が前提

## 検証（PR13）
- `npm run check`（typecheck + jest 67件、store設定系テスト4件・resetAllDataテスト2件・season純関数テスト2件を追加）green
- Expo web + Playwrightで実機相当の確認: プロフィール画面のカレンダー（凡例「観察数: 少→多」表示）、13件の実績バッジ（新規4件を含む）、設定セクション（外観セグメント切替でライト選択が反映されること、AI同意トグル、データエクスポート/削除、データソース・出典モーダルの開閉）をスクリーンショットで確認済み

## PR14: 判断保留（バックエンド・実AI連携）
統合仕様書§9〜13が要求するバックエンドプロキシ（APIキー非公開化）、Pl@ntNet等の外部識別API連携、taxonomy resolver、レート制限、位置情報同意フロー、observabilityは、いずれも**実際に稼働するサーバーインフラのデプロイ・外部APIの契約・秘密情報の管理**を要し、この開発環境（コードのみのサンドボックス）では安全に実装・検証できない。無理に実装すると「動いているように見えて実際は繋がっていない」機能を作り込むリスクが高く、本プロジェクトが一貫して掲げる「捏造しない」原則に反する。
そのため、**PR14はコード実装を行わず、必要要件を`docs/IDENTIFICATION_PIPELINE.md`（既存）に整理した設計としてのみ残し、実装は次のいずれかの環境が整ってから着手することとする**:
- バックエンド（プロキシ）をデプロイできるサーバー環境
- Pl@ntNet等の外部識別APIキー・契約
- 位置情報の同意UI設計を検証できる実機

現状の`EXPO_PUBLIC_CLAUDE_API_KEY`直呼び出し構成（PR13で「同意なしには呼ばれない」ようゲート済み）はセキュリティ上の既知の妥協点として`docs/APP_STORE_AUDIT.md`に明記済み。

## PR15 スコープ（本PR、コード範囲のアクセシビリティ/QA）
含む:
- **アイコンのみボタンのVoiceOurラベル監査**: 全画面のPressableを棚卸しし、隣接テキストが無い（=VoiceOverが読み上げるものが無い）アイコンのみのボタンに`accessibilityRole="button"`＋`accessibilityLabel`を追加（フラッシュ切替/カメラ切替/結果を表示/検索文字クリア/効果フィルター解除/お知らせを閉じる/お気に入りハート、`app/(tabs)/scan.tsx`・`app/(tabs)/zukan.tsx`・`app/(tabs)/index.tsx`・`src/components/PlantCard.tsx`）。Playwrightのaccessibility snapshotで実際にラベルが読み上げツリーに現れることを確認済み
- **Reduce Motion対応**: 共通フック`src/utils/reduceMotion.ts`（`useReduceMotion`）を新設し、既存Skeletonの個別実装をこれに統合。OSの「視差効果を減らす」相当の設定が有効な間、スキャン中の走査線/スピナー/待機中の脈動アニメーション（`scan.tsx`）とレア発見時のシマー/スパークル演出（`ScanResultModal.tsx`）を無効化（一回きりの入場アニメーションは対象外、継続ループのみ）。Chromiumの`prefers-reduced-motion: reduce`エミュレーションで動作確認済み
- **色だけに依存しない情報伝達の補強**: プロフィールの観察数カレンダーセルに件数・当日か否かを含む`accessibilityLabel`を追加（PR13で導入した濃淡表示への追随）
- **eslint導入**（`eslint-config-expo`）: `npm run lint`スクリプトを新設しCIに追加。React Compiler向けの実験的ルール（`react-hooks/refs`/`react-hooks/set-state-in-effect`/`react-hooks/preserve-manual-memoization`）は、本プロジェクトがCompilerを採用しておらず、かつ長年安定稼働している`useRef(new Animated.Value(...))`等の標準的なRNパターンを一律「エラー」として検出してしまうため無効化（`.eslintrc.js`にコメントで理由を明記）。それ以外の実質的な指摘（未使用変数・`Array<T>`記法統一など）は修正
- **ユニットテスト追加**: `useReduceMotion`フックの初期値解決・OS設定変更への追随を検証する2件

含まない（後続へ委譲、意図的にスコープ外）:
- **VoiceOver実機での通し確認・Dynamic Type最大時のレイアウト崩れ目視確認**: シミュレータ/実機が無いこの開発環境では検証できない。TestFlight実機テスト（`docs/APP_STORE_RELEASE_CHECKLIST.md`）に委譲
- **`react-hooks/exhaustive-deps`警告の一括解消**: 既存の`Animated.Value` refをuseEffectの依存配列に含めるかどうかはRNコミュニティでも意見が分かれ、refは再レンダー間で安定するため省略しても実害が無い。警告のまま残し、CIはブロックしない（errorではなくwarning）
- **E2Eテストの自動化・CI組み込み**: 本セッションで都度実行したPlaywright検証スクリプトは使い捨てで、リポジトリには未コミット。恒久的なE2Eスイート（fixture・CI実行環境の用意）は別途の判断が必要なため見送り
- **アプリアイコン/スプラッシュ/EAS認証情報等の提出物**: 引き続き開発者本人のみ対応可能（`docs/APP_STORE_AUDIT.md`参照）

## 検証（PR15）
- `npm run check`（typecheck + lint + jest 69件）green。lintは0 errors・9 warnings（全て`react-hooks/exhaustive-deps`、Animated.Value refの省略という周知の安全なパターン）
- Expo web + Playwright: `page.emulateMedia({ reducedMotion: 'reduce' })`でスキャン画面のループアニメーションが停止すること、`page.accessibility.snapshot()`で新規追加したaccessibilityLabelが読み上げツリーに現れることを確認済み

## PR16 スコープ（本PR、v3 Product Architecture）
統合設計図v3を受けて、`docs/BLUEPRINT_V3.md`にギャップ分析とPR16〜PR25の計画を新設（v1計画の本ドキュメントを継承・拡張する位置づけ）。

含む:
- **`docs/BLUEPRINT_V3.md`新設**: v3設計図と現状実装の差分（既に満たしている項目/新規に必要な項目/この開発環境の制約）を整理し、PR16〜PR25の実装範囲を明記
- **Feature flags基盤**（`src/constants/featureFlags.ts`）: PR18〜PR23で追加する新機能（現物確認チェックリスト/学習体験/Fieldbook v2/利用ゲート/暮らしハブ/Subject Router）を、実装完了までUIに出さないためのフラグを新設。各PRが自身の機能を実装し終えたときにそのフラグをtrueにする運用とする
- **IA・状態モデルの棚卸し**: v3 §4.1のタブ構成・§7.4の確認レベル分離は既存実装（PR6/PR8）で既に満たされていることを確認し、無用なリネームや型の重複定義は行わない（`IdentificationState`を引き続き単一の確認状態ソースとする）

含まない（後続へ委譲、意図的にスコープ外）:
- `PlantUse`/`SourceOrigin`/`UseEvidenceLevel`等の型定義: 実際に消費するPR21で新設する（未使用の先行スキャフォールドは持たない）
- `TraitCheck`型・現物確認チェックリストUI: PR18
- 150種へのコンテンツ拡充: PR24

## 検証（PR16）
- `npm run check`（typecheck + lint + jest）green（型・ロジック変更なし、ドキュメントと定数追加のみ）

## PR17 スコープ（本PR、Observation Core強化）
含む:
- **撮影写真の永続化**（旧監査フォローアップの恒久対応）: `src/utils/observationPhotoStorage.ts`の`persistObservationPhoto()`が、観察を保存するタイミングでのみ（デモ/破棄した撮影では実行しない）キャッシュディレクトリの写真を`expo-file-system`の`documentDirectory`へコピーし、OSのキャッシュ削除による画像消失を防ぐ。Webは永続/キャッシュの区別が無いためno-op（元のURIをそのまま返す）
- **そのまま記録する（v3 §6.1）**: 実AIが`unidentified`（判定不能）を返した際、従来は写真を破棄してアラートを出すだけだったが、「未特定のまま記録する」選択肢を追加。`recordUnidentifiedObservation`が新設した`unidentifiedObservations`（`UnidentifiedObservation[]`、`ScanRecord`とは独立した配列）に保存する。デモ結果は`usedRealAI: true`の場合にしか`unidentified`状態にならない型設計のため、デモ写真がここに紛れ込むことは構造的に起こらない
- **再訪記録**（v3 §6.1「再訪を記録する」・§9.1「再訪予定」）: `ScanRecord`/`UnidentifiedObservation`双方に任意の`revisitAt`（ISO日付）を追加。植物詳細画面に「再訪を記録する」チップを新設し、2週間後/1ヶ月後/次の季節（3ヶ月後）のプリセットから選べる。ストアアクション`setScanRevisit`/`setUnidentifiedRevisit`は追加のみのフィールドのためversion引き上げ不要
- **IDの衝突バグを修正**: `scan_${Date.now()}`/`unid_${Date.now()}`は同一ミリ秒内に複数レコードを作ると同じIDになり得た（テストで実際に検出）。`src/utils/id.ts`の`generateId()`（タイムスタンプ＋ランダムサフィックス）に統一

含まない（後続へ委譲、意図的にスコープ外）:
- **`unidentifiedObservations`のFieldbook表示・削除UI**: 保存する導線のみ本PRで実装し、記録タブでの一覧表示・並び替え・削除UIはPR20（Fieldbook v2）に含める（`deleteUnidentifiedObservation`アクション自体は用意済み）
- **育てている植物を記録するモード（v3 §6.1）**: 観察モードの追加分岐であり、`SourceOrigin`型（PR21）が無いと入手経路を正しく表現できないため見送り

## 既知の発見（PR17検証中、対応は別PR）
`react-native-web`が`Alert.alert`を実装していないため、Webビルドでは確認ダイアログ（メモ削除・データ全削除・本PRで追加した未特定記録の選択肢・再訪日時選択等、計8箇所）が無音に機能しない。iOS/Android実機（App Store提出の主要ターゲット）では影響しない。詳細と対応方針は`docs/APP_STORE_AUDIT.md`に記載。

## 検証（PR17）
- `npm run check`（typecheck + lint + jest 79件、observationPhotoStorage/id/store新規テストを追加）green
- Expo web + Playwright: 植物詳細画面にスキャン履歴を注入し、「再訪を記録する」チップの表示・タップ動作を確認（`Alert.alert`がWebで発火しないため選択肢の見た目はネイティブ実機でのみ最終確認可能、上記の既知の発見として記録）

## 既存改善の回帰防止（§1）
ハイドレーション後セッション開始 / ローカル日付 / カメラ拒否→設定誘導 / ErrorBoundary / モーダル戻る / 画像フォールバック / モック明示 / 危険警告 / TS strict / プライバシー導線枠 / typecheck。CIで typecheck+test＋禁止語grepにより後退を検知。
