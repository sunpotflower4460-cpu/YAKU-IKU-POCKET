# G1 Plant Name & Nomenclature Layer

> Status: IMPLEMENTED  
> Date: 2026-10-07  
> Scope: current 149 canonical taxa / current product catalog

## 1. Purpose

G1 now separates two identities that must never be collapsed:

```text
Taxon Concept
  ≠
Scientific Name / Nomenclatural Record
```

A taxonomic authority may move an existing scientific name to a synonym, a different accepted species, or a different rank without changing the historical identity of that published name.

Therefore IPNI LSIDs live on `PlantNameRecord`, not `TaxonExternalIds`.

## 2. Current graph

The current catalog produces:

- 149 `catalog_scientific` name records
- 7 `preferred_accepted` scientific-name records for reconciled synonym concepts
- total Plant Name records: **156**

Each record has its own YAKU `YakuPlantNameId` and links back to one or more YAKU Taxon Concepts.

## 3. IPNI coverage

Catalog scientific names:

- IPNI LSID present: **147 / 149**
- intentionally unresolved: **2 / 149**
  - `Elatostema umbellatum var. majus`
  - `Glechoma hederacea var. grandis`

No LSID is fabricated for these two catalog synonym usages.

Their reviewed preferred accepted names do have stable IPNI LSIDs:

- `Elatostema involucratum` → `urn:lsid:ipni.org:names:851938-1`
- `Glechoma grandis` → `urn:lsid:ipni.org:names:447336-1`

All seven preferred accepted-name records have IPNI LSIDs.

## 4. WFO + IPNI provenance

Most name identifiers come from the pinned WFO Plant List 2026-06:

- DOI `10.5281/zenodo.20782718`
- WFO backbone MD5 `0e4486945cd9f7af548ca87eb9a870ed`
- WFO IPNI mapping MD5 `faa5aae66e51dce6b9890a4f78817bb6`

The WFO `scientificNameID` field and `ipni_to_wfo` map are treated as source evidence, not as proof that a taxon is accepted.

`Zingiber mioga` was the one catalog name whose pinned WFO row lacked an IPNI identifier; its IPNI LSID `urn:lsid:ipni.org:names:798364-1` was separately verified against IPNI on 2026-10-07.

## 5. Conflict-safe identity

A conflicted taxon can still have a stable scientific-name identity.

Example:

```text
YAKU Taxon: Citrus junos
  resolutionStatus = conflicted

Plant Name: Citrus junos
  IPNI LSID = urn:lsid:ipni.org:names:771942-1
```

Knowing the name identity does not force YAKU to choose whether the biological concept should be treated as a species, hybrid, synonym, or another authority-specific concept.

## 6. Rights

IPNI states that its data are licensed under Creative Commons Attribution. YAKU therefore enables core nomenclatural storage/commercial use with attribution, while AI RAG/embedding/training/evaluation remain separately conditional in the RightsPolicy.

IPNI remains a nomenclatural source. Accepted-taxonomy decisions continue to come from the multi-authority Taxon Concept layer.

## 7. Assertions and snapshot

Every one of the 156 Plant Name records generates an active `nomenclatural_identity` assertion.

The separate snapshot:

`yaku:snapshot:nomenclature-current-catalog-2026-10-07`

pins the WFO release/checksums, IPNI review date, and policy version `gpb-g1-nomenclature-v1`.

## 8. Result

G1 can now represent:

```text
YAKU Taxon Concept
├ current catalog name
│  ├ WFO name usage
│  └ IPNI nomenclatural identity
├ preferred accepted name (when reconciled)
│  ├ WFO accepted usage
│  └ IPNI nomenclatural identity
└ authority conflict views
```

without overwriting historical names or confusing nomenclature with taxonomy.
