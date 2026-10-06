> **Global Plant Brain boundary note (2026-10-06):** [global-plant-brain/00_OVERVIEW.md](./global-plant-brain/00_OVERVIEW.md) 以下に長期設計を追加していますが、初回App Store公開のP0/P1判断では引き続き本書が優先されます。Global Brain全体の完成は初回リリース条件ではありません。

# App Store Release Finalization Design

> Status: **ACTIVE / release source of truth**  
> Last updated: 2026-10-06  
> Baseline audited: `main@c3bf5b482cca4bdae21f065130adf7d5106e1b89`  
> Scope: iOS App Store initial release of 薬育ポケット  
> Related: `APP_STORE_RELEASE_CHECKLIST.md`, `SAFETY_POLICY.md`, `IDENTIFICATION_PIPELINE.md`, `DATA_SOURCES_AND_LICENSES.md`, `UI_UX_RELEASE_QA.md`

## 0. Purpose

This document consolidates the five-pass repository audit and five-pass App Store / Expo / safety research completed before the initial App Store release.

For release-finalization decisions, this document is the newest source of truth. Older audit documents remain useful historical records, but when an older checklist or audit conflicts with this document, **this document wins until the conflict is explicitly reconciled**.

The goal is not to add another large feature set. The product is already in the finalization phase. Remaining work is primarily:

1. safety/content normalization,
2. identification-state integrity,
3. supported iOS/Expo toolchain migration,
4. production AI/backend/privacy architecture,
5. App Store assets and metadata,
6. TestFlight evidence and release discipline.

---

## 1. Release decision

Current status: **ACCEPT WITH RELEASE BLOCKERS**.

The application architecture, core observation flow, collection/field-note features, local persistence, accessibility work, error handling, candidate comparison, dangerous-lookalike warnings, and demo/production separation are strong enough to continue toward release.

The app must **not** be submitted until all P0 release gates in this document are satisfied.

### 1.1 Product positioning for v1

薬育ポケット v1 is a:

> **植物観察・見分け学習を補助する収集型フィールドノート / Living Field Guide**

It is **not** positioned as:

- a definitive plant identification service,
- an edibility decision tool,
- a foraging safety guarantee,
- a medical diagnosis/treatment tool,
- a replacement for a botanist, medical professional, poison-control service, or other expert.

Recommended App Store category direction:

- Primary: **Reference**
- Secondary: **Education**

Final category selection must match the submitted product and App Store Connect options at submission time.

### 1.2 Core safety promise

The app must preserve these invariants:

- AI returns **candidates**, never guaranteed truth.
- AI failure / timeout / malformed output never falls back to a random real result.
- Demo mode never creates durable discovery/XP/history state.
- Dangerous look-alikes are surfaced before use-oriented content.
- RED/high-risk plants never unlock ingestion/use guidance.
- The app never asserts that a wild specimen is safe to ingest.
- User confirmation state, source/origin, and expert verification must not be conflated.
- Safety claims should be no stronger than their source evidence.

---

## 2. Current audited baseline

### 2.1 Repository / UI

- Current audited main SHA: `c3bf5b482cca4bdae21f065130adf7d5106e1b89`.
- Open PR #42: **UI/UX刷新: Living Field Guide体験を世界水準へ**
  - one commit ahead of the audited main baseline,
  - mergeable,
  - CI success,
  - Vercel status success,
  - CodeRabbit status success,
  - reported verification: TypeScript, ESLint, 24 Jest suites / 167 tests, web export.
- Recommendation: **merge PR #42 before SDK migration** and use the merged state as the release-finalization UI baseline.
- Main branch was observed without branch protection. Before release work becomes destructive/high-risk, require PR + successful CI for main.

### 2.2 Data set

The current plant catalog contains **150 plants**:

- GREEN: 109
- YELLOW: 27
- RED: 14

High-risk source coverage in `plantDefinitions.ts` at audit time:

- RED: 14 / 14 have explicit source references.
- YELLOW: 5 / 27 have explicit source references.
- GREEN: 0 / 109 have explicit source references.

This does **not** mean every GREEN/YELLOW entry requires a release-blocking citation for every descriptive field. It means safety-critical claims and high-risk relationships need source-scoped evidence rather than implying one URL validates an entire plant record.

