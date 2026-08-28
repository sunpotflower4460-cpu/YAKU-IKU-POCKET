import { darkColors, lightColors } from '../colors';

function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected 6-digit hex color, got: ${hex}`);
  }

  const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function expectAaText(foreground: string, background: string) {
  expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
}

describe('semantic theme contrast', () => {
  test('light text roles remain readable on every standard light surface', () => {
    const backgrounds = [
      lightColors.canvas,
      lightColors.canvasElevated,
      lightColors.surfacePrimary,
      lightColors.surfaceSecondary,
      lightColors.surfaceTertiary,
    ];

    for (const background of backgrounds) {
      expectAaText(lightColors.textPrimary, background);
      expectAaText(lightColors.textSecondary, background);
      expectAaText(lightColors.textTertiary, background);
    }
  });

  test('dark text roles remain readable on every standard dark surface', () => {
    const backgrounds = [
      darkColors.canvas,
      darkColors.canvasElevated,
      darkColors.surfacePrimary,
      darkColors.surfaceSecondary,
      darkColors.surfaceTertiary,
    ];

    for (const background of backgrounds) {
      expectAaText(darkColors.textPrimary, background);
      expectAaText(darkColors.textSecondary, background);
      expectAaText(darkColors.textTertiary, background);
    }
  });

  test('primary accent buttons keep readable text in both themes', () => {
    expectAaText(lightColors.textOnAccent, lightColors.accentPrimary);
    expectAaText(lightColors.textOnAccent, lightColors.accentPrimaryPressed);
    expectAaText(darkColors.textOnAccent, darkColors.accentPrimary);
    expectAaText(darkColors.textOnAccent, darkColors.accentPrimaryPressed);
  });

  test('danger and caution emphasis colors are readable against primary surfaces', () => {
    expectAaText(lightColors.statusDanger, lightColors.surfacePrimary);
    expectAaText(lightColors.statusCaution, lightColors.surfacePrimary);
    expectAaText(darkColors.statusDanger, darkColors.surfacePrimary);
    expectAaText(darkColors.statusCaution, darkColors.surfacePrimary);
  });
});
