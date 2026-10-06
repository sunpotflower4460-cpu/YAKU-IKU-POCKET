import {
  validateKnowledgeAssertion,
} from '../../../types/globalPlantBrain';
import {
  CURRENT_CATALOG_TAXONOMY_ASSERTIONS,
  CURRENT_CATALOG_TAXONOMY_SNAPSHOT,
} from '../taxonomyAssertions';

describe('versioned current-catalog taxonomy assertions (G1)', () => {
  it('creates 149 resolution assertions, eight synonym relations and three conflict views', () => {
    const resolution = CURRENT_CATALOG_TAXONOMY_ASSERTIONS.filter(
      (assertion) => assertion.predicate === 'taxonomy_resolution',
    );
    const synonyms = CURRENT_CATALOG_TAXONOMY_ASSERTIONS.filter(
      (assertion) =>
        assertion.predicate === 'catalog_scientific_name_relation',
    );
    const conflictViews = CURRENT_CATALOG_TAXONOMY_ASSERTIONS.filter(
      (assertion) => assertion.predicate === 'taxonomy_authority_view',
    );

    expect(resolution).toHaveLength(149);
    expect(synonyms).toHaveLength(8);
    expect(conflictViews).toHaveLength(3);
    expect(CURRENT_CATALOG_TAXONOMY_ASSERTIONS).toHaveLength(160);
  });

  it('keeps every assertion structurally valid and source-backed', () => {
    for (const assertion of CURRENT_CATALOG_TAXONOMY_ASSERTIONS) {
      expect(validateKnowledgeAssertion(assertion)).toEqual([]);
      expect(assertion.sourceRefIds.length).toBeGreaterThan(0);
      expect(assertion.status).toBe('active');
    }
  });

  it('uses unique stable YAKU assertion IDs', () => {
    const ids = CURRENT_CATALOG_TAXONOMY_ASSERTIONS.map(
      (assertion) => assertion.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^yaku:assertion:/);
    }
  });

  it('preserves the Hyssopus conflict as three authority views', () => {
    const conflictResolution = CURRENT_CATALOG_TAXONOMY_ASSERTIONS.find(
      (assertion) =>
        assertion.subjectId === 'yaku:taxon:h047' &&
        assertion.predicate === 'taxonomy_resolution',
    );
    const authorityViews = CURRENT_CATALOG_TAXONOMY_ASSERTIONS.filter(
      (assertion) =>
        assertion.subjectId === 'yaku:taxon:h047' &&
        assertion.predicate === 'taxonomy_authority_view',
    );

    expect(conflictResolution?.object).toEqual(
      expect.objectContaining({ state: 'conflicted' }),
    );
    expect(authorityViews).toHaveLength(3);
  });

  it('pins the snapshot to the exact reviewed source versions', () => {
    expect(CURRENT_CATALOG_TAXONOMY_SNAPSHOT.id).toBe(
      'yaku:snapshot:taxonomy-current-catalog-2026-10-06',
    );
    expect(
      CURRENT_CATALOG_TAXONOMY_SNAPSHOT.taxonomyVersions.catalogueOfLife,
    ).toContain('2026-09-25 XR');
    expect(CURRENT_CATALOG_TAXONOMY_SNAPSHOT.policyVersion).toBe(
      'gpb-g1-taxonomy-resolution-v1',
    );
  });
});