---

## 3. Release priorities

### P0 — must finish before App Store submission

1. Merge/review PR #42 and establish a release baseline.
2. Re-audit all 150 plant records for medical/health efficacy wording.
3. Close known dangerous-lookalike gaps using public/authoritative evidence.
4. Persist real identification state instead of inferring `user_selected` from “record exists”.
5. Upgrade Expo SDK 52 through supported intermediate versions to **Expo SDK 57 / compatible RN 0.86 line**.
6. Repair `expo-file-system` compatibility during the SDK migration.
7. Move Claude/Anthropic calls behind a backend proxy; remove client-shipped Anthropic secrets.
8. Add explicit third-party AI disclosure/consent naming Anthropic/Claude and the transmitted data.
9. Publish real Privacy Policy, Terms, and Support pages; remove `example.com` placeholders.
10. Replace placeholder production icon/splash assets.
11. Configure EAS / App Store Connect identifiers and build credentials.
12. Complete App Privacy, age rating, screenshots, description, keywords, support URL, review contact, and reviewer notes.
13. Build with a current Apple-supported toolchain and pass TestFlight real-device QA.
14. Run release secret scan and freeze a release candidate SHA.

### P1 — strongly recommended before initial release

1. Add a conservative low-confidence / unresolved-candidate gate that does not depend only on LLM self-reported confidence.
2. Upgrade source references from bare URL arrays to scoped evidence metadata.
3. Add a single-observation delete flow for identified records and associated managed photos.
4. Make `expo-doctor`, production dependency audit, secret scan, and native preview/production build part of release evidence.
5. Make the production dependency audit blocking once the SDK/toolchain migration is complete.
6. Verify Privacy Manifest / required-reason API output in the final native build.
7. Require PR + CI on main during release finalization.
8. Reconcile stale documentation (test counts, catalog size, completed safety claims) with actual release state.

### P2 — may ship after v1 if the v1 experience remains coherent

- Persist all captured specimen photos rather than only the primary photo.
- Replace web-only `Alert.alert` gaps with cross-platform modal equivalents.
- Consider Anthropic Zero Data Retention if scale/commercial needs justify it.
- Add location/regional context only if a later identification design clearly needs it.
- Add cloud account/sync only with a separate privacy/account-deletion design.

---

## 4. Safety and plant-content finalization

### 4.1 Medical / efficacy copy is not fully closed

Previous audit text states that medical assertions were removed. The five-pass release audit found that the underlying `plants.ts` data still includes many efficacy-style labels.

A conservative keyword audit found **61 plant records** containing terms in the family of:

- 利尿作用
- 抗炎症
- 抗菌作用
- 咳止め
- 貧血改善
- 睡眠改善
- 記憶力向上
- 血行促進
- 肝臓保護
- 免疫サポート
- 頭痛緩和
- デトックス
- other symptom/physiology-oriented claims

The UI wrapper “伝統的な用途・言い伝え” plus a disclaimer is useful, but it does not fully neutralize a strong efficacy statement such as “咳止め” or “貧血改善”.

#### Required v1 policy

Prefer content of the form:

- historical/cultural use,
- traditional-record framing,
- observational/botanical facts,
- explicit uncertainty/evidence status,

rather than direct treatment/improvement claims.

Example direction:

- Avoid: `咳止め`
- Prefer: `民間利用では、喉や呼吸器に関する用途が記録されてきた`

- Avoid: `睡眠改善`
- Prefer: `リラックスを目的とした伝統的利用がある`

This pass must be done across the data source itself, not only by adding another disclaimer around the UI.

#### CI protection

Add a medical/safety-copy audit step that either:

- blocks prohibited high-risk phrasing, or
- requires an explicit evidence/status exception.

The exact vocabulary list may evolve, but the release process must prevent old treatment-style language from silently returning.

### 4.2 Dangerous-lookalike graph

The existing safety model is a strong foundation but is incomplete relative to public poisoning guidance.

Known relationships requiring verification/addition include:

- アシタバ ↔ チョウセンアサガオ
- ゴマ ↔ チョウセンアサガオ
- ギョウジャニンニク ↔ イヌサフラン
- オオバギボウシ / ギボウシ類 ↔ イヌサフラン
- セリ ↔ タガラシ (verify exact intended representation)
- ノビル ↔ ヒガンバナ
- ゲンノショウコ ↔ トリカブト (verify/add based on authoritative source)

