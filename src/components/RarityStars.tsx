import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

// sm: minimum 12px for legibility on card grids, md: 16px, lg: 22px
const FONT_SIZES = { sm: 12, md: 16, lg: 22 };

export function RarityStars({ rarity, size = 'md' }: Props) {
  const safeRarity = Math.max(1, Math.min(5, rarity)) as Rarity;
  const color = RARITY_COLORS[safeRarity];
  const fontSize = FONT_SIZES[size];
  const stars = '★'.repeat(safeRarity) + '☆'.repeat(5 - safeRarity);

  return (
    <View style={styles.container}>
      <Text style={[styles.stars, { color, fontSize }]}>{stars}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    letterSpacing: 1,
  },
});
