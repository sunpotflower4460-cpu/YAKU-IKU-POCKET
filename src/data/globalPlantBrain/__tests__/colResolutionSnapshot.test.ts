import {
  COL_AUTO_RESOLVED_IDS,
  COL_RESOLUTION_SOURCE,
  COL_RESOLUTION_SUMMARY,
  COL_REVIEW_QUEUE,
  COL_REVIEW_TAXON_IDS,
} from '../colResolutionSnapshot';

describe('COL current-catalog resolution snapshot (G1)', () => {
  it('captures the successful 149-taxon live resolution run', () => {
    expect(COL_RESOLUTION_SUMMARY).toEqual({
      autoResolve: 139,
      needsReview: 10,
      unresolved: 0,
      transportError: 0,
    });
    expect(Object.keys(COL_AUTO_RESOLVED_IDS)).toHaveLength(139);
    expect(COL_REVIEW_QUEUE).toHaveLength(10);
  });

  it('pins every promotion to the exact COL release used by the live run', () => {
    expect(COL_RESOLUTION_SOURCE.releaseLabel).toBe('2026-09-25 XR');
    expect(COL_RESOLUTION_SOURCE.datasetKey).toBe('316441');
    expect(COL_RESOLUTION_SOURCE.doi).toBe('10.48580/dgz9s');
  });

  it('keeps auto-resolved and review-queue taxa disjoint', () => {
    for (const taxonId of COL_REVIEW_TAXON_IDS) {
      expect(COL_AUTO_RESOLVED_IDS[taxonId]).toBeUndefined();
    }
  });

  it('preserves the ten non-trivial synonym/rank cases for review', () => {
    expect([...COL_REVIEW_TAXON_IDS].sort()).toEqual(
      [
        'yaku:taxon:h047',
        'yaku:taxon:h070',
        'yaku:taxon:p006',
        'yaku:taxon:p042',
        'yaku:taxon:p046',
        'yaku:taxon:p047',
        'yaku:taxon:p056',
        'yaku:taxon:p060',
        'yaku:taxon:p068',
        'yaku:taxon:p077',
      ].sort(),
    );
  });

  it('stores only COL-style alphanumeric IDs in the promoted mapping', () => {
    for (const id of Object.values(COL_AUTO_RESOLVED_IDS)) {
      expect(id).toMatch(/^[A-Z0-9]+$/);
    }
  });
});