Also re-check the current ヨモギ ↔ トリカブト relation. Keep it only if a suitable public/authoritative basis is attached; do not substitute an unverified relationship merely because it sounds plausible.

### 4.3 Warning strength must match evidence

High-risk warnings must remain prominent, but wording should not exceed the cited source.

For every RED entry and safety-critical YELLOW entry, verify:

- toxic part(s),
- ingestion/handling warning,
- look-alike relationship,
- incident framing,
- whether heat/cooking affects risk,
- whether contact/skin absorption claims are actually supported,
- source scope.

Do not weaken a real danger; instead make the danger **precisely evidence-backed**.

### 4.4 Source-reference model

Current `sourceRefs: string[]` is too coarse because one URL can appear to validate taxonomy, toxicity, traditional use, and preparation simultaneously.

Target shape:

```ts
type SourceScope =
  | 'taxonomy'
  | 'morphology'
  | 'toxicity'
  | 'lookalike'
  | 'traditional_use'
  | 'food_use'
  | 'incident'
  | 'other';

interface SourceRef {
  title: string;
  publisher: string;
  url: string;
  accessedAt?: string;
  scope: SourceScope[];
  evidenceStatus?: 'official' | 'peer_reviewed' | 'editorial';
}
```

Full source migration for every non-critical descriptive sentence is not required to ship v1. **Safety-critical statements must have clear scope first.**

### 4.5 Expert review

A full expert review of all 150 entries is desirable but is not automatically a hard v1 blocker if:

- editorial status is clearly disclosed,
- high-risk data is source-backed,
- medical efficacy claims are normalized,
- the app does not present itself as professional verification.

If/when an expert reviews an entry, the UI/data must record that status explicitly rather than implying expert review globally.

---

## 5. Identification-state integrity

The type system already models:

- `unidentified`
- `candidates`
- `user_selected`
- `community_supported`
- `expert_verified`

But the durable scan record does not currently persist this state. Plant detail currently effectively derives:

> latest scan exists = `user_selected`

This loses an important safety distinction.

### Required change

Persist identification state in the durable observation/scan model.

Minimum release behavior:

- AI-only result before user selection: `candidates`
- user manually selects/accepts a candidate: `user_selected`
- no app code may fabricate `community_supported` or `expert_verified`
- expert status must require an actual expert-review workflow/data event
- use-gate logic consumes the persisted state, not inferred state

### Confidence

LLM self-reported confidence is presentation evidence, not ground truth.

Do not unlock risky content from confidence alone.

Use a conservative combination of:

- valid candidate set,
- user comparison/selection,
- dangerous-lookalike presence,
- source/origin,
- persisted identification state,
- plant danger class.

Low-confidence results may remain useful for observation, but should not automatically become a high-certainty “discovery”.

---

## 6. Expo / iOS toolchain migration

### 6.1 Target

Audited baseline:

- Expo SDK 52
- React Native 0.76.5

Release target:

- **Expo SDK 57**
- Expo-compatible **React Native 0.86 line**
- Apple-supported Xcode / iOS SDK current at submission time

As of this design date, Apple requires App Store uploads to use Xcode 26+ and iOS 26 SDK+, and Expo SDK 57 is the stable target selected for this release plan.

### 6.2 Migration sequence

Do not jump from 52 directly to 57 in one opaque update.

Use:

```text
52
→ 53
→ 54
→ verify New Architecture + filesystem compatibility
→ 55
→ 56
→ 57
```

At every step:

- install Expo-recommended compatible dependency versions,
- run typecheck,
- run lint,
- run Jest,
- run web export,
- run `expo-doctor`,
- perform a minimal native smoke test when native behavior changes.

### 6.3 FileSystem migration blocker

`observationPhotoStorage.ts` uses SDK-52-era `expo-file-system` APIs such as:

- `documentDirectory`
- `getInfoAsync`
- `makeDirectoryAsync`
- `copyAsync`
- `deleteAsync`

Newer SDKs changed the FileSystem API surface; several legacy calls can throw if imported from the new entry point.

