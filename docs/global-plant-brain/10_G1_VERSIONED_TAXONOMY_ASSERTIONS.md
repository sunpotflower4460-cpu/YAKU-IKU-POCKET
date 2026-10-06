# G1 Versioned Taxonomy Assertions

> Status: IMPLEMENTED  
> Date: 2026-10-06

## Why

The current catalog seed registry is a useful product projection, but it is still a mutable current view. G1 therefore also writes deterministic, source-backed taxonomy assertions that can survive future taxonomy changes.

## Current assertion set

The 149 canonical taxa now generate:

- 149 `taxonomy_resolution` assertions
- 8 `catalog_scientific_name_relation` assertions for reviewed synonyms
- 3 `taxonomy_authority_view` assertions for the Hyssopus conflict

Total: **160 active taxonomy assertions**.

## Snapshot

`CURRENT_CATALOG_TAXONOMY_SNAPSHOT` pins:

- Catalogue of Life: 2026-09-25 XR / ChecklistBank 316441
- Catalogue of Life DOI: 10.48580/dgz9s
- Kew Names and Taxonomic Backbone: 2026
- World Flora Online: 2026
- cross-source review date: 2026-10-06
- policy version: `gpb-g1-taxonomy-resolution-v1`

## Append-only intent

When a future taxonomy release changes a relationship:

1. keep the old assertion
2. mark it superseded when appropriate
3. create a replacement assertion
4. link old/new assertion IDs
5. create a new knowledge snapshot
6. re-evaluate dependent claims

The old product answer remains reproducible from its original snapshot.

## Product boundary

These assertions do not automatically alter the visible scientific name in the app. Product-facing editorial migration is separate from knowledge identity and can be staged later.
