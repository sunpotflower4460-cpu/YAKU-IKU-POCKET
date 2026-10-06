#!/usr/bin/env node

/**
 * WFO 2026-06 resolver placeholder.
 *
 * The first workflow run intentionally fails after archive introspection if the
 * parser has not yet been finalized against the pinned DwCA metadata. This
 * prevents guessing field layout from an older WFO export.
 */

throw new Error(
  'WFO resolver parser not finalized yet: inspect pinned 2026-06 DwCA metadata first.',
);
