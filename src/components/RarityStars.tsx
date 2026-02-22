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

const FONT_SIZES = { sm: 10, md: 14, lg: 20 };

export function RarityStars({ rarity, size = 'md' }: Props) {
  const color = RARITY_COLORS[rarity];
  const fontSize = FONT_SIZES[size];
  const stars = '★'.repeat(rarity) + '☆'.repeat(5 - rarity);

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
