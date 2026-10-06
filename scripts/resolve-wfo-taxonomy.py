#!/usr/bin/env python3
"""
Resolve the current 149 YAKU canonical taxa against the pinned
World Flora Online Plant List 2026-06 static backbone.

Inputs are downloaded and checksum-verified by GitHub Actions:
- _DwC_backbone_R.zip -> classification.csv
- ipni_to_wfo.csv.gz

The resolver is intentionally conservative:
- scientific name must match exactly after whitespace/case normalization
- rank must match the YAKU expected rank
- duplicate exact-rank WFO usages are reported as ambiguous, not guessed
- synonyms retain both matched-name and accepted-name identifiers
"""

from __future__ import annotations

import csv
import gzip
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Iterable, List

ROOT = Path.cwd()
WORKLIST = ROOT / "scripts/data/current-catalog-taxa.json"
CLASSIFICATION = ROOT / ".cache/wfo/backbone/classification.csv"
IPNI_MAP = ROOT / ".cache/wfo/ipni_to_wfo.csv.gz"
OUT_DIR = ROOT / "artifacts/taxonomy-resolution"
OUT_JSON = OUT_DIR / "wfo-resolution-2026-06.json"
OUT_MD = OUT_DIR / "wfo-resolution-summary.md"

WFO_SOURCE = {
    "provider": "world_flora_online",
    "releaseLabel": "2026-06",
    "publishedAt": "2026-06-21",
    "doi": "10.5281/zenodo.20782718",
    "backboneFile": "_DwC_backbone_R.zip",
    "backboneMd5": "0e4486945cd9f7af548ca87eb9a870ed",
    "ipniMapFile": "ipni_to_wfo.csv.gz",
    "ipniMapMd5": "faa5aae66e51dce6b9890a4f78817bb6",
    "license": "CC0 1.0",
}


def norm(value: str | None) -> str:
    return " ".join((value or "").strip().split()).casefold()


def slim(row: Dict[str, str]) -> Dict[str, str | None]:
    return {
        "wfoId": row.get("taxonID") or None,
        "scientificNameId": row.get("scientificNameID") or None,
        "scientificName": row.get("scientificName") or None,
        "rank": row.get("taxonRank") or None,
        "authorship": row.get("scientificNameAuthorship") or None,
        "family": row.get("family") or None,
        "taxonomicStatus": row.get("taxonomicStatus") or None,
        "acceptedNameUsageId": row.get("acceptedNameUsageID") or None,
        "originalNameUsageId": row.get("originalNameUsageID") or None,
        "nomenclaturalStatus": row.get("nomenclaturalStatus") or None,
        "modified": row.get("modified") or None,
        "source": row.get("source") or None,
    }


def iter_backbone() -> Iterable[Dict[str, str]]:
    with CLASSIFICATION.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh, delimiter="\t", quotechar='"')
        required = {
            "taxonID",
            "scientificNameID",
            "scientificName",
            "taxonRank",
            "taxonomicStatus",
            "acceptedNameUsageID",
        }
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise RuntimeError(f"WFO classification.csv missing columns: {sorted(missing)}")
        yield from reader