Safe migration path:

1. at the compatibility step, move existing logic to `expo-file-system/legacy` if needed;
2. preserve current photo cleanup/race-condition guarantees;
3. reach SDK 57 with green regression tests;
4. optionally migrate to `File` / `Directory` / `Paths` after release stability is proven.

Do not combine a full FileSystem rewrite with every other SDK migration unless necessary.

### 6.4 Reanimated and system UI

Re-check whether the app needs a direct Reanimated dependency at all; current app code primarily uses React Native `Animated`.

If retained, align with the SDK 57 supported Reanimated/Worklets setup.

Because `userInterfaceStyle: "automatic"` is configured, include/verify `expo-system-ui` as required by the target Expo version and validate Light/Dark behavior on Android as well as iOS.

### 6.5 Security gate

Issue #38 tracks toolchain advisories.

After migration:

- rerun `npm audit --omit=dev --audit-level=high`,
- resolve what can be resolved,
- document any unavoidable build-tool-only exceptions,
- remove `continue-on-error: true` when the accepted security state is established,
- make production dependency audit a release gate.

---

## 7. Production AI architecture

### 7.1 Client secrets are forbidden

The release build must not contain `EXPO_PUBLIC_CLAUDE_API_KEY` or any Anthropic secret.

The client must never call `api.anthropic.com` with a distributable secret.

Issue #39 remains a hard release blocker until this is closed.

### 7.2 Target flow

```text
iPhone
  ↓
YAKU-IKU backend / edge API
  ├─ explicit-consent check at client UX boundary
  ├─ MIME/type validation
  ├─ max images <= 5
  ├─ request-size limit
  ├─ image decode/resize/re-encode
  ├─ strip metadata
  ├─ rate limit
  ├─ timeout
  ├─ daily/provider cost ceiling
  ├─ no content logging
  ↓
Anthropic Claude
  ↓
server-side schema validation
  ↓
candidate-only response
  ↓
client safety/candidate comparison
```

### 7.3 Backend data policy

For v1, prefer a **stateless proxy**:

Do not persist:

- photo bytes/base64,
- EXIF,
- raw prompt bodies,
- raw AI response bodies,
- permanent device IDs,
- user name/notes/history,
- location.

Operational logs may retain only minimal non-content fields such as:

- timestamp,
- status class,
- latency,
- model identifier,
- request size,
- short-lived/random request ID.

Do not introduce a permanent device identifier solely for rate limiting if an anonymous/IP/edge strategy is sufficient.

### 7.4 Error behavior

Must preserve existing safety behavior:

- 429/5xx/timeouts/malformed provider output → explicit error or unidentified state,
- never random fallback,
- never convert provider failure into a confident plant result,
- client retries must not duplicate durable observations/XP.

---

## 8. Privacy and consent

### 8.1 Data-minimization baseline to preserve

Current code intentionally has no product analytics, advertising SDK, location collection, account system, permanent device-ID collection, or tracking.

Preserve this simplicity for v1 unless a requirement clearly justifies adding data collection.

### 8.2 AI consent UX

Current copy only says “外部AIサービス”. Before production AI release, explicitly name the recipient and purpose.

Minimum first-use disclosure:

- transmitted data: photographed plant images,
- recipient: Anthropic / Claude (through 薬育ポケット backend),
- purpose: generating plant identification candidates,
- what is not sent: name, notes, location, fieldbook history unless the implementation later changes,
- consent can be declined,
- consent can be revoked for future requests,
- revocation does not retroactively delete data already processed under a third party's retention policy.

Use a first-enable consent sheet/modal, not only a silent settings switch.

### 8.3 Anthropic retention

At audit time, Anthropic commercial API documentation describes standard API input/output deletion within approximately 30 days and states that commercial API data is not used for model training by default.

Privacy Policy copy must match the **actual Anthropic contract/settings used at launch**, not merely this design note. Re-verify immediately before submission.

### 8.4 App Privacy expected shape

If the final architecture remains:

- no account,
- no tracking,
- no advertising,
- no analytics,
- no permanent identifier,
- no location,
- photos sent only for AI functionality,
- backend does not persist photos,

the expected App Privacy shape is approximately:

