import { getPlantUses } from '../plantUses';
import { getPlantById } from '../plants';

describe('getPlantUses (PR22, honesty policy)', () => {
  it('includes the universal observe/press activities for every plant', () => {
    const plant = getPlantById('p001')!;
    const uses = getPlantUses(plant);
    expect(uses.some((u) => u.category === 'ecology')).toBe(true);
    expect(uses.some((u) => u.category === 'decoration')).toBe(true);
  });

  it('surfaces the existing effects tags as traditional_record culture content, never as a medical claim', () => {
    const plant = getPlantById('p001')!;
    const uses = getPlantUses(plant);
    const culture = uses.find((u) => u.category === 'culture')!;
    expect(culture.evidenceLevel).toBe('traditional_record');
    expect(culture.summary).toContain(plant.effects[0]);
    expect(culture.warnings.some((w) => w.includes('保証するものではありません'))).toBe(true);
  });

  it('never fabricates preparation steps — the food category (if present) says data is pending, not a recipe', () => {
    const greenPlant = getPlantById('p001')!; // GREEN danger
    const uses = getPlantUses(greenPlant);
    const food = uses.find((u) => u.category === 'food');
    expect(food).toBeDefined();
    expect(food!.preparation).toBeUndefined();
    expect(food!.summary).toContain('準備中');
  });

  it('does not offer a food-category card for RED (dangerous) plants', () => {
    const dangerousPlant = getPlantById('p024')!; // トリカブト, RED
    const uses = getPlantUses(dangerousPlant);
    expect(uses.some((u) => u.category === 'food')).toBe(false);
  });

  it('restricts food-category allowedOrigins to store-bought/verified-home-grown, never wild sourcing', () => {
    const greenPlant = getPlantById('p001')!;
    const uses = getPlantUses(greenPlant);
    const food = uses.find((u) => u.category === 'food');
    expect(food!.allowedOrigins).not.toContain('wild_observed');
    expect(food!.allowedOrigins).not.toContain('wild_collected');
  });

  it('surfaces a real, cited dish name for the small set of species with a verified source (PR32)', () => {
    const yomogi = getPlantById('p002')!; // ヨモギ
    const uses = getPlantUses(yomogi);
    const food = uses.find((u) => u.category === 'food')!;
    expect(food.summary).not.toContain('準備中');
    expect(food.evidenceLevel).toBe('official_guidance');
    expect(food.sourceRefs.length).toBeGreaterThan(0);
    for (const ref of food.sourceRefs) {
      expect(new URL(ref).hostname.endsWith('.go.jp')).toBe(true);
    }
  });

  it('never claims a food use for a species legally treated as a crude drug, not a food (PR32)', () => {
    const gennoshoko = getPlantById('p031')!; // ゲンノショウコ, GREEN danger but not a food ingredient
    const uses = getPlantUses(gennoshoko);
    const food = uses.find((u) => u.category === 'food')!;
    expect(food.summary).not.toContain('準備中');
    expect(food.summary).toContain('生薬');
    expect(food.preparation).toBeUndefined();
  });
});
