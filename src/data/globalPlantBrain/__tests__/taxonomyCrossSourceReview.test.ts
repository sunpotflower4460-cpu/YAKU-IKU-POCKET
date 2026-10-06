import {
  CONFLICTED_TAXON_REVIEWS,
  RECONCILED_TAXON_REVIEWS,
} from '../taxonomyCrossSourceReview';

describe('cross-source taxonomy review (G1)', () => {
  it('reconciles eight synonym cases and keeps one explicit conflict', () => {
    expect(RECONCILED_TAXON_REVIEWS).toHaveLength(8);
    expect(CONFLICTED_TAXON_REVIEWS).toHaveLength(1);
    expect(CONFLICTED_TAXON_REVIEWS[0]?.taxonId).toBe('yaku:taxon:h047');
  });

  it('requires both COL and Kew/WCVP evidence for every reconciled case', () => {
    for (const review of RECONCILED_TAXON_REVIEWS) {
      expect(review.references.some((ref) => ref.provider === 'catalogue_of_life')).toBe(true);
      expect(review.references.some((ref) => ref.provider === 'wcvp')).toBe(true);
      expect(review.acceptedColId).toMatch(/^[A-Z0-9]+$/);
      expect(review.preferredScientificName.trim()).not.toBe('');
    }
  });

  it('does not silently choose a preferred concept for Hyssopus officinalis', () => {
    const conflict = CONFLICTED_TAXON_REVIEWS[0]!;
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
    expect(wfo?.relation).toBe('alternative_taxonomy');
  });
});
