import { PLANTS, TOTAL_PLANTS } from '../plants';
import { PLANT_DEFINITIONS, getPlantDefinitionById } from '../plantDefinitions';
import { getSafetyWarnings } from '../safety';

describe('PLANT_DEFINITIONS (§10.1 knowledge schema derivation)', () => {
  it('has exactly one definition per cataloged plant, in the same order', () => {
    expect(PLANT_DEFINITIONS).toHaveLength(TOTAL_PLANTS);
    expect(PLANT_DEFINITIONS.map((d) => d.id)).toEqual(PLANTS.map((p) => p.id));
  });

  it('every definition has a non-empty family and genus (editorial botanical knowledge)', () => {
    for (const def of PLANT_DEFINITIONS) {
      expect(Boolean(def.taxonomy.family)).toBe(true);
      expect(Boolean(def.taxonomy.genus)).toBe(true);
    }
  });

  it('never fabricates external taxon IDs (left empty pending real API access)', () => {
    for (const def of PLANT_DEFINITIONS) {
      expect(def.taxonomy.taxonIds).toEqual({});
    }
  });

  it('never fabricates source citations (empty, or a real gov/public-body URL for RED species)', () => {
    // PR29 attaches real citations only to the 14 RED (high_risk) species, found via
    // WebSearch against government/municipal sources. Every other species must stay
    // empty rather than have a citation invented for it.
    const AUTHORITATIVE_HOST_PATTERN = /\.(go\.jp|lg\.jp|nihs\.go\.jp)$/;
    for (const def of PLANT_DEFINITIONS) {
      expect(def.sourceRefs).toEqual(def.safety.sourceRefs);
      if (def.safety.level !== 'high_risk') {
        expect(def.sourceRefs).toEqual([]);
        continue;
      }
      for (const ref of def.sourceRefs) {
        const url = new URL(ref);
        expect(url.protocol).toBe('https:');
        expect(AUTHORITATIVE_HOST_PATTERN.test(url.hostname)).toBe(true);
      }
    }
  });

  it('maps danger level to safety.level faithfully', () => {
    const trikabuto = getPlantDefinitionById('p024')!; // RED
    const seri = getPlantDefinitionById('p008')!; // YELLOW
    const tanpopo = getPlantDefinitionById('p001')!; // GREEN
    expect(trikabuto.safety.level).toBe('high_risk');
    expect(seri.safety.level).toBe('caution');
    expect(tanpopo.safety.level).toBe('general_observation');
  });

  it('carries over the traditional-use tags with a non-medical evidence status', () => {
    const def = getPlantDefinitionById('p001')!; // タンポポ has non-empty effects
    const plant = PLANTS.find((p) => p.id === 'p001')!;
    expect(def.culturalUses).toHaveLength(plant.effects.length);
    for (const use of def.culturalUses ?? []) {
      expect(use.evidenceStatus).toBe('traditional_folklore');
    }
  });

  it('builds a symmetric look-alike graph from safety.ts (both directions)', () => {
    // p008 セリ -> lists ドクゼリ (not in DB, no inDbId) — no in-DB lookalike link
    // p002 ヨモギ -> lists トリカブト with inDbId 'p024', so both directions should link
    const yomogi = getPlantDefinitionById('p002')!;
    const trikabuto = getPlantDefinitionById('p024')!;
    expect(yomogi.lookalikeIds).toContain('p024');
    expect(trikabuto.lookalikeIds).toContain('p002');
  });

  it('never invents toxic parts beyond what the existing warningNote states', () => {
    const niwatoko = getPlantDefinitionById('p022')!;
    expect(niwatoko.safety.toxicParts).toEqual(['生の実', '葉', '樹皮']);

    const trikabuto = getPlantDefinitionById('p024')!;
    // トリカブト's warningNote doesn't enumerate specific parts — must stay empty.
    expect(trikabuto.safety.toxicParts).toEqual([]);
  });

  it('every definition is marked editorial, not falsely claimed as expert-reviewed', () => {
    for (const def of PLANT_DEFINITIONS) {
      expect(def.reviewStatus).toBe('editorial');
    }
  });

  it('confusedWith names match the look-alike data used elsewhere in the app', () => {
    const seri = getPlantDefinitionById('p008')!;
    const warnings = getSafetyWarnings('p008');
    expect(seri.safety.confusedWith).toEqual(warnings.map((w) => w.name));
  });
});
