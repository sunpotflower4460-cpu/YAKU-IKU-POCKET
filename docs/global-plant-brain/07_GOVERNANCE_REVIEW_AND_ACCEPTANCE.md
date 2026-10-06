# YAKU Global Plant Brain — Governance, Review & Acceptance

> Purpose: Global Plant Brainを「大量データはあるが誰も品質を説明できないシステム」にしないための運用設計。  
> Scope: review roles, promotion gates, incident response, knowledge freshness, reproducibility, release acceptance.

## 1. Governance principle

Quality authority is domain-scoped. A single global "expert score" or "AI confidence" does not authorize all changes.

Roles:

```text
Data/Source Curator
Taxonomist/Botanist
Pharmacognosy Specialist
Natural Product Chemist
Toxicologist
Clinical Evidence Reviewer
Regulatory Reviewer
Traditional Knowledge / Community Authority
Safety Release Owner
Platform Engineer
```

One person may hold multiple roles, but approval records remain role-specific.

## 2. Review state

```text
RAW
AUTO_EXTRACTED
SOURCE_VALIDATED
AI_VALIDATED
CURATOR_REVIEWED
EXPERT_REVIEWED
COMMUNITY_APPROVED
REJECTED
SUPERSEDED
INVALIDATED
```

A higher state does not erase lower-state provenance.

## 3. Risk class

```text
R0 — metadata/format only
R1 — descriptive low-risk knowledge
R2 — identity/chemistry/scientific relation
R3 — clinical/regulatory interpretation
R4 — safety-critical / poisonous confusion / human-harm claim
R5 — restricted traditional knowledge / rights-critical action
```

Suggested promotion:

| Risk | Minimum promotion requirement |
|---|---|
| R0 | deterministic validation |
| R1 | source validation + sampling audit |
| R2 | source validation + second-model or curator check |
| R3 | curator + domain review before strong user-facing conclusion |
| R4 | domain expert mandatory + regression tests |
| R5 | rights/authority approval mandatory; content may remain metadata-only |

## 4. Claim promotion policy

Each ClaimType has its own promotion policy.

Examples:

### Taxonomic synonym from approved backbone
Can be auto-promoted after identity/version validation.

### Compound occurrence
Requires explicit source, material context and analytical-confidence field.

### "Herb treats disease X"
Never auto-promote from LLM extraction. Requires human evidence synthesis and user-facing wording policy.

### Fatal poisoning / dangerous lookalike
Requires official/source validation and safety owner review; immediately creates a high-priority dependency reevaluation.

### Traditional knowledge
Requires source provenance and access policy before retrieval or display. Community-restricted data cannot be "approved" by a generic scientific reviewer.

## 5. Structural / Semantic / Behavioral validation

### Structural
- schema
- required fields
- datatypes
- foreign-key integrity
- source/rights presence

### Semantic invariants
Examples:
- in-vitro-only evidence cannot set clinical efficacy established
- no pregnancy data cannot set established safe
- reference-only source content cannot be persisted as unrestricted full text
- retracted primary evidence cannot remain the sole support for an active strong claim
- taxon concepts from different source versions cannot be silently merged
- unknown species cannot be converted to safe/edible state

### Behavioral
- YAKU-ID benchmark
- dangerous pair regression
- answer/evidence trace tests
- rights filtering tests
- stale/invalidated claim suppression tests

## 6. Knowledge regression fixtures

Maintain a growing set of "must never break" cases.

Categories:
- poisonous lookalikes
- known safe-abstention examples
- taxonomy split/synonym history
- traditional-use vs clinical-evidence separation
- in-vitro vs human separation
- no-data vs safe
- pharmacovigilance signal vs causality
- restricted rights retrieval denial
- source retraction invalidation

Every production knowledge/model release runs these fixtures.

## 7. Incident response

A knowledge incident is any event where:
- a dangerous plant was presented as safe
- a restricted record leaked
- a retracted/invalid source continued supporting a strong claim
- a source license was violated
- a taxonomic mapping corrupted dependent evidence
- a user-facing health claim exceeded evidence

Response:

```text
Detect
↓
Freeze affected answer/claim/model path
↓
Preserve evidence snapshot
↓
Root-cause analysis
↓
Find dependents
↓
Mark stale/invalidated
↓
Fix data/model/policy
↓
Add regression fixture
↓
Re-run benchmarks
↓
Controlled release
↓
Postmortem
```

Safety-critical incidents take precedence over feature work.

## 8. User correction flow

User reports are observations, not immediate truth.

```text
User correction
↓
link to observation/model/version/answer
↓
triage
↓
source/expert validation
↓
confirmed?
  ├ no → close with rationale
  └ yes → claim/model/policy correction + regression case
```

High-value confirmed field mistakes may become benchmark cases if rights/consent allow.

## 9. Expert escalation

When AI cannot safely resolve:

```text
Identification unresolved
↓
taxonomic scope/family detected
↓
expert network route
↓
expert determination
↓
verification state update
```

Machine confidence and expert verification remain separate fields.

Expertise is scoped by:
- taxonomic group
- geography
- evidence domain
- tradition/community
- method

## 10. Freshness SLO concept

Do not use one freshness score. Track domain-specific freshness.

Examples:
- taxonomy current through source release X
- safety alerts checked at T
- clinical literature searched through D
- trial registry updated through D
- rights/terms reviewed at D
- historical text edition fixed, not "stale"

Critical sources get shorter refresh objectives than descriptive content. Exact SLOs are chosen once infrastructure/cost is known.

## 11. Material-change detection

A new record does not always require a user-facing conclusion change.

Track:
```text
newEvidence = true/false
assessmentChanged = true/false
userFacingConclusionChanged = true/false
safetyPolicyChanged = true/false
```

This prevents noisy rewrites from low-impact studies.

## 12. Retraction / correction policy

Never delete history solely because a paper was corrected/retracted.

Source status:
```text
CURRENT
CORRECTED
EXPRESSION_OF_CONCERN
PARTIALLY_RETRACTED
RETRACTED
WITHDRAWN
```

Dependent claims are re-evaluated. Historical view remains reproducible.

## 13. Answer reproducibility

For consequential answers, persist or be able to derive:

```text
answerId
generatedAt
model/provider versions
prompt/policy version
knowledge snapshot
taxonomic source versions
source refs
claim IDs
safety gate version
rights decision version
```

If source content cannot legally be snapshotted, preserve permitted identifiers/version/hash metadata instead.

## 14. Release artifacts

Each Global Brain release should produce:

- source registry snapshot
- data migration report
- failed/blocked source report
- unresolved conflicts report
- stale critical claims report
- rights violations = 0
- benchmark scorecard
- dangerous regression report
- schema/semantic validation report
- known limitations
- rollback identifier

## 15. Acceptance gates by phase

### G0
- canonical IDs exist
- all production claims can carry source/provenance/rights
- no critical field requires fabricated default data

### G1
- current 150 plants mapped to canonical taxonomy or explicitly unresolved
- no guessed external IDs
- taxonomy version is recorded

### G2
- provider score calibration measured
- unknown/abstention path works
- dangerous pair suite exists
- model version is persisted

### G3
- high-risk safety claims source-backed
- dangerous lookalike graph has incident/source links where available
- special-population "no data" cannot render as safe

### G4–G6
- material/preparation context retained
- clinical claims can trace to trial/outcome/source
- regulatory/traditional/scientific axes remain separate

### G8
- access policy enforced before retrieval
- restricted/community-only content cannot leak into general RAG

### G9
- source changes invalidate/recompute dependents
- correction/retraction flow tested
- answers can be traced to a knowledge snapshot

## 16. Global completion test

Do not claim "all plants are accurately identifiable."

Allowed product claims must be bounded by measured coverage, for example:

- Taxonomic lookup coverage
- Vision species coverage
- genus-level coverage
- region/taxon benchmark performance
- dangerous false-safe observed rate with confidence bounds
- source-backed medicinal knowledge coverage
- reviewed safety coverage

The system's defining quality is not pretending to be complete; it is **knowing, measuring and exposing where it is incomplete**.
