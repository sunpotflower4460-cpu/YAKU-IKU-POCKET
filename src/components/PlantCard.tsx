import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image, useWindowDimensions } from 'react-native';
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
  /** Family name shown on undiscovered cards as a non-spoiler learning hint. */
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

export function PlantCard({
  plant,
  discovered,
  imageUri,
  isFavorite,
  hasNote,
  familyHint,
  onPress,
  onFavorite,
}: Props) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.4;
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
  const elevatedRareCard = discovered && (isLegendary || isSuperRare);
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
    ? `${plant.name}。珍しさの目安5段階中${plant.rarity}。${DANGER_LABEL[plant.danger]}${isFavorite ? '。お気に入り' : ''}${hasNote ? '。観察メモあり' : ''}`
    : `未記録の植物。${familyHint ? `ヒントは${familyHint}。` : ''}珍しさの目安5段階中${plant.rarity}`;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          borderRadius: theme.radius.card,
          shadowColor: theme.colors.shadow,
          shadowOpacity: elevatedRareCard ? (theme.mode === 'dark' ? 0.18 : 0.12) : 0,
          shadowRadius: elevatedRareCard ? 6 : 0,
          elevation: elevatedRareCard ? 2 : 0,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        style={[
          styles.card,
          largeText && styles.cardLargeText,
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
        accessibilityHint={discovered ? '詳細を見る' : '観察のヒントを見る'}
      >
        <View style={[styles.rarityStrip, { backgroundColor: rarityColor }]} />

        {elevatedRareCard && (
          <View style={[styles.rarityGlow, { backgroundColor: `${rarityColor}12` }]} />
        )}

        <View
          style={[
            styles.emojiWrap,
            { backgroundColor: discovered ? rarityBg : theme.colors.surfaceSecondary },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
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
            largeText && styles.nameLargeText,
            { color: discovered ? theme.colors.textPrimary : theme.colors.textTertiary },
          ]}
          numberOfLines={largeText ? undefined : 2}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {discovered ? plant.name : '？？？'}
        </Text>

        <RarityStars rarity={plant.rarity} size="sm" accessible={false} />
        {discovered && <DangerBadge danger={plant.danger} size="sm" accessible={false} />}

        {!discovered && (
          <View
            style={[
              styles.hintChip,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text
              style={[styles.hintChipText, { color: theme.colors.accentSecondary }]}
              numberOfLines={largeText ? 2 : 1}
            >
              {familyHint ?? 'ヒント'}
            </Text>
          </View>
        )}

        {discovered && hasNote && (
          <View
            style={[styles.noteBadge, { backgroundColor: theme.colors.surfaceSecondary }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Ionicons name="create-outline" size={13} color={theme.colors.accentPrimary} />
          </View>
        )}
      </Pressable>

      {discovered && onFavorite && (
        <Pressable
          style={({ pressed }) => [
            styles.heartBtn,
            { backgroundColor: theme.colors.surfaceSecondary },
            pressed && styles.heartBtnPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onFavorite();
          }}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? `${plant.name}をお気に入りから外す` : `${plant.name}をお気に入りに追加`}
          accessibilityState={{ selected: !!isFavorite }}
          accessibilityHint="カードを開かずにお気に入り状態を切り替えます"
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? '#D9363E' : theme.colors.textTertiary}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: 5,
    shadowOffset: { width: 0, height: 3 },
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
  cardLargeText: {
    minHeight: 200,
    paddingBottom: 16,
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
  nameLargeText: {
    minHeight: 51,
  },
  heartBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  heartBtnPressed: { opacity: 0.68 },
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
    maxWidth: '100%',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hintChipText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
