import { lightColors, darkColors } from '../colors';
import { space, radius, type as typeScale, minTapTarget } from '../tokens';

describe('theme tokens', () => {
  it('light and dark palettes define the same keys', () => {
    expect(Object.keys(lightColors).sort()).toEqual(Object.keys(darkColors).sort());
  });

  it('every color is a non-empty string', () => {
    for (const [k, v] of Object.entries(lightColors)) {
      expect(typeof v).toBe('string');
      expect((v as string).length).toBeGreaterThan(0);
    }
  });

  it('exposes a 4pt-based spacing scale', () => {
    expect(space[1]).toBe(4);
    expect(space[4]).toBe(16);
  });

  it('enforces the 44pt minimum tap target', () => {
    expect(minTapTarget).toBe(44);
  });

  it('radius scale is monotonically non-decreasing from control to sheet', () => {
    expect(radius.control).toBeLessThanOrEqual(radius.card);
    expect(radius.card).toBeLessThanOrEqual(radius.major);
    expect(radius.major).toBeLessThanOrEqual(radius.sheet);
  });

  it('type scale has distinct sizes for display down to caption2', () => {
    expect(typeScale.display).toBeGreaterThan(typeScale.title1);
    expect(typeScale.title1).toBeGreaterThan(typeScale.body);
    expect(typeScale.body).toBeGreaterThan(typeScale.caption2);
  });
});
