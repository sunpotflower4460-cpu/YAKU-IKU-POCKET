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
  { icon: string; label: string; bg: string; text: string; border: string }
> = {
  GREEN: {
    icon: '🟢',
    label: '食用可能',
    bg: Colors.dangerGreenBg,
    text: Colors.dangerGreen,
    border: '#A5D6A7',
  },
  YELLOW: {
    icon: '🟡',
    label: '注意が必要',
    bg: Colors.dangerYellowBg,
    text: Colors.dangerYellow,
    border: '#FFE082',
  },
  RED: {
    icon: '🔴',
    label: '危険・有毒',
    bg: Colors.dangerRedBg,
    text: Colors.dangerRed,
    border: '#EF9A9A',
  },
};

export function DangerBadge({ danger, size = 'md' }: Props) {
  const config = DANGER_CONFIG[danger];
  const isSmall = size === 'sm';

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
      <Text style={[styles.icon, { fontSize: isSmall ? 10 : 14 }]}>
        {config.icon}
      </Text>
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
  icon: {},
  label: {
    fontWeight: '700',
  },
});
