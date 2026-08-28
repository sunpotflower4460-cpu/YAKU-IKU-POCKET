import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { Plant } from '../types';
import { RarityStars } from './RarityStars';
import { DangerBadge, DANGER_LABEL } from './DangerBadge';
import { useTheme } from '../theme/ThemeProvider';
import { useReduceMotion } from '../utils/reduceMotion';

interface Props {
  plant: Plant;
  discovered: boolean;
  imageUri?: string;
  isFavorite?: boolean;
  hasNote?: boolean;
  /** Family name shown on undiscovered cards as a non-spoiler learning hint (§7.6). */
  familyHint?: string;
  onPress: () => void;
  onFavorite?: () => void;
}

const RARITY_BG_LIGHT: Record<number, string> = {
  1: '#F5F5F5',
  2: '#F1F8E9',
  3: '#E3F2FD',
  4: '#F3E5F5',
  5: '#FFF8E1',
};

export function PlantCard({ plant, discovered, imageUri, isFavorite, hasNote, familyHint, onPress, onFavorite }: Props) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imgError, setImgError] = useState(false);

  const rarityColor = [
    theme.colors.rarityCommon,
    theme.colors.rarityUncommon,
    theme.colors.rarityRare,
    theme.colors.rarityEpic,
    theme.colors.rarityLegendary,
  ][Math.max(0, Math.min(4, plant.rarity - 1))];
  const rarityBg = theme.mode === 'dark'
    ? `${rarityColor}24`
    : (RARITY_BG_LIGHT[plant.rarity] ?? theme.colors.surfaceSecondary);

  const isLegendary = plant.rarity === 5;
  const isSuperRare = plant.rarity === 4;
  const showPhoto = discovered && !!imageUri && !imgError;

  function handlePressIn() {
    if (reduceMotion) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      tension: 320,
      friction: 22,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    if (reduceMotion) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 260,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const accessibilityLabel = discovered
    ? `${plant.name}。レアリティ${plant.rarity}。${DANGER_LABEL[plant.danger]}${isFavorite ? '。お気に入り' : ''}${hasNote ? '。メモあり' : ''}`
    : `未発見の植物。${familyHint ? `ヒントは${familyHint}。` : ''}レアリティ${plant.rarity}`;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          borderRadius: theme.radius.card,
          shadowColor: theme.colors.shadow,
          shadowOpacity: theme.mode === 'dark' ? 0.22 : (isLegendary || isSuperRare) && discovered ? 0.16 : 0.08,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfacePrimary,
            borderColor: plant.danger === 'RED' && discovered
              ? theme.colors.statusDanger
              : theme.colors.borderSubtle,
          },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="詳細を見る"
      >
        <View style={[styles.rarityStrip, { backgroundColor: rarityColor }]} />

        {(isLegendary || isSuperRare) && discovered && (
          <View style={[styles.rarityGlow, { backgroundColor: `${rarityColor}12` }]} />
        )}

        <View
          style={[
            styles.emojiWrap,
            { backgroundColor: discovered ? rarityBg : theme.colors.surfaceSecondary },
          ]}
        >
          {showPhoto ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.plantPhoto}
              resizeMode="cover"
              onError={() => setImgError(true)}
              accessibilityIgnoresInvertColors
            />
          ) : discovered ? (
            <Text style={styles.emoji}>{plant.emoji}</Text>
          ) : (
            <Text style={[styles.questionMark, { color: theme.colors.textTertiary }]}>？</Text>
          )}
        </View>

        <Text
          style={[
            styles.name,
            { color: discovered ? theme.colors.textPrimary : theme.colors.textTertiary },
          ]}
          numberOfLines={2}
        >
          {discovered ? plant.name : '？？？'}
        </Text>

        <RarityStars rarity={plant.rarity} size="sm" />

        {discovered && <DangerBadge danger={plant.danger} size="sm" />}

        {!discovered && (
          <View
            style={[
              styles.hintChip,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
          >
            <Text style={[styles.hintChipText, { color: theme.colors.accentSecondary }]} numberOfLines={1}>
              {familyHint ?? 'ヒント'}
            </Text>
          </View>
        )}

        {discovered && (
          <View style={[styles.checkBadge, { backgroundColor: rarityColor }]} accessibilityElementsHidden>
            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
          </View>
        )}

        {discovered && hasNote && (
          <View
            style={[styles.noteBadge, { backgroundColor: theme.colors.surfaceSecondary }]}
            accessibilityElementsHidden
          >
            <Ionicons name="create-outline" size={13} color={theme.colors.accentPrimary} />
          </View>
        )}

        {discovered && onFavorite && (
          <Pressable
            style={({ pressed }) => [
              styles.heartBtn,
              { backgroundColor: theme.colors.surfaceSecondary },
              pressed && styles.heartBtnPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onFavorite();
            }}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
            accessibilityState={{ selected: !!isFavorite }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#D9363E' : theme.colors.textTertiary}
            />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingBottom: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 5,
    minHeight: 170,
  },
  rarityStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
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
    overflow: 'hidden',
  },
  plantPhoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  emoji: { fontSize: 32 },
  questionMark: {
    fontSize: 26,
    fontWeight: '800',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 17,
    minHeight: 34,
    paddingHorizontal: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartBtnPressed: {
    opacity: 0.68,
  },
  noteBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintChip: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hintChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
