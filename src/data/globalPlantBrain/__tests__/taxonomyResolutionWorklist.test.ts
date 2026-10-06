import { CURRENT_CATALOG_TAXA } from '../taxonSeedRegistry';
import { CURRENT_CATALOG_TAXONOMY_WORKLIST } from '../taxonomyResolutionWorklist';

describe('current catalog taxonomy resolution worklist (G1)', () => {
  it('creates one authoritative-resolution query per current canonical taxon', () => {
    expect(CURRENT_CATALOG_TAXONOMY_WORKLIST).toHaveLength(149);
    expect(CURRENT_CATALOG_TAXONOMY_WORKLIST).toHaveLength(
      CURRENT_CATALOG_TAXA.length,
    );
  });

  it('keeps every query plant-scoped and linked to the YAKU taxon identity', () => {
    for (const query of CURRENT_CATALOG_TAXONOMY_WORKLIST) {
      expect(query.kingdom).toBe('Plantae');
      expect(query.expectedRank).toBe('species');
      expect(query.scientificName.trim()).not.toBe('');
      expect(query.yakuTaxonConceptId).toMatch(/^yaku:taxon:/);
    }
  });
});
