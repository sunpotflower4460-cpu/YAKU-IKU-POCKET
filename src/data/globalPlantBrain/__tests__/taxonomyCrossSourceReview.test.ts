import {
  CONFLICTED_TAXON_REVIEWS,
  RECONCILED_TAXON_REVIEWS,
} from '../taxonomyCrossSourceReview';

describe('cross-source taxonomy review (G1)', () => {
  it('reconciles seven synonym cases and preserves five material authority conflicts', () => {
    expect(RECONCILED_TAXON_REVIEWS).toHaveLength(7);
    expect(CONFLICTED_TAXON_REVIEWS).toHaveLength(5);

    expect(CONFLICTED_TAXON_REVIEWS.map((review) => review.taxonId).sort()).toEqual(
      [
        'yaku:taxon:p001',
        'yaku:taxon:p060',
        'yaku:taxon:p079',
        'yaku:taxon:h043',
        'yaku:taxon:h047',
      ].sort(),
    );
  });

  it('requires both COL and current Kew/WCVP evidence for every reconciled case', () => {
    for (const review of RECONCILED_TAXON_REVIEWS) {
      expect(
        review.references.some(
          (ref) => ref.provider === 'catalogue_of_life',
        ),
      ).toBe(true);
      expect(
        review.references.some((ref) => ref.provider === 'wcvp'),
      ).toBe(true);
      expect(review.acceptedColId).toMatch(/^[A-Z0-9]+$/);
      expect(review.preferredScientificName.trim()).not.toBe('');
    }
  });

  it('keeps every material conflict backed by three authority views', () => {
    for (const conflict of CONFLICTED_TAXON_REVIEWS) {
      expect(conflict.acceptedColId).toMatch(/^[A-Z0-9]+$/);
      expect(conflict.references).toHaveLength(3);
      expect(
        conflict.references.some(
          (ref) => ref.provider === 'catalogue_of_life',
        ),
      ).toBe(true);
      expect(
        conflict.references.some(
          (ref) => ref.provider === 'world_flora_online',
        ),
      ).toBe(true);
      expect(
        conflict.references.some((ref) => ref.provider === 'wcvp'),
      ).toBe(true);
    }
  });

  it('preserves the explicit Hyssopus disagreement instead of choosing a preferred concept', () => {
    const conflict = CONFLICTED_TAXON_REVIEWS.find(
      (review) => review.taxonId === 'yaku:taxon:h047',
    )!;

    const col = conflict.references.find(
      (ref) => ref.provider === 'catalogue_of_life',
    );
    const wcvp = conflict.references.find((ref) => ref.provider === 'wcvp');
    const wfo = conflict.references.find(
      (ref) => ref.provider === 'world_flora_online',
    );

    expect(col?.acceptedScientificName).toBe(
      'Dracocephalum officinale subsp. officinale',
    );
    expect(col?.acceptedRank).toBe('subspecies');

    expect(wcvp?.acceptedScientificName).toBe('Dracocephalum officinale');
    expect(wcvp?.acceptedRank).toBe('species');

    expect(wfo?.matchedStatus).toBe('accepted');
    expect(wfo?.acceptedScientificName).toBe('Hyssopus officinalis');
    expect(wfo?.acceptedRank).toBe('species');
    expect(wfo?.relation).toBe('conflict');
  });

  it('keeps the Calystegia and Eupatorium source-version disagreements visible', () => {
    const calystegia = CONFLICTED_TAXON_REVIEWS.find(
      (review) => review.taxonId === 'yaku:taxon:p060',
    )!;
    const eupatorium = CONFLICTED_TAXON_REVIEWS.find(
      (review) => review.taxonId === 'yaku:taxon:p079',
    )!;

    expect(
      calystegia.references.find(
        (ref) => ref.provider === 'world_flora_online',
      )?.acceptedScientificName,
    ).toBe('Calystegia pubescens');

    expect(
      eupatorium.references.find(
        (ref) => ref.provider === 'world_flora_online',
      )?.acceptedScientificName,
    ).toBe('Eupatorium chinense');
    expect(
      eupatorium.references.find((ref) => ref.provider === 'wcvp')
        ?.acceptedScientificName,
    ).toBe('Eupatorium japonicum');
  });
});
