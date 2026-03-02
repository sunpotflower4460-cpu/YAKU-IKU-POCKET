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

const RARITY_COLOR: Record<number, string> = {
  1: '#9E9E9E',
  2: '#4CAF50',
  3: '#2196F3',
  4: '#9C27B0',
  5: '#FF8F00',
};

const RARITY_BG: Record<number, string> = {
  1: '#F5F5F5',
  2: '#F1F8E9',
  3: '#E3F2FD',
  4: '#F3E5F5',
  5: '#FFF8E1',
};

export function PlantCard({ plant, discovered, onPress }: Props) {
  const rarityColor = RARITY_COLOR[plant.rarity];
  const rarityBg = RARITY_BG[plant.rarity];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        plant.danger === 'RED' && discovered && styles.dangerCard,
      ]}
      onPress={onPress}
    >
      {/* Rarity color strip at top */}
      <View style={[styles.rarityStrip, { backgroundColor: rarityColor }]} />

      {/* Emoji circle */}
      <View style={[styles.emojiWrap, { backgroundColor: rarityBg }]}>
        {discovered ? (
          <Text style={styles.emoji}>{plant.emoji}</Text>
        ) : (
          <Text style={styles.questionMark}>？</Text>
        )}
      </View>

      {/* Plant name */}
      <Text
        style={[styles.name, !discovered && styles.unknownName]}
        numberOfLines={2}
      >
        {discovered ? plant.name : '？？？'}
      </Text>

      {/* Rarity stars */}
      <RarityStars rarity={plant.rarity} size="sm" />

      {/* Danger badge (discovered only) */}
      {discovered && <DangerBadge danger={plant.danger} size="sm" />}

      {/* Checkmark badge for discovered */}
      {discovered && (
        <View style={[styles.checkBadge, { backgroundColor: rarityColor }]}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    flex: 1,
    margin: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
    gap: 4,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  dangerCard: {
    backgroundColor: '#FFF5F5',
  },
  rarityStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  emojiWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  emoji: {
    fontSize: 32,
  },
  questionMark: {
    fontSize: 26,
    color: '#BDBDBD',
    fontWeight: '900',
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
    paddingHorizontal: 2,
  },
  unknownName: {
    color: '#BDBDBD',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
