import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Rarity } from '../types';
import { Colors } from '../constants/colors';

interface Props {
  rarity: Rarity;
  size?: 'sm' | 'md' | 'lg';
}

const RARITY_COLORS: Record<Rarity, string> = {
  1: Colors.rarity1,
  2: Colors.rarity2,
  3: Colors.rarity3,
  4: Colors.rarity4,
  5: Colors.rarity5,
};

// sm: 10px, md: 14px, lg: 20px
const ICON_SIZES = { sm: 10, md: 14, lg: 20 };

export function RarityStars({ rarity, size = 'md' }: Props) {
  const safeRarity = Math.max(1, Math.min(5, rarity)) as Rarity;
  const color = RARITY_COLORS[safeRarity];
  const iconSize = ICON_SIZES[size];

  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < safeRarity ? 'star' : 'star-outline'}
          size={iconSize}
          color={i < safeRarity ? color : Colors.rarity1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
});
