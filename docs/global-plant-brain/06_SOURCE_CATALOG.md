# YAKU Global Plant Brain — Source Catalog

> Purpose: 第1〜13回の調査で採用候補になった外部Sourceを、役割・信頼階層・統合方式・Rights注意点ごとに整理する。  
> Important: 本書は「2026-10時点の設計判断」。実装・契約直前に各SourceのTerms/License/API仕様を再確認し、`SourceRegistryEntry.lastTermsReviewAt`を更新する。

## 1. Source selection principle

Sourceを「有名だから採用」しない。各Sourceについて以下を評価する。

- authority / curation
- taxonomic or semantic scope
- machine access
- update cadence
- record-level provenance
- commercial use
- local storage / redistribution
- RAG / embedding / training
- cost / rate limit
- freshness
- failure mode
- whether absence means no evidence or only no coverage

## 2. Taxonomy / Nomenclature

| Source | Primary role | Integration intent | Notes |
|---|---|---|---|
| Catalogue of Life | global backbone | Core + versioned snapshots | broad global integration; current/source version preserved |
| World Flora Online | plant taxonomic backbone | Core candidate | taxonomy backbone separated from page/media licensing |
| WCVP / POWO | vascular plant specialist taxonomy/distribution | Source-specific federation/core | Kew dataset terms checked per dataset |
| IPNI | nomenclatural names/publication | Federation/core metadata | name identity, not full taxon concept |
| TDWG TCS | taxon concept semantics | Schema standard reference | concepts and concept relations |
| Darwin Core | occurrence/name exchange vocabulary | Schema standard reference | GBIF etc. interoperability |

YAKU never stores only an external taxon key. All are mapped to `YakuTaxonConceptID`.

## 3. Occurrence / Distribution / Ecology

| Source | Primary role | Integration intent | Notes |
|---|---|---|---|
| GBIF | occurrence/distribution | record-license-aware federation | occurrence/media rights retained per record/dataset |
| iNaturalist | observations/context | restricted/filterable federation | do not assume commercial AI training rights |
| POWO | native/introduced distribution | source-specific | soft prior, not hard exclusion |
| TRY | traits | licensed/open dataset integration | record/context and intraspecific variability retained |
| climate datasets | climate/ecological prior | source-dependent | commercial terms vary; avoid hard-exclusion logic |
| EPPO | plant health/invasive/regulatory pest context | federation | plant health distinct from taxonomy |

Geographic priors are always soft priors. Absence from current range data does not make a candidate impossible.

## 4. Images / Identification

| Source | Primary role | Integration intent |
|---|---|---|
| Pl@ntNet API | global visual candidate generation | external provider adapter |
| future Plant.id/other provider | secondary visual engine | provider adapter |
| iNaturalist images | reference/community image context | only license-filtered permissible subset |
| Herbarium portals | voucher/reference images | stable reference integration |
| BOLD | barcode/specimen evidence | molecular escalation |
| GGBN | specimen–tissue–DNA lineage | molecular provenance |

YAKU records provider/model version and calibrates scores on YAKU-ID Bench. Provider confidence is never treated as a universal probability.

## 5. Medicinal identity / Pharmacopoeia

| Source | Primary role | Integration intent |
|---|---|---|
| Kew MPNS | medicinal plant names/material bridge | formal service/license preferred |
| Japanese Pharmacopoeia | Japanese crude-drug identity/quality | official source integration |
| Non-JPS | non-pharmacopoeial crude-drug standards | official source integration |
| EMA HMPC | traditional/well-established regulatory assessment | document-family federation |
| European Pharmacopoeia | identity/quality/analytical standards | licensed/reference |
| USP Herbal Medicines Compendium | herbal quality standards | terms-permitted integration |
| Chinese Pharmacopoeia | Chinese national standards | reference/licensed until clear |
| PCIM&H | Ayurveda/Siddha/Unani standards | source-specific |
| WHO monographs | international reference | reference/source-specific |

Pharmacopoeial inclusion does not establish clinical efficacy.

## 6. Natural products / Chemistry

| Source | Primary role | Integration intent |
|---|---|---|
| ChEBI | canonical chemical ontology | Core candidate |
| PubChem | chemical router/cross-reference | contributor-aware federation |
| NPASS | organism→natural product→activity→target | high-value source; commercial terms verified before production |
| LOTUS | natural-product occurrence | source/provenance aware |
| COCONUT | broad natural-product chemical space | core candidate subject to source policy |
| ChEMBL | bioactivity/target/mechanism | share-alike boundary |
| BindingDB | quantitative binding | origin-aware: BindingDB vs imported records |
| IUPHAR/BPS GtoPdb | expert-curated pharmacology | licensed/commercial access if used |
| UniProt | target/protein identity/function | Core candidate |
| Reactome | reaction/pathway | content-type-specific rights |

