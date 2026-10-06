import { PLANTS, TOTAL_PLANTS } from '../../plants';
import {
  CURRENT_CATALOG_TAXA,
  PRODUCT_TAXON_ALIASES,
  getCanonicalTaxonIdForPlant,
  getCurrentCatalogTaxon,
} from '../taxonSeedRegistry';

describe('current catalog canonical taxon mapping (GPB-006)', () => {
  it('maps all 150 product cards to a canonical YAKU taxon ID', () => {
    expect(PLANTS).toHaveLength(TOTAL_PLANTS);
    expect(TOTAL_PLANTS).toBe(150);

    for (const plant of PLANTS) {
      expect(getCanonicalTaxonIdForPlant(plant.id)).toMatch(/^yaku:taxon:/);
    }
  });

  it('creates 149 taxon seeds because スギナ and ツクシ are the same species', () => {
    expect(CURRENT_CATALOG_TAXA).toHaveLength(149);
    expect(PRODUCT_TAXON_ALIASES).toEqual({ p009: 'p005' });

    const suginaId = getCanonicalTaxonIdForPlant('p005');
    const tsukushiId = getCanonicalTaxonIdForPlant('p009');

    expect(tsukushiId).toBe(suginaId);

    const taxon = getCurrentCatalogTaxon(suginaId);
    expect(taxon?.scientificName).toBe('Equisetum arvense');
    expect(taxon?.productPlantIds).toEqual(['p005', 'p009']);
  });

  it('promotes only the 139 exact accepted COL matches and leaves 10 cases for review', () => {
    const resolved = CURRENT_CATALOG_TAXA.filter(
      (taxon) => taxon.resolutionStatus === 'externally_resolved',
    );
    const localSeeds = CURRENT_CATALOG_TAXA.filter(
      (taxon) => taxon.resolutionStatus === 'local_seed',
    );

    expect(resolved).toHaveLength(139);
    expect(localSeeds).toHaveLength(10);

    for (const taxon of resolved) {
      expect(taxon.externalIds.col).toMatch(/^[A-Z0-9]+$/);
      expect(taxon.resolutionEvidence?.provider).toBe('catalogue_of_life');
      expect(taxon.resolutionEvidence?.sourceDatasetKey).toBe('316441');
    }

    for (const taxon of localSeeds) {
      expect(taxon.externalIds).toEqual({});
      expect(taxon.resolutionEvidence).toBeUndefined();
    }
  });

  it('does not split duplicate scientific names across different canonical taxa', () => {
    const byScientificName = new Map<string, Set<string>>();

    for (const plant of PLANTS) {
      const key = plant.nameLatin.trim().toLowerCase();
      const ids = byScientificName.get(key) ?? new Set<string>();
      ids.add(getCanonicalTaxonIdForPlant(plant.id));
      byScientificName.set(key, ids);
    }

    for (const ids of byScientificName.values()) {
      expect(ids.size).toBe(1);
    }
  });

  it('does not accidentally collapse different scientific names into one taxon', () => {
    for (const taxon of CURRENT_CATALOG_TAXA) {
      const scientificNames = new Set(
        taxon.productPlantIds.map(
          (plantId) => PLANTS.find((plant) => plant.id === plantId)!.nameLatin,
        ),
      );
      expect(scientificNames.size).toBe(1);
    }
  });

  it('keeps every product plant represented exactly once across taxon seeds', () => {
    const allProductIds = CURRENT_CATALOG_TAXA.flatMap(
      (taxon) => taxon.productPlantIds,
    );

    expect(allProductIds).toHaveLength(TOTAL_PLANTS);
    expect(new Set(allProductIds).size).toBe(TOTAL_PLANTS);
    expect([...allProductIds].sort()).toEqual(
      PLANTS.map((plant) => plant.id).sort(),
    );
  });
});
