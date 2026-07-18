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

## PR18 スコープ（本PR、Compare in the Field）
含む:
- **`TraitCheck`型と現物確認チェックリスト**（v3 §7.1/§7.3）: `src/types/traitCheck.ts`に`TraitCheck`（traitId/state/userNote）と、UI用の`TraitDefinition`（id/label/referenceHint）・`summarizeTraitChecks()`を新設
- **チェック項目の生成**（`src/utils/traitChecklist.ts`）: `PlantDefinition.morphology`が意図的にスパース（PR11の判断を継続）なため、葉の形・花弁数のような構造化された形態属性を捏造しない。代わりに、既に画面表示している実データ（`plant.habitat`/`plant.season`/`plant.description`、および`safety.ts`の危険類似種`note`）だけから確認項目を組み立てる。危険類似種を持つ植物には「{類似種名}との違い」という項目が自動追加される
- **`ScanResultModal`への統合**: 実AI・非デモ結果のときのみ（`FEATURE_FLAGS.compareInField`）「目の前の植物と見比べる」セクションを表示。各項目に一致/違う/分からないの3ボタンと「一致 X　不一致 Y　未確認 Z」の集計を表示。候補を切り替えると（`plant.id`変化）チェックはリセットされる
- **保存時の連携**: `onAddToZukan`のシグネチャを`(traitChecks: TraitCheck[]) => void`に変更し、`ScanRecord.traitChecks`（追加のみ・version引き上げ不要）へ保存。`recordObservation(plantId, imageUri?, traitChecks?)`

含まない（後続へ委譲、意図的にスコープ外）:
- **保存済みチェック結果のFieldbook表示**: 記録タブでの一覧・振り返り表示はPR20（Fieldbook v2）
- **チェック結果に基づく候補再ランキング**: AIの候補スコアをユーザーのチェック結果で再計算する機能は、実装するとチェック自体の意味（人間による独立した確認）が薄れるため見送り。v3もそこまでは要求していない

## 検証中に発見・修正したテスト基盤の問題（PR18）
`ScanResultModal`のマウント時`useEffect`（チェックリストのリセット）が、`TestRenderer.create()`を`act()`で包まずに呼ぶテストでは次の`act()`呼び出しまで遅延され、ユーザー操作後のstate更新をその場で打ち消してしまうことをテスト作成中に発見（本番では、マウントのeffectは常にユーザー操作より先に完了するため実害はない）。新規テストはすべて`act()`でラップして解消。

## 検証（PR18）
- `npm run check`（typecheck + lint + jest 86件、traitChecklistテスト4件・ScanResultModalの現物確認チェックリストテスト3件を追加）green
- Expo web + Playwrightでデモモード（観察タブ）に回帰が無いことを確認。現物確認チェックリストは実AI限定のためAPIキーの無いこの環境ではUIを直接操作できず、コンポーネントテストで一致/不一致/未確認の集計・保存時の受け渡し・候補切替時のリセットを検証

## PR19 スコープ（本PR、Learning Experience）
含む:
- **植物詳細画面を3段階学習構成に再編**（v3 §8.2）: `app/plant/[id].tsx`の情報を「30秒で知る」（常時表示: 説明・生息地・旬の時期・危険/類似種の注意を1件だけ要約）／「3分で見分ける」（開閉式: 科・属＋危険な類似種ごとの見分けメモ＋「観察して現物と見比べる」で観察タブへ誘導）／「深く学ぶ」（開閉式: 学名・科・属の詳細、伝統的な用途・言い伝え〈既存位置から移設〉、データの確度・出典）に再編成。アコーディオン式（`ExpandableTier`コンポーネント新設）で同時に開くのは1つ
- **既存データの再配置のみ、新規コンテンツは無し**: `PlantDefinition`（PR11）の`taxonomy.family`/`genus`を初めて画面に表示するが、これは既に存在するeditorialレベルのデータ。安全類似種の`note`（`safety.ts`、PR6）も既存データをそのまま活用

