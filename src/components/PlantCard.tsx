import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Plant } from '../types';
import { Colors } from '../constants/colors';
import { RarityStars } from './RarityStars';
import { DangerBadge } from './DangerBadge';

interface Props {
  plant: Plant;
  discovered: boolean;
  onPress: () => void;
}

const RARITY_GLOW: Record<number, string> = {
  1: '#E0E0E0',
  2: '#C8E6C9',
  3: '#BBDEFB',
  4: '#E1BEE7',
  5: '#FFE0B2',
};

export function PlantCard({ plant, discovered, onPress }: Props) {
  const glowColor = RARITY_GLOW[plant.rarity];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderColor: glowColor, opacity: pressed ? 0.85 : 1 },
        plant.danger === 'RED' && discovered && styles.dangerCard,
      ]}
      onPress={onPress}
    >
      {/* Emoji / Silhouette */}
      <View
        style={[styles.emojiContainer, { backgroundColor: glowColor + '80' }]}
      >
        <Text style={[styles.emoji, !discovered && styles.hidden]}>
          {plant.emoji}
        </Text>
        {!discovered && <Text style={styles.unknown}>？</Text>}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.name, !discovered && styles.unknownText]}
          numberOfLines={1}
        >
          {discovered ? plant.name : '？？？'}
        </Text>
        <Text style={styles.category}>{plant.category}</Text>
        <RarityStars rarity={plant.rarity} size="sm" />
        {discovered && (
          <DangerBadge danger={plant.danger} size="sm" />
        )}
      </View>

      {/* New badge */}
      {discovered && (
        <View style={[styles.discoveredDot, { backgroundColor: glowColor }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
    flex: 1,
    margin: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerCard: {
    borderColor: '#EF9A9A',
    backgroundColor: '#FFF5F5',
  },
  emojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 32,
  },
  hidden: {
    opacity: 0,
    position: 'absolute',
  },
  unknown: {
    fontSize: 28,
    color: '#BDBDBD',
    fontWeight: '900',
  },
  info: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  unknownText: {
    color: '#BDBDBD',
  },
  category: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  discoveredDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
