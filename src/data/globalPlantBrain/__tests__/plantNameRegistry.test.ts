import {
  validateKnowledgeAssertion,
  validatePlantNameRecord,
} from '../../../types/globalPlantBrain';
import {
  CATALOG_NAME_NOMENCLATURE_COVERAGE,
} from '../plantNameNomenclatureSnapshot';
import {
  CURRENT_CATALOG_PLANT_NAMES,
  getPlantNamesForTaxon,
} from '../plantNameRegistry';
import {
  CURRENT_CATALOG_NOMENCLATURE_ASSERTIONS,
  CURRENT_CATALOG_NOMENCLATURE_SNAPSHOT,
} from '../plantNameAssertions';
import { getCanonicalTaxonIdForPlant } from '../taxonSeedRegistry';

describe('current-catalog Plant Name Graph (G1)', () => {
  it('creates 149 catalog names plus seven reviewed preferred accepted names', () => {
    const catalog = CURRENT_CATALOG_PLANT_NAMES.filter(
      (name) => name.role === 'catalog_scientific',
    );
    const preferred = CURRENT_CATALOG_PLANT_NAMES.filter(
      (name) => name.role === 'preferred_accepted',
    );

    expect(catalog).toHaveLength(149);
    expect(preferred).toHaveLength(7);
    expect(CURRENT_CATALOG_PLANT_NAMES).toHaveLength(156);
  });

  it('keeps every name source-backed and structurally valid', () => {
    for (const name of CURRENT_CATALOG_PLANT_NAMES) {
      expect(validatePlantNameRecord(name)).toEqual([]);
      expect(name.taxonConceptIds).toHaveLength(1);
      expect(name.sourceRefIds.length).toBeGreaterThan(0);
    }
  });

  it('puts IPNI LSIDs on names rather than taxon concepts', () => {
    const withIpni = CURRENT_CATALOG_PLANT_NAMES.filter(
      (name) => name.nomenclaturalIds.ipniLsid,
    );
    expect(withIpni).toHaveLength(154);

    for (const name of withIpni) {
      expect(name.nomenclaturalIds.ipniLsid).toMatch(
        /^urn:lsid:ipni\.org:names:/,
      );
    }
  });

  it('keeps the two catalog synonym names without a fabricated IPNI LSID', () => {
    expect(CATALOG_NAME_NOMENCLATURE_COVERAGE).toEqual(
      expect.objectContaining({
        catalogNamesWithIpniLsid: 147,
        catalogNamesWithoutIpniLsid: 2,
        missingCatalogIpniPlantIds: ['p046', 'p047'],
      }),
    );

    for (const plantId of ['p046', 'p047']) {
      const names = getPlantNamesForTaxon(
        getCanonicalTaxonIdForPlant(plantId),
      );
      const catalog = names.find(
        (name) => name.role === 'catalog_scientific',
      );
      const accepted = names.find(
        (name) => name.role === 'preferred_accepted',
      );

      expect(catalog?.nomenclaturalIds.ipniLsid).toBeUndefined();
      expect(accepted?.nomenclaturalIds.ipniLsid).toMatch(
        /^urn:lsid:ipni\.org:names:/,
      );
    }
  });

  it('keeps Citrus junos name identity even while its taxon concept is conflicted', () => {
    const names = getPlantNamesForTaxon(getCanonicalTaxonIdForPlant('h043'));
    const catalog = names.find(
      (name) => name.role === 'catalog_scientific',
    );

    expect(catalog?.value).toBe('Citrus junos');
    expect(catalog?.nomenclaturalIds.ipniLsid).toBe(
      'urn:lsid:ipni.org:names:771942-1',
    );
    expect(catalog?.nomenclaturalIds.wfoNameUsageId).toBeUndefined();
  });

  it('records the manually verified Zingiber mioga IPNI name identifier separately', () => {
    const names = getPlantNamesForTaxon(getCanonicalTaxonIdForPlant('h037'));
    const catalog = names.find(
      (name) => name.role === 'catalog_scientific',
    );

    expect(catalog?.nomenclaturalIds.ipniLsid).toBe(
      'urn:lsid:ipni.org:names:798364-1',
    );
    expect(
      catalog?.sourceRefIds.some((id) => id.endsWith(':ipni')),
    ).toBe(true);
  });

  it('creates one versioned nomenclatural assertion per name record', () => {
    expect(CURRENT_CATALOG_NOMENCLATURE_ASSERTIONS).toHaveLength(156);

    for (const assertion of CURRENT_CATALOG_NOMENCLATURE_ASSERTIONS) {
      expect(validateKnowledgeAssertion(assertion)).toEqual([]);
      expect(assertion.subjectType).toBe('plant_name');
      expect(assertion.predicate).toBe('nomenclatural_identity');
    }
  });

  it('pins the nomenclature snapshot to WFO 2026-06 and 2026-10-07 IPNI review', () => {
    expect(CURRENT_CATALOG_NOMENCLATURE_SNAPSHOT.id).toBe(
      'yaku:snapshot:nomenclature-current-catalog-2026-10-07',
    );
    expect(
      CURRENT_CATALOG_NOMENCLATURE_SNAPSHOT.taxonomyVersions.worldFloraOnline,
    ).toContain('2026-06');
    expect(
      CURRENT_CATALOG_NOMENCLATURE_SNAPSHOT.sourceVersions.ipni,
    ).toContain('2026-10-07');
    expect(CURRENT_CATALOG_NOMENCLATURE_SNAPSHOT.policyVersion).toBe(
      'gpb-g1-nomenclature-v1',
    );
  });
});