- Data Collection: Yes
- Photos or Videos: Yes
- Purpose: App Functionality
- Tracking: No
- Linked to User: preferably No, if the final architecture truly avoids user/device linkage

This is a design expectation, **not a substitute for answering App Store Connect from the exact shipped behavior**.

### 8.5 Account deletion

v1 has no user account creation. Therefore the App Store account-deletion rule is not triggered by the current design.

If cloud accounts are added later, in-app account deletion and server-side data deletion become a separate release requirement.

### 8.6 Local deletion/export

Keep:

- “すべてのデータを削除” clearing local state and managed photos,
- user-directed export via share sheet,
- no secret/photo binary embedded in exported JSON.

Add identified-observation individual deletion as P1 if practical.

---

## 9. App Store product assets and metadata

### 9.1 Production assets

Current `assets/README.md` explicitly says the checked-in assets are placeholders.

Before submission replace:

- `icon.png`
- `splash.png`
- `adaptive-icon.png`
- `favicon.png`

The iOS App Store icon must be production quality, 1024×1024, and not a blank placeholder.

### 9.2 Public pages

Required before submission:

- Privacy Policy URL
- Terms URL
- Support URL

Replace the `example.com` placeholders in `src/constants/app.ts`.

Support email may remain, but a reachable Support URL should also exist for App Store metadata.

### 9.3 Suggested screenshot story

Prepare roughly 5–7 portrait screenshots, using the current highest-resolution iPhone screenshot requirement supported by App Store Connect.

Recommended story:

1. 今日 — 毎日の植物観察をフィールドノートに
2. 観察 — 葉・花・全体を撮影して候補を確認
3. 候補比較 — AIを鵜呑みにせず候補を見比べる
4. 安全 — 似ている有毒植物も一緒に確認
5. 図鑑 — 150種を観察しながら学ぶ
6. 記録 — 自分だけの植物観察記録を育てる

Do not market the app as “accurate definitive AI identification”, “edible plant detector”, or “medical effect guide”.

### 9.4 Store metadata

Prepare and freeze:

- app name/subtitle,
- description,
- keywords,
- category,
- copyright,
- support URL,
- privacy URL,
- age-rating answers,
- App Privacy answers,
- screenshots,
- review contact,
- reviewer notes.

### 9.5 Reviewer Notes content

Reviewer Notes should explicitly explain:

- no login is required,
- why camera permission is needed,
- AI analysis is opt-in,
- Anthropic/Claude receives plant images only when opted in,
- location is not collected in v1,
- AI output is candidate-based, not definitive identification,
- app is not for ingestion/foraging/medical decisions,
- dangerous look-alikes are displayed separately,
- provider failure never becomes a random real result.

---

## 10. TestFlight and release evidence

The release is not complete when unit tests are green. The release is complete when the shipped native artifact is verified.

### Required TestFlight matrix

At minimum cover:

- small iPhone class,
- standard iPhone,
- large iPhone,
- Light/Dark,
- VoiceOver,
- maximum Dynamic Type,
- Reduce Motion,
- fresh install,
- existing persisted data migration,
- camera first permission,
- denied permission + Settings recovery,
- one/multiple captured images,
- unidentified result,
- out-of-scope result,
- dangerous candidate/look-alike,
- AI consent OFF,
- AI consent ON,
- offline,
- backend timeout,
- 429,
- provider 5xx,
- malformed AI payload,
- 100-record/history cap,
- all-data deletion,
- export,
- app background/foreground and day rollover.

Use `UI_UX_RELEASE_QA.md` for the detailed accessibility/UI matrix.

### Release evidence bundle

For the final RC, retain:

- RC commit SHA,
- Expo / RN / Xcode / iOS SDK versions,
- `expo-doctor` output,
- typecheck result,
- lint result,
- Jest suite/test count,
- production dependency audit result,
- secret-scan result,
- production/preview build identifier,
- TestFlight build number,
- App Privacy answers snapshot,
- age-rating answers snapshot,
- screenshots used,
- reviewer notes used.

---

## 11. Release execution order

### Phase R0 — freeze the UI baseline

1. Review and merge PR #42.
2. Run CI on merged main.
3. Enable temporary release branch protection / PR+CI discipline.
4. No unrelated feature work in the release line.

**Exit:** stable UI baseline is frozen.

