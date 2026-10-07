# G1 WFO Snapshot & Material Taxonomy Conflicts

> Status: REVIEWED / IMPLEMENTED  
> Date: 2026-10-06  
> Static source: World Flora Online Plant List 2026-06  
> DOI: 10.5281/zenodo.20782718

## 1. Purpose

The Catalogue of Life pass gave YAKU a strong first global resolution, but one authority must not become the hidden definition of truth.

G1 therefore resolved the same 149 canonical catalog taxa against a pinned WFO static backbone and compared the result with current Kew/WCVP views.

## 2. Pinned WFO inputs

The workflow fixes both content identity and release identity:

- Plant List release: 2026-06
- DOI: `10.5281/zenodo.20782718`
- `_DwC_backbone_R.zip`
- backbone MD5: `0e4486945cd9f7af548ca87eb9a870ed`
- `ipni_to_wfo.csv.gz`
- IPNI mapping MD5: `faa5aae66e51dce6b9890a4f78817bb6`

A future WFO release does not silently change the 2026-10-06 decisions.

## 3. Live resolver result

For the 149 YAKU canonical taxa:

- exact Accepted usage: 137
- exact Synonym usage: 9
- exact Unchecked usage: 1
- ambiguous same-name/rank groups: 2
- rank mismatch: 0
- no exact name match: 0

After cross-source review:

- safe WFO accepted-concept links: **144**
- material authority conflicts: **5**

## 4. Aster yomena

The static WFO snapshot contains two Accepted usages for the bare name `Aster yomena`.

YAKU does not choose by list order. Current Kew/POWO accepts:

`Aster yomena (Kitam.) Honda`

with IPNI LSID:

`urn:lsid:ipni.org:names:182620-1`

That corresponds to WFO:

`wfo-0000134015`

so this one case can be deterministically selected by cross-source identity.

## 5. Five material conflicts

### Taraxacum officinale

- COL: Accepted species
- WFO 2026-06: Unchecked usage
- current Kew/POWO: synonym of `Taraxacum sect. Taraxacum`

YAKU keeps the catalog name and marks the taxon conflicted.

### Calystegia japonica

- COL: synonym → `Convolvulus japonicus`
- current Kew/POWO: synonym → `Convolvulus japonicus`
- WFO 2026-06: synonym → `Calystegia pubescens`

The static WFO view disagrees materially with the other reviewed authorities.

### Eupatorium japonicum

- COL: Accepted `Eupatorium japonicum`
- current Kew/POWO: Accepted `Eupatorium japonicum`
- WFO 2026-06: synonym → `Eupatorium chinense`

Again, YAKU preserves the source-version disagreement.

### Citrus junos

- COL: accepted species-style concept
- WFO 2026-06: two Unchecked usages
- both WFO usages share IPNI `771942-1`
- current Kew/POWO: `Citrus × junos`, artificial hybrid

No accepted WFO concept is promoted and no product-facing rank is changed automatically.

### Hyssopus officinalis

- COL: synonym → `Dracocephalum officinale subsp. officinale`
- current Kew/POWO: synonym → `Dracocephalum officinale`
- WFO 2026-06: Accepted `Hyssopus officinalis`

This remains an explicit authority conflict.

## 6. Current projection state

After WFO review, the 149 canonical current-catalog taxa are:

- `externally_resolved`: 137
- `externally_reconciled`: 7
- `conflicted`: 5
- `local_seed`: 0

144 taxa also carry a safe WFO accepted-concept external ID.

The five conflict taxa retain their COL cross-reference but receive no promoted WFO accepted ID.

## 7. Why this is better than majority voting

Two authorities agreeing does not erase a third authority's different concept.

The graph stores:

```text
YAKU Taxon Concept
├ COL view
├ WFO snapshot view
├ Kew/WCVP current view
└ Current preferred/withheld decision
```

This is especially important for medicinal literature because older and regional publications may use the alternative name.

## 8. IPNI boundary

The WFO backbone exposes `scientificNameID` and the release also provides an IPNI→WFO mapping.

IPNI identifies **names/nomenclatural records**, not the YAKU taxon concept itself. Therefore G1 does not blindly fill `TaxonExternalIds.ipni` from every WFO record.

The name-level nomenclature layer is implemented in `12_G1_NAME_NOMENCLATURE_LAYER.md`:

```text
Taxon Concept
  ↓ has name
Plant Name
  ↓ nomenclatural identity
IPNI LSID
```

This deliberately prevents IPNI LSIDs from being treated as Taxon Concept IDs.

## 9. Product boundary

No product-visible scientific name is changed by this work.

The app can continue to show its current catalog wording while Global Plant Brain keeps the authority graph underneath it.
