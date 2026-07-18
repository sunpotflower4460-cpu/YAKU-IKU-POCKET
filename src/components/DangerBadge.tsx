import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DangerLevel } from '../types';
import { Colors } from '../constants/colors';

interface Props {
  danger: DangerLevel;
  size?: 'sm' | 'md';
}

const DANGER_CONFIG: Record<
  DangerLevel,
  { dotColor: string; label: string; bg: string; text: string; border: string }
> = {
  GREEN: {
    dotColor: '#43A047',
    // Describe the species generally — never assert the *scanned* specimen is
    // safe to eat (identification is not guaranteed reliable).
    label: '一般に食用とされる',
    bg: Colors.dangerGreenBg,
    text: Colors.dangerGreen,
    border: '#A5D6A7',
  },
  YELLOW: {
    dotColor: '#F9A825',
    label: '要注意',
    bg: Colors.dangerYellowBg,
    text: Colors.dangerYellow,
    border: '#FFE082',
  },
  RED: {
    dotColor: '#E53935',
    label: '危険・有毒',
    bg: Colors.dangerRedBg,
    text: Colors.dangerRed,
    border: '#EF9A9A',
  },
};

export function DangerBadge({ danger, size = 'md' }: Props) {
  const config = DANGER_CONFIG[danger];
  const isSmall = size === 'sm';
  const dotSize = isSmall ? 8 : 10;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 5,
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
            backgroundColor: config.dotColor,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: config.text, fontSize: isSmall ? 10 : 12 },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {},
  label: {
    fontWeight: '700',
  },
});