### Phase R1 — safety/content truth

1. Re-audit all 150 `plants.ts` entries.
2. Normalize health/medical efficacy wording.
3. Reconcile dangerous-lookalike graph with authoritative sources.
4. Re-check RED/YELLOW warning strength against source text.
5. Add safety/medical-copy CI protection.
6. Update stale audit documents that still claim this work is complete.

**Exit:** no known unsupported high-risk copy; high-risk safety relationships have explicit evidence.

### Phase R2 — identification integrity

1. Add durable `IdentificationState`.
2. Migrate persisted state safely.
3. Use persisted state in `useGate`.
4. Add conservative low-confidence/unresolved behavior.
5. Add regression tests.

**Exit:** AI candidate, user selection, and expert verification are durably distinct.

### Phase R3 — supported platform/toolchain

1. Upgrade 52→53→54.
2. At 54, resolve FileSystem compatibility and verify New Architecture.
3. Continue 55→56→57.
4. Align native dependencies, Router, Reanimated/Worklets, system UI.
5. Run full checks at every stage.
6. Re-run security audit and make accepted audit state blocking.

**Exit:** SDK 57 native build passes all automated gates and smoke tests.

### Phase R4 — production AI + privacy

1. Deploy stateless backend proxy.
2. Move Anthropic key to server secret.
3. Delete client secret/direct-provider path.
4. Add request limits, re-encode, metadata stripping, rate/cost limits.
5. Validate provider output server-side.
6. Add explicit Anthropic/Claude consent UX.
7. Publish privacy/terms/support pages.
8. Update App Privacy design from actual shipped behavior.

**Exit:** no secret in client; opt-in production AI works safely; privacy disclosure matches reality.

### Phase R5 — App Store assets and configuration

1. Production icon/splash.
2. EAS project/owner.
3. Apple ID / ASC App ID / Team ID.
4. App Store metadata and screenshots.
5. Age rating and App Privacy.
6. Reviewer Notes.

**Exit:** App Store Connect record is complete enough for upload/review.

### Phase R6 — TestFlight release candidate

1. Produce production-like native build.
2. Run the required device/accessibility/error matrix.
3. Fix only release-blocking defects.
4. Run final secret/security scans.
5. Freeze final RC SHA.

**Exit:** signed-off TestFlight build tied to a reproducible RC SHA.

### Phase R7 — submit

1. Submit the frozen RC.
2. Do not add features while in review.
3. If rejected, fix the exact rejection cause with the smallest safe change.
4. Tag/record the accepted release.

---

## 12. Non-goals for the initial App Store release

Do not delay v1 solely to add:

- social/account systems,
- cloud sync,
- location-aware regional identification,
- advertising,
- product analytics,
- community verification,
- complete expert review of all 150 plants,
- a full rewrite of the FileSystem layer after compatibility is restored,
- web parity for every native `Alert.alert` flow,
- multi-photo historical storage if one durable primary photo remains coherent.

These can be designed separately after the safety/privacy/release baseline is established.

---

## 13. Release completion definition

薬育ポケット v1 is ready to submit only when:

- all P0 items in this design are closed,
- SDK 57 production native build succeeds,
- no distributable AI secret exists,
- AI consent/privacy copy matches actual data flow,
- public Privacy/Terms/Support URLs are live,
- 150-plant safety/medical copy audit is complete,
- known high-risk look-alike gaps are resolved,
- App Store assets are production quality,
- App Privacy and age-rating answers reflect the shipped app,
- TestFlight matrix has no unresolved release-blocking defect,
- release evidence is recorded,
- the RC commit SHA is frozen.

At that point, the project can move from **ACCEPT WITH RELEASE BLOCKERS** to **READY FOR APP STORE SUBMISSION**.

---

## 14. Current external references

Re-check these immediately before submission because Store/toolchain requirements can change.

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple Upcoming Requirements: https://developer.apple.com/news/upcoming-requirements/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple Age Rating definitions: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
- Apple screenshots/App Store Connect: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- Expo SDK upgrade guide: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
- Expo FileSystem: https://docs.expo.dev/versions/latest/sdk/filesystem/
- Expo Apple privacy guide: https://docs.expo.dev/guides/apple-privacy/
