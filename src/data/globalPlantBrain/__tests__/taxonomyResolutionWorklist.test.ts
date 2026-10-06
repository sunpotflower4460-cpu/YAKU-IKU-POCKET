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
      expect(['species', 'subspecies', 'variety', 'form']).toContain(
        query.expectedRank,
      );
      expect(query.scientificName.trim()).not.toBe('');
      expect(query.yakuTaxonConceptId).toMatch(/^yaku:taxon:/);
    }
  });

  it('uses the correct infraspecific rank for the five catalog names below species', () => {
    const byId = new Map(
      CURRENT_CATALOG_TAXONOMY_WORKLIST.map((query) => [
        query.yakuTaxonConceptId,
        query,
      ]),
    );

    expect(byId.get('yaku:taxon:p042' as any)?.expectedRank).toBe('subspecies');
    for (const id of ['p046', 'p047', 'p056', 'p077']) {
      expect(byId.get(`yaku:taxon:${id}` as any)?.expectedRank).toBe('variety');
    }
  });
});
