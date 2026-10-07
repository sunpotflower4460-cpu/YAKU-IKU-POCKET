# G1 Taxonomy Conflict Policy & Current-Catalog Acceptance

> Status: IMPLEMENTED / CURRENT-CATALOG G1 ACCEPTED  
> Date: 2026-10-07  
> Scope: current 150 product cards / 149 canonical YAKU taxa  
> Important: **This is not a claim that all world plants are already ingested or identifiable.**

## 1. What G1 acceptance means

The current product catalog can now sit on top of a taxonomy foundation that:

- gives every product card a stable YAKU Taxon Concept
- preserves same-taxon product aliases
- records source/version-specific taxonomy views
- stores scientific-name identity separately from taxon identity
- preserves synonyms instead of overwriting them
- exposes authority disagreement as a first-class state
- prevents unsafe automatic concept changes while conflict is active
- can reproduce the reviewed taxonomy snapshot later

This is the acceptance gate for the **current-catalog foundation** before expanding the same machinery to global-scale taxonomy.

## 2. Current measured state

```text
150 product cards
↓
149 YAKU Taxon Concepts
├ 137 externally_resolved
├   7 externally_reconciled
└   5 conflicted
```

Additional coverage:

- 144 safe WFO accepted-concept links
- 156 Plant Name records
  - 149 catalog scientific names
  - 7 reviewed preferred accepted names
- 147 / 149 catalog scientific names have a stable IPNI LSID
- 171 active taxonomy assertions
- 156 active nomenclatural assertions
- 0 remaining `local_seed` concepts in the current catalog

Two catalog synonym names intentionally remain without a promoted stable IPNI LSID:

- `Elatostema umbellatum var. majus`
- `Glechoma hederacea var. grandis`

Their reviewed accepted-name records retain stable nomenclatural identifiers.

## 3. Five active authority conflicts

The following are not data-entry failures. They are material differences between reviewed taxonomic authorities:

| Catalog concept | Material conflict |
|---|---|
| Taraxacum officinale | species/status/rank treatment differs |
| Calystegia japonica | accepted target differs |
| Eupatorium japonicum | accepted vs synonym target differs |
| Citrus junos | species vs artificial hybrid + ambiguous WFO usage |
| Hyssopus officinalis | Hyssopus accepted vs Dracocephalum synonym concepts |

YAKU keeps each authority view instead of majority-voting one away.

## 4. Conflict operation policy

While a material taxonomy conflict is active:

| Operation | Decision |
|---|---|
| catalog lookup | ALLOW |
| Plant Name lookup | ALLOW |
| source-scoped evidence lookup | ALLOW |
| preferred accepted-name autoselect | DENY |
| external accepted-ID auto-promotion | DENY |
| accepted-rank change | REVIEW |
| taxon merge | REVIEW |
| cross-source evidence merge | REVIEW |
| product scientific-name migration | REVIEW |

This allows research to continue without allowing a taxonomy disagreement to silently contaminate medicinal, safety or clinical evidence.

## 5. Why source-scoped evidence remains allowed

A conflict does not mean that every statement about the plant becomes unusable.

For example:

```text
Source A uses Name/Concept A
Source B uses Name/Concept B
```

YAKU may still store both source-scoped claims when their provenance is explicit.

What it may not do automatically is:

```text
A evidence + B evidence
↓
pretend both refer to one identical accepted concept
↓
merge into one stronger conclusion
```

That merge requires review while the concept boundary is unresolved.

## 6. Machine acceptance gate

`G1_CURRENT_CATALOG_ACCEPTANCE` checks:

- all 150 product cards are projected
- exactly 149 canonical taxa exist
- no current concept remains `local_seed`
- resolution state partition remains 137 / 7 / 5
- WFO safe accepted-concept coverage remains 144
- Plant Name Graph remains 156 records
- catalog-name IPNI coverage remains 147 / 149
- taxonomy assertions remain 171
- nomenclature assertions remain 156
- all five conflicts remain explicit and guarded
- COL / WFO / Kew taxonomy / IPNI source policies are approved for their scoped core use
- source versions remain pinned

Any failed check changes the acceptance result from `pass` to `fail`.

## 7. Version boundaries

Current accepted current-catalog baseline includes:

- Catalogue of Life: 2026-09-25 XR / ChecklistBank 316441
- COL DOI: `10.48580/dgz9s`
- WFO Plant List: 2026-06
- WFO DOI: `10.5281/zenodo.20782718`
- Kew Names and Taxonomic Backbone / WCVP: reviewed 2026
- IPNI name-level review through 2026-10-07
- taxonomy policy: `gpb-g1-taxonomy-resolution-v2`
- conflict policy: `gpb-g1-taxonomy-conflict-v1`
- nomenclature policy: `gpb-g1-nomenclature-v1`

Future releases create new assertions/snapshots; they do not rewrite this baseline out of history.

## 8. G1 status

### Current-catalog foundation

**PASS**, subject to CI.

### Global-scale taxonomy

**NOT COMPLETE.**

Still required for the user's final worldwide goal:

- indexed/federated lookup beyond the current 149 taxa
- global WFO/COL ingestion/cache strategy
- scalable Taxon Concept allocation for previously unseen taxa
- global vernacular-name graph
- distribution/occurrence linkage
- automated release-diff processing
- global conflict generation
- taxonomy update/retraction workflow at scale

Therefore the correct statement is:

> The current YAKU catalog is ready to use the G1 taxonomy architecture.  
> The same architecture must now be expanded from 149 concepts to worldwide plant taxonomy.

## 9. Next implementation slice

The next G1 slice is **Global Taxonomy Index**:

```text
Pinned COL / WFO releases
↓
streaming ingest / index
↓
Canonical Taxon allocator
↓
Name graph
↓
authority views
↓
conflict detection
↓
versioned snapshot
↓
Taxonomy Resolver API
```

The mobile app should query this backend/index rather than bundle the full global backbone.
