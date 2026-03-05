import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  1: Colors.rarity1,
  2: Colors.rarity2,
  3: Colors.rarity3,
  4: Colors.rarity4,
  5: Colors.rarity5,
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      tension: 300,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const isLegendary = plant.rarity === 5;
  const isSuperRare = plant.rarity === 4;

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}
    >
      <Pressable
        style={[
          styles.card,
          plant.danger === 'RED' && discovered && styles.dangerCard,
          (isLegendary || isSuperRare) && discovered && styles.rareCard,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Rarity color strip at top */}
        <View style={[styles.rarityStrip, { backgroundColor: rarityColor }]} />

        {/* Subtle glow background for rare cards */}
        {(isLegendary || isSuperRare) && discovered && (
          <View
            style={[styles.rarityGlow, { backgroundColor: rarityColor + '14' }]}
          />
        )}

        {/* Emoji circle */}
        <View
          style={[
            styles.emojiWrap,
            { backgroundColor: discovered ? rarityBg : '#EEEEEE' },
          ]}
        >
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

        {/* Hint indicator for undiscovered */}
        {!discovered && (
          <View style={styles.hintChip}>
            <Text style={styles.hintChipText}>ヒント</Text>
          </View>
        )}

        {/* Checkmark badge for discovered */}
        {discovered && (
          <View style={[styles.checkBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: 4,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
    gap: 4,
  },
  dangerCard: {
    backgroundColor: '#FFF5F5',
  },
  rareCard: {
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
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
  rarityGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emojiWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  emoji: { fontSize: 32 },
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
  unknownName: { color: '#BDBDBD' },
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
  hintChip: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  hintChipText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
