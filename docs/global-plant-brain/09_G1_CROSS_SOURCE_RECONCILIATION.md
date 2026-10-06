# G1 Cross-Source Taxonomy Reconciliation

> Status: REVIEWED  
> Date: 2026-10-06  
> Scope: the nine synonym cases left after the rank-corrected COL run.

## Principle

A synonym match is not rewritten in-place. YAKU preserves:

- the catalog scientific name used by current product data
- the source name-usage record
- each authority's accepted concept
- the relationship between those concepts
- a separate preferred view only when the reviewed authorities align sufficiently

This keeps old literature, medicinal names and safety evidence traceable even when taxonomy changes.

## Outcome

After cross-checking the nine remaining COL synonym cases against Kew's WCVP-backed Plants of the World Online taxonomy:

| Catalog name | Reconciled preferred view | State |
|---|---|---|
| Pueraria lobata | Pueraria montana var. lobata | externally_reconciled |
| Veratrum album subsp. oxysepalum | Veratrum oxysepalum | externally_reconciled |
| Elatostema umbellatum var. majus | Elatostema involucratum | externally_reconciled |
| Glechoma hederacea var. grandis | Glechoma grandis | externally_reconciled |
| Calystegia japonica | Convolvulus japonicus | externally_reconciled |
| Lapsana apogonoides | Lapsanastrum apogonoides | externally_reconciled |
| Dianthus superbus var. longicalycinus | Dianthus longicalyx | externally_reconciled |
| Hibiscus sabdariffa | Sabdariffa gossypiifolia | externally_reconciled |
| Hyssopus officinalis | — | conflicted |

Resulting current-catalog states:

- exact accepted external resolution: 140
- cross-source reconciled synonym concepts: 8
- explicit authority conflict: 1
- untouched local seeds: 0

## Hyssopus conflict

Do not auto-select a preferred scientific name.

Current reviewed views:

- Catalogue of Life XR maps `Hyssopus officinalis` to `Dracocephalum officinale subsp. officinale`.
- Kew/WCVP via POWO maps it to `Dracocephalum officinale` at species rank.
- The current WFO taxon page still presents `Hyssopus officinalis` within a Hyssopus classification, while the fetched page extract does not expose a sufficiently explicit accepted/synonym status for YAKU to resolve the disagreement automatically.

Therefore the YAKU concept remains `conflicted`. Product display is unchanged and downstream knowledge should continue to be reachable through the catalog name plus authority references.

## Rights boundary

The Kew approval in the Source Registry is narrowly scoped to the **Kew Names and Taxonomic Backbone / WCVP** components identified by POWO as CC BY 3.0.

It does not authorize reuse of every POWO page component. Images, herbarium specimens and third-party datasets retain their own licenses and require record-level decisions.

## Next step

G1 can now move from current-catalog reconciliation to:

1. adding WFO identifiers/backbone reconciliation at scale
2. IPNI LSID/name-publication reconciliation
3. creating versioned taxonomy assertions instead of keeping resolution only on seed projections
4. preparing the global taxonomy ingestion path beyond the current 149 concepts

Product-facing scientific-name changes are a separate editorial migration and are not implied by this reconciliation.