def main() -> None:
    worklist = json.loads(WORKLIST.read_text(encoding="utf-8"))
    taxa = worklist.get("taxa", [])
    if len(taxa) != 149:
        raise RuntimeError(f"Expected 149 taxa, got {len(taxa)}")

    by_name: Dict[str, List[dict]] = defaultdict(list)
    for query in taxa:
        by_name[norm(query["scientificName"])].append(query)

    raw_matches: Dict[str, List[Dict[str, str]]] = defaultdict(list)
    for row in iter_backbone():
        key = norm(row.get("scientificName"))
        if key in by_name:
            raw_matches[key].append(row)

    selected: Dict[str, Dict[str, str] | None] = {}
    decisions: Dict[str, str] = {}
    accepted_ids = set()
    relevant_wfo_ids = set()

    for query in taxa:
        key = norm(query["scientificName"])
        candidates = raw_matches.get(key, [])
        exact_rank = [
            row for row in candidates
            if norm(row.get("taxonRank")) == norm(query["expectedRank"])
        ]

        unique = {}
        for row in exact_rank:
            if row.get("taxonID"):
                unique[row["taxonID"]] = row
        exact_rank = list(unique.values())

        if len(exact_rank) == 1:
            row = exact_rank[0]
            selected[query["yakuTaxonConceptId"]] = row
            decisions[query["yakuTaxonConceptId"]] = "exact_rank_match"
            relevant_wfo_ids.add(row["taxonID"])
            accepted_id = row.get("acceptedNameUsageID") or (
                row["taxonID"]
                if norm(row.get("taxonomicStatus")) == "accepted"
                else None
            )
            if accepted_id:
                accepted_ids.add(accepted_id)
                relevant_wfo_ids.add(accepted_id)
        elif len(exact_rank) > 1:
            selected[query["yakuTaxonConceptId"]] = None
            decisions[query["yakuTaxonConceptId"]] = "ambiguous_exact_rank"
            relevant_wfo_ids.update(
                row["taxonID"] for row in exact_rank if row.get("taxonID")
            )
        elif candidates:
            selected[query["yakuTaxonConceptId"]] = None
            decisions[query["yakuTaxonConceptId"]] = "rank_mismatch"
            relevant_wfo_ids.update(
                row["taxonID"] for row in candidates if row.get("taxonID")
            )
        else:
            selected[query["yakuTaxonConceptId"]] = None
            decisions[query["yakuTaxonConceptId"]] = "no_exact_name_match"

    accepted_rows: Dict[str, Dict[str, str]] = {}
    if accepted_ids:
        for row in iter_backbone():
            taxon_id = row.get("taxonID")
            if taxon_id in accepted_ids:
                accepted_rows[taxon_id] = row
                if len(accepted_rows) == len(accepted_ids):
                    break

    ipni_by_wfo: Dict[str, List[str]] = defaultdict(list)
    with gzip.open(IPNI_MAP, "rt", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames != ["ipni_id", "wfo_id"]:
            raise RuntimeError(
                f"Unexpected IPNI/WFO mapping header: {reader.fieldnames}"
            )
        for row in reader:
            wfo_id = row.get("wfo_id")
            ipni_id = row.get("ipni_id")
            if wfo_id in relevant_wfo_ids and ipni_id:
                ipni_by_wfo[wfo_id].append(ipni_id)

    results = []
    counts = Counter()

    for query in taxa:
        taxon_id = query["yakuTaxonConceptId"]
        decision = decisions[taxon_id]
        row = selected[taxon_id]

        result = {
            **query,
            "decision": decision,
            "matched": None,
            "accepted": None,
            "matchedIpniLsids": [],
            "acceptedIpniLsids": [],
            "autoLinkableAcceptedConcept": False,
        }

        if row is not None:
            matched = slim(row)
            matched_wfo = row.get("taxonID")
            result["matched"] = matched

            direct_ipni = row.get("scientificNameID")
            mapped_ipni = ipni_by_wfo.get(matched_wfo or "", [])
            result["matchedIpniLsids"] = sorted(
                set(([direct_ipni] if direct_ipni else []) + mapped_ipni)
            )

            status = norm(row.get("taxonomicStatus"))
            accepted_id = row.get("acceptedNameUsageID") or (
                matched_wfo if status == "accepted" else None
            )
            accepted = accepted_rows.get(accepted_id or "")
            if accepted is not None:
                result["accepted"] = slim(accepted)
                accepted_direct_ipni = accepted.get("scientificNameID")
                accepted_mapped = ipni_by_wfo.get(accepted_id or "", [])
                result["acceptedIpniLsids"] = sorted(
                    set(
                        ([accepted_direct_ipni] if accepted_direct_ipni else [])
                        + accepted_mapped
                    )
                )

            if status == "accepted":
                counts["exact_accepted"] += 1
                result["autoLinkableAcceptedConcept"] = True
            elif status == "synonym":
                counts["exact_synonym"] += 1
            elif status == "unchecked":
                counts["exact_unchecked"] += 1
            else:
                counts[f"exact_{status or 'unknown'}"] += 1
        else:
            counts[decision] += 1
            key = norm(query["scientificName"])
            result["candidates"] = [slim(x) for x in raw_matches.get(key, [])]

        results.append(result)

    summary = {
        "inputTaxonCount": len(taxa),
        "exactAccepted": counts["exact_accepted"],
        "exactSynonym": counts["exact_synonym"],
        "exactUnchecked": counts["exact_unchecked"],
        "ambiguousExactRank": counts["ambiguous_exact_rank"],
        "rankMismatch": counts["rank_mismatch"],
        "noExactNameMatch": counts["no_exact_name_match"],
        "otherExactStatus": sum(
            count
            for key, count in counts.items()
            if key.startswith("exact_")
            and key not in {"exact_accepted", "exact_synonym", "exact_unchecked"}
        ),
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "schemaVersion": 1,
        "source": WFO_SOURCE,
        "worklistSchemaVersion": worklist.get("schemaVersion"),
        "summary": summary,
        "results": results,
    }
    OUT_JSON.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    review_rows = []
    for row in results:
        if not row["autoLinkableAcceptedConcept"]:
            matched = row.get("matched") or {}
            accepted = row.get("accepted") or {}
            review_rows.append(
                "| {id} | {name} | {decision} | {status} | {matched_id} | {accepted_name} |".format(
                    id=row["yakuTaxonConceptId"],
                    name=row["scientificName"],
                    decision=row["decision"],
                    status=matched.get("taxonomicStatus") or "",
                    matched_id=matched.get("wfoId") or "",
                    accepted_name=accepted.get("scientificName") or "",
                )
            )

    md = [
        "# WFO 2026-06 Resolution Summary",
        "",
        "Source: World Flora Online Plant List 2026-06",
        "DOI: 10.5281/zenodo.20782718",
        "",
        "## Counts",
        "",
        f"- input taxa: {summary['inputTaxonCount']}",
        f"- exact accepted: {summary['exactAccepted']}",
        f"- exact synonym: {summary['exactSynonym']}",
        f"- exact unchecked: {summary['exactUnchecked']}",
        f"- ambiguous exact-rank: {summary['ambiguousExactRank']}",
        f"- rank mismatch: {summary['rankMismatch']}",
        f"- no exact name match: {summary['noExactNameMatch']}",
        f"- other exact status: {summary['otherExactStatus']}",
        "",
        "## Non-auto-linkable cases",
        "",
        "| YAKU Taxon | Catalog name | Decision | WFO status | Matched WFO ID | Accepted name |",
        "|---|---|---|---|---|---|",
        *(review_rows or ["| — | — | — | — | — | — |"]),
        "",
    ]
    OUT_MD.write_text("\n".join(md), encoding="utf-8")

    print("SUMMARY " + json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