含まない（後続へ委譲、意図的にスコープ外）:
- **確認クイズ**（v3 §8.2「3分で見分ける」の一部）: プレースホルダーの設問・正解を用意すると事実として誤った内容を作り込むリスクがあるため、実データに基づいた設問セットが用意できるまで見送り
- **名前の由来**（v3 §8.2「深く学ぶ」の一部）: 語源情報は出典付きで調べる必要があり、確度の低い推測を書かない方針のため空欄のまま
- **視覚教材**（葉序アニメーション/花の構造図/分布マップ等、v3 §8.3）: 実素材が無く、テキストベースの範囲に留める
- **テーマ別学習コース**（v3 §8.4、「春の身近な野草」等）: 複数植物を横断するコンテンツ企画であり、既存のExplore（PR12）の科・危険類似種フィルターと重複が大きいため独立実装を見送り

## 検証（PR19）
- `npm run check`（typecheck + lint + jest 86件）green。既存コンポーネント・ストアへの変更なし（画面のみの再編）のためユニットテストの追加は無し（`app/`配下の画面はこのリポジトリの既存の慣習どおりPlaywrightで検証）
- Expo web + Playwright: 危険類似種のある植物（ノビル、p007）で「3分で見分ける」がスイセン/スズランとの違いを表示すること、危険類似種の無い植物（タンポポ、p001）で「危険な類似種は登録されていません」と正直に表示されること、「深く学ぶ」展開時に学名・科・属・伝統的用途・データの確度が表示されること、アコーディオンが1つずつ開閉することをスクリーンショットで確認

## PR20 スコープ（本PR、Fieldbook v2）
含む:
- **未同定の観察の一覧・削除UI**（v3 §6.1/§9.2「未同定」）: PR17で保存導線のみ実装した`unidentifiedObservations`を、記録タブに一覧表示（サムネイル代替のクエスチョンマーク・メモ・日時）し、`deleteUnidentifiedObservation`で個別削除できるようにした
- **再訪予定の集約表示**（v3 §9.2「再訪」）: PR17で追加した`ScanRecord.revisitAt`/`UnidentifiedObservation.revisitAt`を横断して集約し、日付昇順で一覧表示。タップで植物詳細へ遷移（特定済みのみ）、×ボタンで予定を取り消せる
- **季節別内訳**（v3 §9.2「季節別」）: 既存の`seasonForDate`（PR13で抽出済みの純関数）を再利用し、観察履歴を春夏秋冬で集計する小さな統計行を追加
- **検索**（v3 §9.3「自然言語検索」の誠実な縮小版）: 植物名・メモ本文に対する正直な部分一致検索。「去年の春に見た黄色い花」のような自然言語解析は、この開発環境のAIインフラでは誠実に実装できないため行わない（後述）
- **データエクスポートの拡充**: `unidentifiedObservations`と`revisitAt`をJSON出力に追加

含まない（意図的にスコープ外、理由を明記）:
- **地図表示**（v3 §9.2「地図」）: 位置情報の収集自体が未実装（PR14判断保留に含まれる）ため実装不可
- **場所別**（v3 §9.2）: 地図と同じ理由で位置情報が無いため見送り
- **真の自然言語検索**: 「川沿いで見た」のような文脈理解にはAI解析が必要で、実装すると動いていないのに動いているように見せることになるため、正直な部分一致検索に留めた
- **観察アルバム自動生成・月間/年間レポート・PDF/CSVエクスポート**: 既存のJSON共有エクスポートで代替可能な範囲とし、新規のレポート生成機能は別途の判断が必要なため見送り
- **タイムライン専用画面・写真類似検索**: 既存のスキャン履歴リスト（検索対応済み）と重複が大きいため独立画面は作らない

## 検証（PR20）
- `npm run check`（typecheck + lint + jest 86件）green。既存のストア/ユーティリティを再利用する画面追加のためユニットテストの追加は無し
- Expo web + Playwright: localStorageに複数の観察・未同定記録・再訪予定を注入し、季節別内訳（夏2件）・再訪予定の集約表示（特定済み/未特定の両方、日付順）・未同定の観察一覧・検索ボックスでの部分一致絞り込み（「ノビル」入力→該当1件に絞込）が正しく動作することをスクリーンショットで確認

## PR21 スコープ（本PR、Uses Safety Architecture）
v3 §10「料理・生活利用ハブ」の中核原則「識別候補から直接『食べる』へ誘導しない」を支える型とゲートロジックのみを実装する（UIはPR22）。

