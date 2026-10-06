#!/usr/bin/env node

/**
 * Resolve the current YAKU catalog against Catalogue of Life XR.
 *
 * This script is intentionally standalone:
 * - public API only
 * - no secrets
 * - pinned COL release/checklist metadata
 * - no repository mutation
 * - writes an artifact for review
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const WORKLIST = path.resolve('scripts/data/current-catalog-taxa.json');
const OUT_DIR = path.resolve('artifacts/taxonomy-resolution');
const OUT_JSON = path.join(OUT_DIR, 'col-resolution-2026-09-25.json');
const OUT_MD = path.join(OUT_DIR, 'col-resolution-summary.md');

const COL = {
  provider: 'catalogue_of_life',
  releaseLabel: '2026-09-25 XR',
  issuedAt: '2026-09-25',
  datasetKey: '316441',
  checklistKey: '7ddf754f-d193-4cc9-b351-99906754a03b',
  doi: '10.48580/dgz9s',
  endpoint: 'https://api.gbif.org/v2/species/match',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeStatus(value) {
  switch (String(value ?? '').toUpperCase()) {
    case 'ACCEPTED': return 'accepted';
    case 'PROVISIONALLY_ACCEPTED':
    case 'PROVISIONALLY ACCEPTED': return 'provisionally_accepted';
    case 'SYNONYM': return 'synonym';
    case 'AMBIGUOUS_SYNONYM':
    case 'AMBIGUOUS SYNONYM': return 'ambiguous_synonym';
    case 'MISAPPLIED': return 'misapplied';
    default: return 'unknown';
  }
}

function normalizeMatchType(value) {
  switch (String(value ?? '').toUpperCase()) {
    case 'EXACT': return 'exact';
    case 'VARIANT': return 'variant';
    case 'FUZZY': return 'fuzzy';
    case 'NONE': return 'none';
    default: return value ? 'ambiguous' : 'none';
  }
}

function buildUrl(scientificName, expectedRank) {
  const url = new URL(COL.endpoint);
  url.searchParams.set('checklistKey', COL.checklistKey);
  url.searchParams.set('scientificName', scientificName);
  url.searchParams.set('taxonRank', String(expectedRank).toUpperCase());
  url.searchParams.set('kingdom', 'Plantae');
  return url.toString();
}

async function fetchJsonWithRetry(url, maxAttempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'YAKU-IKU-POCKET taxonomy-resolution/1.0',
        },
      });

      if (response.ok) return await response.json();

      const body = await response.text();
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) {
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 400)}`);
      }
      lastError = new Error(`HTTP ${response.status}: ${body.slice(0, 400)}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxAttempts) {
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
    }
  }
  throw lastError;
}

function parseCandidate(input, raw) {
  const usage = raw?.usage;
  const matchType = normalizeMatchType(raw?.diagnostics?.matchType);
  if (!usage?.key || !usage?.name || !usage?.rank || matchType === 'none') {
    return undefined;
  }

  const accepted = raw?.acceptedUsage?.key && raw?.acceptedUsage?.name
    ? {
        providerRecordId: String(raw.acceptedUsage.key),
        scientificName: String(raw.acceptedUsage.name),
        canonicalName: raw.acceptedUsage.canonicalName ? String(raw.acceptedUsage.canonicalName) : undefined,
        rank: raw.acceptedUsage.rank ? String(raw.acceptedUsage.rank) : undefined,
        status: normalizeStatus(raw.acceptedUsage.status),
      }
    : undefined;

  return {
    provider: COL.provider,
    providerRecordId: String(usage.key),
    queriedName: input.scientificName,
    scientificName: String(usage.name),
    canonicalName: usage.canonicalName ? String(usage.canonicalName) : undefined,
    rank: String(usage.rank),
    status: normalizeStatus(usage.status),
    matchType,
    confidence: Number.isFinite(raw?.diagnostics?.confidence) ? raw.diagnostics.confidence : undefined,
    acceptedTaxon: accepted,
    classification: Array.isArray(raw?.classification)
      ? raw.classification
          .filter((node) => node?.key && node?.name && node?.rank)
          .map((node) => ({
            providerRecordId: String(node.key),
            name: String(node.name),
            rank: String(node.rank),
          }))
      : [],
    sourceVersion: {
      provider: COL.provider,
      releaseLabel: COL.releaseLabel,
      issuedAt: COL.issuedAt,
      datasetKey: COL.datasetKey,
      checklistKey: COL.checklistKey,
      doi: COL.doi,
    },
  };
}

function assess(input, candidate) {
  if (!candidate) {
    return { decision: 'unresolved', reasons: ['no_authoritative_match'] };
  }

  const reasons = [];
  const isPlant = candidate.classification.some(
    (node) => String(node.rank).toLowerCase() === 'kingdom' &&
      String(node.name).toLowerCase() === 'plantae',
  );

  if (!isPlant) reasons.push('kingdom_not_confirmed_plantae');
  if (String(candidate.rank).toLowerCase() !== String(input.expectedRank).toLowerCase()) reasons.push('rank_mismatch');
  if (candidate.matchType !== 'exact') reasons.push(`match_type_${candidate.matchType}`);
  if (candidate.status !== 'accepted') reasons.push(`status_${candidate.status}`);
  if (candidate.confidence != null && candidate.confidence < 95) {
    reasons.push('confidence_below_auto_threshold');
  }

  if (reasons.length) {
    return { decision: 'needs_review', reasons };
  }
  return { decision: 'auto_resolve', reasons: ['exact_accepted_plant_match'] };
}

async function main() {
  const worklist = JSON.parse(await fs.readFile(WORKLIST, 'utf8'));
  if (!Array.isArray(worklist.taxa) || worklist.taxa.length !== 149) {
    throw new Error('Expected exactly 149 canonical taxa in worklist');
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const results = [];
  for (let index = 0; index < worklist.taxa.length; index += 1) {
    const input = worklist.taxa[index];
    const url = buildUrl(input.scientificName, input.expectedRank);
    let raw;
    let error;

    try {
      raw = await fetchJsonWithRetry(url);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const candidate = error ? undefined : parseCandidate(input, raw);
    const assessment = error
      ? { decision: 'unresolved', reasons: ['transport_error'] }
      : assess(input, candidate);

    results.push({
      ...input,
      queryUrl: url,
      candidate,
      assessment,
      error,
    });

    console.log(
      `[${index + 1}/${worklist.taxa.length}] ${input.scientificName}: ${assessment.decision}` +
        (candidate ? ` -> ${candidate.canonicalName ?? candidate.scientificName} [${candidate.status}/${candidate.matchType}/${candidate.confidence ?? 'n/a'}]` : '') +
        (error ? ` ERROR ${error}` : ''),
    );

    await sleep(80);
  }

  const counts = results.reduce(
    (acc, row) => {
      acc[row.assessment.decision] += 1;
      if (row.error) acc.transport_error += 1;
      return acc;
    },
    { auto_resolve: 0, needs_review: 0, unresolved: 0, transport_error: 0 },
  );

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: COL,
    inputTaxonCount: worklist.taxa.length,
    summary: counts,
    results,
  };

  await fs.writeFile(OUT_JSON, JSON.stringify(output, null, 2) + '\n', 'utf8');

  const reviewRows = results
    .filter((row) => row.assessment.decision !== 'auto_resolve')
    .map((row) =>
      `| ${row.yakuTaxonConceptId} | ${row.scientificName} | ${row.assessment.decision} | ${row.assessment.reasons.join(', ')} | ${row.candidate?.canonicalName ?? row.candidate?.scientificName ?? ''} |`
    );

  const markdown = [
    '# COL Taxonomy Resolution Summary',
    '',
    `Generated: ${output.generatedAt}`,
    `Release: ${COL.releaseLabel} / ChecklistBank ${COL.datasetKey} / DOI ${COL.doi}`,
    '',
    '## Counts',
    '',
    `- auto_resolve: ${counts.auto_resolve}`,
    `- needs_review: ${counts.needs_review}`,
    `- unresolved: ${counts.unresolved}`,
    `- transport_error: ${counts.transport_error}`,
    '',
    '## Non-auto-resolved taxa',
    '',
    '| YAKU Taxon | Input name | Decision | Reasons | Candidate |',
    '|---|---|---|---|---|',
    ...(reviewRows.length ? reviewRows : ['| — | — | — | — | — |']),
    '',
  ].join('\n');

  await fs.writeFile(OUT_MD, markdown, 'utf8');

  console.log('SUMMARY ' + JSON.stringify(counts));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
