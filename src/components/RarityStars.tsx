import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Rarity } from '../types';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  rarity: Rarity;
  size?: 'sm' | 'md' | 'lg';
}

const ICON_SIZES = { sm: 11, md: 15, lg: 20 };

export function RarityStars({ rarity, size = 'md' }: Props) {
  const theme = useTheme();
  const safeRarity = Math.max(1, Math.min(5, rarity)) as Rarity;
  const color = [
    theme.colors.rarityCommon,
    theme.colors.rarityUncommon,
    theme.colors.rarityRare,
    theme.colors.rarityEpic,
    theme.colors.rarityLegendary,
  ][safeRarity - 1];
  const iconSize = ICON_SIZES[size];

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`珍しさの目安、5段階中${safeRarity}`}
    >
      <View
        style={styles.stars}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Ionicons
            key={index}
            name={index < safeRarity ? 'star' : 'star-outline'}
            size={iconSize}
            color={index < safeRarity ? color : theme.colors.textTertiary}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'flex-start' },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
});
