import { PLANTS, TOTAL_PLANTS } from '../../plants';
import {
  CURRENT_CATALOG_TAXA,
  PRODUCT_TAXON_ALIASES,
  getCanonicalTaxonIdForPlant,
  getCurrentCatalogTaxon,
  inferTaxonRankFromScientificName,
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

  it('preserves infraspecific ranks from scientific names', () => {
    expect(inferTaxonRankFromScientificName('Veratrum album subsp. oxysepalum')).toBe('subspecies');
    expect(inferTaxonRankFromScientificName('Hemerocallis fulva var. angustifolia')).toBe('variety');
    expect(inferTaxonRankFromScientificName('Equisetum arvense')).toBe('species');

    expect(getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('p042'))?.rank).toBe('subspecies');
    expect(getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('p046'))?.rank).toBe('variety');
    expect(getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('p047'))?.rank).toBe('variety');
    expect(getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('p056'))?.rank).toBe('variety');
    expect(getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('p077'))?.rank).toBe('variety');
  });

  it('represents all 149 taxa as resolved, reconciled or explicitly conflicted', () => {
    const resolved = CURRENT_CATALOG_TAXA.filter(
      (taxon) => taxon.resolutionStatus === 'externally_resolved',
    );
    const reconciled = CURRENT_CATALOG_TAXA.filter(
      (taxon) => taxon.resolutionStatus === 'externally_reconciled',
    );
    const conflicted = CURRENT_CATALOG_TAXA.filter(
      (taxon) => taxon.resolutionStatus === 'conflicted',
    );
    const localSeeds = CURRENT_CATALOG_TAXA.filter(
      (taxon) => taxon.resolutionStatus === 'local_seed',
    );

    expect(resolved).toHaveLength(137);
    expect(reconciled).toHaveLength(7);
    expect(conflicted).toHaveLength(5);
    expect(localSeeds).toHaveLength(0);

    for (const taxon of [...resolved, ...reconciled, ...conflicted]) {
      expect(taxon.externalIds.col).toMatch(/^[A-Z0-9]+$/);
      expect(taxon.resolutionEvidence?.provider).toBe('catalogue_of_life');
      expect(taxon.resolutionEvidence?.sourceDatasetKey).toBe('316441');
    }

    const withWfo = CURRENT_CATALOG_TAXA.filter(
      (taxon) => Boolean(taxon.externalIds.wfo),
    );
    expect(withWfo).toHaveLength(144);
    for (const taxon of withWfo) {
      expect(taxon.externalIds.wfo).toMatch(/^wfo-\d+$/);
      expect(taxon.supportingResolutionEvidence?.some(
        (evidence) => evidence.provider === 'world_flora_online',
      )).toBe(true);
    }

    for (const taxon of reconciled) {
      expect(taxon.preferredScientificName).toBeTruthy();
      expect(taxon.preferredRank).toBeTruthy();
      expect(taxon.authorityReferences?.some(
        (ref) => ref.provider === 'catalogue_of_life',
      )).toBe(true);
      expect(taxon.authorityReferences?.some(
        (ref) => ref.provider === 'wcvp',
      )).toBe(true);
    }

    expect(conflicted.map((taxon) => taxon.id).sort()).toEqual(
      ['p001', 'p060', 'p079', 'h043', 'h047']
        .map((id) => getCanonicalTaxonIdForPlant(id))
        .sort(),
    );

    for (const taxon of conflicted) {
      expect(taxon.preferredScientificName).toBeUndefined();
      expect(taxon.externalIds.col).toMatch(/^[A-Z0-9]+$/);
      expect(taxon.externalIds.wfo).toBeUndefined();
      expect(taxon.authorityReferences).toHaveLength(3);
    }
  });

  it('preserves product-facing catalog scientific names after reconciliation', () => {
    expect(
      getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('p006'))?.scientificName,
    ).toBe('Pueraria lobata');
    expect(
      getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('p006'))
        ?.preferredScientificName,
    ).toBe('Pueraria montana var. lobata');

    expect(
      getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('h070'))?.scientificName,
    ).toBe('Hibiscus sabdariffa');
    expect(
      getCurrentCatalogTaxon(getCanonicalTaxonIdForPlant('h070'))
        ?.preferredScientificName,
    ).toBe('Sabdariffa gossypiifolia');
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