`Plant contains X` and `X affects target Y` remain separate evidence edges.

## 7. Metabolism / Genomics / Multi-omics

| Source | Primary role | Integration intent |
|---|---|---|
| Phytozome / Ensembl Plants | genome/gene | source-specific |
| PMN / PlantCyc | plant gene–enzyme–reaction–pathway | licensed/core candidate |
| plantiSMASH | candidate biosynthetic gene clusters | prediction layer |
| MetaboLights | metabolomics raw/metadata | dataset-license aware |
| Metabolomics Workbench | metabolomics studies | source-specific |
| GNPS | MS/MS networking/library context | source/license aware |
| PAFTOL / Tree of Life resources | phylogenomics | source-specific |

Predicted pathway/BGC never becomes validated pathway without evidence.

## 8. Clinical evidence

| Source | Primary role | Integration intent |
|---|---|---|
| PubMed | literature discovery/citation graph | metadata-first |
| Europe PMC | literature/OA/fulltext annotations | OA/license-filtered |
| ClinicalTrials.gov | trial registry/results metadata | structured federation |
| WHO ICTRP | global trial registry aggregation | federation |
| PROSPERO | systematic-review protocol registry | federation |
| Cochrane | high-quality synthesis | reference/licensed; no unauthorized scraping |
| EMA assessments | regulatory evidence review | document-family policy |

Primary evidence unit is Trial/Outcome, not paper count.

## 9. Safety / Toxicology / Pharmacovigilance

| Source | Primary role | Integration intent |
|---|---|---|
| EFSA Compendium of Botanicals | botanical hazards/constituents | source-specific |
| EFSA OpenFoodTox | toxicological studies/reference values | source-specific |
| EPA CompTox | chemical toxicity/exposure/ADME | source-specific |
| LiverTox | hepatotoxicity reference | reference/source-specific |
| WHO herb–drug interaction materials | interaction methods/evidence | reference |
| LactMed | lactation evidence | source-specific |
| MHLW toxic plant/food poisoning | Japan poisoning incidents | official source |
| FDA CAERS/openFDA | adverse-event signals | signal layer |
| WHO VigiAccess | global pharmacovigilance signals | signal/reference |
| PMDA JADER | Japanese suspected ADRs | terms-compliant adapter |
| regulator product alerts | adulteration/hidden drug/contamination | high-priority watcher |

Signal count never equals causality or incidence rate.

## 10. Traditional knowledge / terminology / rights

| Source | Primary role | Integration intent |
|---|---|---|
| WHO traditional medicine terminology | standardized terminology | source-specific |
| classical/historical texts | historical record | rights/provenance dependent |
| TKDL | protected/defensive documentation | restricted/formal access only |
| Local Contexts | cultural labels/protocol concepts | rights model reference/integration |
| community/lineage authority | living knowledge | explicit permission/authority |
| Nagoya Protocol / CBD frameworks | access/benefit-sharing policy | governance reference |
| WIPO GR/TK frameworks | IP/provenance governance | governance reference |
| CARE Principles | Indigenous data governance principles | governance reference |

YAKU's goal is not to ingest all traditional knowledge. It must know that some knowledge exists while respecting metadata-only/restricted/secret states.

## 11. Conservation / legality

| Source | Primary role | Integration intent |
|---|---|---|
| IUCN Red List | conservation assessment | commercial terms considered |
| Species+ / CITES | regulated international trade | federation |
| national/local law | harvest/collection legality | jurisdiction-specific reference |

`identified` ≠ `legal to collect`. Collection legality requires jurisdiction, land status, protection status and purpose.

## 12. Integration status enum

Every Source Registry entry uses:

```text
APPROVED_CORE
APPROVED_FEDERATION
CONDITIONAL_LICENSE
REFERENCE_ONLY
RESTRICTED
BLOCKED
NEEDS_REVIEW
```

No source enters production ingestion without an explicit status.

## 13. Missing-data semantics

Absence must be scoped.

Bad:
```text
No medicinal use.
```

Good:
```text
No medicinal-use record was found in the currently connected sources as of <date>.
```

The same rule applies to distribution, toxicity, interactions, clinical evidence, traditional knowledge and conservation.

## 14. Required implementation artifact

Before G1+, create a machine-readable `source-registry` with:

- source ID/name
- purpose
- integration mode
- base URL/API
- rights policy ID
- attribution template
- allowed AI uses
- current version/update cadence
- last terms review
- owner/team
- health/status
- fallback behavior

This catalog is the human-readable design counterpart of that registry.
