import {
  evaluateTaxonomyOperation,
  CURRENT_TAXONOMY_CONFLICTS,
  getTaxonomyConflict,
} from '../taxonomyConflictRegistry';
import { getCanonicalTaxonIdForPlant } from '../taxonSeedRegistry';

describe('G1 taxonomy conflict policy', () => {
  it('keeps exactly five material authority conflicts active', () => {
    expect(CURRENT_TAXONOMY_CONFLICTS).toHaveLength(5);
    expect(
      CURRENT_TAXONOMY_CONFLICTS.map((conflict) => conflict.taxonId).sort(),
    ).toEqual(
      ['p001', 'p060', 'p079', 'h043', 'h047']
        .map(getCanonicalTaxonIdForPlant)
        .sort(),
    );
  });

  it('allows identity-preserving lookups while blocking automatic concept changes', () => {
    for (const conflict of CURRENT_TAXONOMY_CONFLICTS) {
      expect(
        evaluateTaxonomyOperation(conflict.taxonId, 'catalog_lookup'),
      ).toBe('allow');
      expect(
        evaluateTaxonomyOperation(conflict.taxonId, 'plant_name_lookup'),
      ).toBe('allow');
      expect(
        evaluateTaxonomyOperation(
          conflict.taxonId,
          'source_scoped_evidence',
        ),
      ).toBe('allow');

      expect(
        evaluateTaxonomyOperation(
          conflict.taxonId,
          'preferred_name_autoselect',
        ),
      ).toBe('deny');
      expect(
        evaluateTaxonomyOperation(
          conflict.taxonId,
          'external_accepted_id_promotion',
        ),
      ).toBe('deny');

      expect(
        evaluateTaxonomyOperation(conflict.taxonId, 'taxon_merge'),
      ).toBe('review');
      expect(
        evaluateTaxonomyOperation(
          conflict.taxonId,
          'cross_source_evidence_merge',
        ),
      ).toBe('review');
    }
  });

  it('keeps Citrus junos as a rank/hybrid/ambiguous conflict', () => {
    const conflict = getTaxonomyConflict(
      getCanonicalTaxonIdForPlant('h043'),
    );

    expect(conflict?.kinds).toEqual(
      expect.arrayContaining([
        'rank_disagreement',
        'hybrid_status_disagreement',
        'ambiguous_usage',
      ]),
    );
  });

  it('keeps Calystegia japonica as an accepted-concept disagreement', () => {
    const conflict = getTaxonomyConflict(
      getCanonicalTaxonIdForPlant('p060'),
    );

    expect(conflict?.kinds).toContain(
      'accepted_concept_disagreement',
    );
  });

  it('allows normal automatic operations for non-conflicted taxa', () => {
    expect(
      evaluateTaxonomyOperation(
        getCanonicalTaxonIdForPlant('p005'),
        'preferred_name_autoselect',
      ),
    ).toBe('allow');
  });

  it('records all three reviewed authority providers for every conflict', () => {
    for (const conflict of CURRENT_TAXONOMY_CONFLICTS) {
      expect(conflict.authorityProviders).toEqual(
        expect.arrayContaining([
          'catalogue_of_life',
          'world_flora_online',
          'wcvp',
        ]),
      );
      expect(conflict.policyVersion).toBe(
        'gpb-g1-taxonomy-conflict-v1',
      );
    }
  });
});