含む:
- **型定義**（`src/types/plantUse.ts`）: `SourceOrigin`（入手経路7種）、`UseEvidenceLevel`（証拠レベル6段階＋日本語ラベル）、`PlantUse`（category/allowedOrigins/evidenceLevel/preparation/warnings/contraindications/sourceRefs等）、`UseGate`（gate0〜gate3）
- **ゲート判定ロジック**（`src/utils/useGate.ts`）:
  - `determineMaxGate()`: 識別状態（既存の`IdentificationState`、PR6から再利用）が`user_selected`/`community_supported`/`expert_verified`のいずれでもない場合、または危険な類似種がある場合は常にgate0（学習のみ）に固定。入手経路が店舗購入・栽培品確認済みの場合のみgate2に到達可能。野生観察・野生採取はgate1止まり（本アプリはgate3＝採取手順の提供に初版では対応しないため）
  - `requiredGateForCategory()` / `isCategoryUnlocked()`: 利用カテゴリ（食べる/飲む/栽培/保存/クラフト等）ごとに必要な最低ゲートを判定。摂取系（食べる/飲む/伝統薬用）は常にgate2以上を要求し、gate1では絶対に解放されない

含まない（後続へ委譲、意図的にスコープ外）:
- **暮らしタブUI・実際のPlantUseコンテンツ**: PR22。特に、既存の`effects`タグ（伝統的用途）を`PlantUse`レコードへ変換する際、具体的な調理手順・分量等を捏造しないという方針の設計判断が必要なため次PRへ
- **`PracticeRecord`（実践記録）**: PlantUseコンテンツが無い状態では実践記録も作れないため同じくPR22

## 検証（PR21）
- `npm run check`（typecheck + lint + jest 95件、useGateのゲート判定ロジックテスト9件を追加）green
- 型定義のみ・UIへの結線なしのためPlaywright検証は無し（消費側のPR22で実施）

## PR22 スコープ（本PR、Cooking & Living Hub）
v3 §10-§11「暮らしタブ」をPR21のゲートロジックの上に実装。**この開発環境には検証済みの調理法・分量・下処理手順の出典が無いため、具体的なレシピは一切捏造しない**という制約のもとで設計した。

含む:
- **`src/data/plantUses.ts`**: 植物ごとに`PlantUse[]`を導出する`getPlantUses()`。中身は「捏造しない」方針を満たす2種類のみ:
  (a) 汎用的で植物固有の事実を要さない活動（観察・記録する=gate0、押し花・スケッチにする=gate1）
  (b) 既存の`effects`タグ（伝統的用途、PR6以前から存在）をそのまま`culture`カテゴリの情報として提示（`evidenceLevel: 'traditional_record'`、既存の免責文言を継続）
  GREEN（危険度低）植物のみ`food`カードを追加するが、中身は「確認済みの調理法データは準備中です」という正直な保留表示で、具体的な手順・分量は一切書かない
- **植物詳細画面に「暮らしに活かす」開閉式セクションを追加**（4つ目のExpandableTier）: 入手経路の選択（最新の観察記録に紐づけ）→ PR21の`determineMaxGate`で確認レベルを算出 → 各`PlantUse`カードを`isCategoryUnlocked`で判定し、未解放カードは理由（必要な確認レベル）を表示（v3 §11.1「利用不可または情報不足のカードは理由を示す」）
- **安全性の多重防御**: `determineMaxGate`に`plantDanger`引数を追加し、RED（本質的に危険）な植物は入手経路に関わらず常にgate0に固定（コンテンツ生成側でfoodカードを出さない実装と合わせた二重の安全策）
- **`PracticeRecord`（実践記録）**: `plantId`/`category`/`note`のみのシンプルな自由記述ジャーナル。既存の「養生メモ」パターン（TextInput+保存ボタン）を踏襲し、`Alert.prompt`（iOS専用でAndroid/Webでは動作しない既知の問題があるAPI）は使わずクロスプラットフォームなインラインフォームにした

