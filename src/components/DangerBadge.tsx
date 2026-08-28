import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DangerLevel } from '../types';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  danger: DangerLevel;
  size?: 'sm' | 'md';
  /** Set false when a parent control already includes the attention category. */
  accessible?: boolean;
}

const DANGER_LABELS: Record<DangerLevel, string> = {
  // Describe the species generally — never assert the scanned specimen is
  // safe to eat because identification remains provisional.
  GREEN: '一般に食用とされる',
  YELLOW: '要注意',
  RED: '危険・有毒',
};

export const DANGER_LABEL: Record<DangerLevel, string> = DANGER_LABELS;

/** Stable colors for legacy call sites that draw a small status dot. */
export const DANGER_DOT_COLOR: Record<DangerLevel, string> = {
  GREEN: '#43A047',
  YELLOW: '#F9A825',
  RED: '#E53935',
};

export function DangerBadge({ danger, size = 'md', accessible = true }: Props) {
  const theme = useTheme();
  const isSmall = size === 'sm';
  const dotSize = isSmall ? 7 : 9;
  const statusColor = danger === 'RED'
    ? theme.colors.statusDanger
    : danger === 'YELLOW'
      ? theme.colors.statusCaution
      : theme.colors.statusObserved;
  // Preserve the semantic status colour in the dot/border, but keep small
  // label text comfortably above AA contrast in light mode rather than
  // depending on a status colour that may sit close to the 4.5:1 threshold.
  const labelColor = theme.mode === 'dark' ? statusColor : theme.colors.textPrimary;

  return (
    <View
      accessible={accessible}
      accessibilityElementsHidden={!accessible}
      importantForAccessibility={accessible ? 'auto' : 'no-hide-descendants'}
      accessibilityRole={accessible ? 'text' : undefined}
      accessibilityLabel={accessible ? `植物情報の注意区分、${DANGER_LABELS[danger]}` : undefined}
      style={[
        styles.badge,
        {
          backgroundColor: `${statusColor}${theme.mode === 'dark' ? '22' : '12'}`,
          borderColor: `${statusColor}55`,
          paddingHorizontal: isSmall ? 7 : 10,
          paddingVertical: isSmall ? 3 : 5,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: statusColor,
          },
        ]}
        accessibilityElementsHidden
      />
      <Text
        style={[
          styles.label,
          {
            color: labelColor,
            fontSize: isSmall ? 11 : 13,
            lineHeight: isSmall ? 15 : 18,
          },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {DANGER_LABELS[danger]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  dot: { flexShrink: 0 },
  label: { flexShrink: 1, fontWeight: '700' },
});
