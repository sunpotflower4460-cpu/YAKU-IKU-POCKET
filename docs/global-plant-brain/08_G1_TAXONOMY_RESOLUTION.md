# G1 Taxonomy Resolution

> Status: IMPLEMENTING  
> Started: 2026-10-06

## Goal

Resolve the 149 canonical taxon seeds from the current 150-card product catalog against authoritative, versioned plant taxonomies without silently converting ambiguous names into accepted taxa.

## Provider order

1. **Catalogue of Life XR** — online primary resolver.
2. **World Flora Online Taxonomic Backbone** — plant-specialist bulk cross-check.
3. **WCVP / POWO** — vascular-plant specialist accepted-name/distribution cross-check.
4. **IPNI** — nomenclatural identifier/publication complement, not the sole accepted-taxonomy authority.

## Current pinned primary release

Catalogue of Life Extended Release:

- release: 2026-09-25 XR
- issued: 2026-09-25
- ChecklistBank dataset: 316441
- DOI: 10.48580/dgz9s
- GBIF/COL XR checklistKey: 7ddf754f-d193-4cc9-b351-99906754a03b

The release metadata is pinned in code so future updates create an explicit version change instead of silently altering prior resolutions.

## Automatic-resolution rule

A candidate may auto-resolve only when all of the following are true:

- provider match type is exact
- status is accepted
- expected taxonomic rank matches
- Plantae is confirmed in the classification
- provider confidence is absent or >= 95

Synonyms, variants, fuzzy results, rank mismatches, non-plant classification, lower confidence, and conflicting provider results require review.

## Why synonyms require review

A synonym match is not just "the same ID with a newer spelling". It may require:

- preserving the name used by the product/source
- linking it to a distinct accepted usage
- recording the source/version where the synonym relationship was asserted
- re-evaluating downstream medicinal or clinical claims that used the historical name

Therefore the first G1 resolver does not silently overwrite the product scientific name.

## Network boundary

The resolver receives an injected JSON transport. The React Native product does not automatically call external taxonomy APIs. Backend/CLI tooling will perform resolution and persist reviewed results with provenance.

## Next slices

- run the 149-name COL worklist in controlled tooling
- persist results as versioned assertions
- add WFO/WCVP bulk cross-check
- create explicit synonym/taxon-concept relations
- add IPNI LSID reconciliation where available
- generate a coverage/conflict report before Product Projection is changed


## First live COL run

Executed on 2026-10-06 against the pinned COL 2026-09-25 XR:

- canonical taxa queried: 149
- auto-resolve: 140
- needs review: 9
- unresolved: 0
- transport errors: 0

The nine remaining review cases are intentionally not promoted to `externalIds.col`:

- Pueraria lobata
- Veratrum album subsp. oxysepalum
- Elatostema umbellatum var. majus
- Glechoma hederacea var. grandis
- Calystegia japonica
- Lapsana apogonoides
- Dianthus superbus var. longicalycinus
- Hyssopus officinalis
- Hibiscus sabdariffa

Most are synonym/taxon-rank cases. These require WFO/WCVP and nomenclatural cross-check before changing the YAKU accepted-name view.


### Rank-corrected rerun

The initial run exposed a YAKU-side modeling issue: five scientific names were infraspecific but had been seeded as species. After correcting canonical ranks and re-running the same pinned COL release:

- auto-resolve: 140
- needs review: 9
- unresolved: 0
- transport errors: 0

`Hemerocallis fulva var. angustifolia` now resolves as an exact accepted variety (COL `7M4GJ`) and is promoted. The other four corrected infraspecific queries remain exact synonyms and therefore stay in review.