含まない（意図的にスコープ外、理由を明記）:
- **実際の料理・お茶・保存・クラフトの手順コンテンツ**: 検証済みの出典が無いため、gate2に到達しても具体的な手順は表示しない。将来、専門家監修または信頼できる出典が得られた場合に追加する
- **入手経路の観察単位での永続的な使い分け**: 現状は「この植物の最新の観察記録」に入手経路を1つだけ紐づける簡易実装。複数の入手経路を同時に持つケース（例: 野生でも観察したし店でも買った）は将来の拡張

## 検証（PR22）
- `npm run check`（typecheck + lint + jest 103件、plantUses/useGate安全策のテストを追加）green
- Expo web + Playwright: 観察記録が無い植物では「まず観察してください」の案内、入手経路未選択時はgate0でobserve/cultureのみ解放、「購入した食材」選択後はgate2に到達しpress/foodカードが解放されること（foodは「準備中」の正直な表示）、RED植物（トリカブト）では入手経路を選んでもgate0のまま（安全策）であることをスクリーンショットで確認

## PR23 スコープ（本PR、Subject Router）
v3 §12「何でも撮るための対象ルーター」を実装。写真が種子植物・シダ植物以外（キノコ・昆虫・動物・食材・人工物等）だった場合に、無理に植物として識別しようとせず、正直な被写体カテゴリと案内を返す。

含む:
- **`src/types/subject.ts`**: `SubjectCategory`（11分類）、カテゴリ別の正直な案内文（`SUBJECT_CATEGORY_GUIDANCE`）とラベル（`SUBJECT_CATEGORY_LABEL`）
- **Claude Visionプロンプトの拡張**（`src/utils/claudeAI.ts`）: 既存の1リクエストの中で、種の候補を挙げる前に`subjectCategory`を先に分類させる。`vascular_plant`と判定された場合のみ候補マッチングに進み、それ以外は`ClaudeScanOutcome`の新しい`out_of_scope`状態（category+guidance）を返す。未知・未対応の分類文字列は`vascular_plant`と誤認せず`unclear`にフォールバック
- **`scan.tsx`への統合**: `out_of_scope`結果に対して、カテゴリ名＋案内文のアラートを表示し、「写真を撮り直す」「別の写真を追加する」「判定せず記録する」（PR17の`recordUnidentifiedObservation`を再利用）の選択肢を提示。植物識別の対象外でも記録価値を失わせない（v3 §5 Flow A）

含まない（意図的にスコープ外、理由を明記）:
- **独立した被写体分類器**: v3 §17の設計原則（LLM一つに識別と説明を同時にさせない）とは異なり、既存のClaude Vision 1リクエスト内で分類も行う設計にした。別プロバイダの分類特化モデルを追加するとAPIコスト・レイテンシが増え、この環境では精度検証もできないため。`docs/IDENTIFICATION_PIPELINE.md`に設計上の妥協点として明記
- **カテゴリ別の詳細ガイド**（例:「キノコ図鑑」等）: 植物識別対象外のカテゴリに対する専用コンテンツは本アプリのスコープ外（v3 §0「日本の身近な野草・薬用植物・ハーブ」が主領域）

## 検証（PR23）
- `npm run check`（typecheck + lint + jest 107件、Subject Routerのテスト4件を追加。既存のclaudeAI.test.tsのモックレスポンスに`subjectCategory: 'vascular_plant'`を追加して回帰を防止）green
- テストで検証: 11分類全てが正しく`out_of_scope`にルーティングされること、`subjectCategory`欠落時に`vascular_plant`と誤認せず`unclear`にフォールバックすること、Claude側が指示を無視して`identified: true`＋候補を返してきても`vascular_plant`以外なら無視されること（プロンプトインジェクション耐性）
- Expo web + Playwrightでデモモード画面に回帰が無いことを確認（Subject Routerは実AI限定のためAPIキーの無いこの環境ではUIを直接操作できない）

## 既存改善の回帰防止（§1）
ハイドレーション後セッション開始 / ローカル日付 / カメラ拒否→設定誘導 / ErrorBoundary / モーダル戻る / 画像フォールバック / モック明示 / 危険警告 / TS strict / プライバシー導線枠 / typecheck。CIで typecheck+test＋禁止語grepにより後退を検知。
