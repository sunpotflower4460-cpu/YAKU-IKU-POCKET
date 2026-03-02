// Must match RARITY_XP in useGameStore.ts
const RARITY_XP_DISPLAY: Record<number, number> = {
  1: 30, 2: 80, 3: 150, 4: 250, 5: 500,
};
const XP_RESCAN = 15;

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plant } from '../types';
import { Colors } from '../constants/colors';
import { RarityStars } from './RarityStars';
import { DangerBadge } from './DangerBadge';

// Gradient header color per rarity
const RARITY_GRADIENT: Record<number, [string, string, string]> = {
  1: ['#424242', '#757575', '#9E9E9E'],
  2: ['#1B5E20', '#2E7D32', '#43A047'],
  3: ['#0D47A1', '#1565C0', '#1976D2'],
  4: ['#4A148C', '#6A1B9A', '#8E24AA'],
  5: ['#BF360C', '#D84315', '#FF8F00'],
};

const RARITY_LABEL: Record<number, string> = {
  1: 'コモン',
  2: 'アンコモン',
  3: 'レア',
  4: 'スーパーレア',
  5: 'レジェンダリー',
};

interface Props {
  visible: boolean;
  plant: Plant | null;
  confidence: number;
  isNewDiscovery: boolean;
  usedRealAI: boolean;
  onAddToZukan: () => void;
  onScanAgain: () => void;
}

export function ScanResultModal({
  visible,
  plant,
  confidence,
  isNewDiscovery,
  usedRealAI,
  onAddToZukan,
  onScanAgain,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && plant) {
      // Card entrance
      const entry = Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      });
      entry.start();

      let shimmerLoop: Animated.CompositeAnimation | null = null;
      let sparkleLoop: Animated.CompositeAnimation | null = null;

      // Shimmer + sparkle for ★4/★5 new discoveries
      if (plant.rarity >= 4 && isNewDiscovery) {
        shimmerLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(shimmerAnim, { toValue: 0.6, duration: 700, useNativeDriver: true }),
          ])
        );
        shimmerLoop.start();

        sparkleLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(sparkleAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          ])
        );
        sparkleLoop.start();
      }

      return () => {
        entry.stop();
        shimmerLoop?.stop();
        sparkleLoop?.stop();
      };
    } else {
      scaleAnim.setValue(0);
      shimmerAnim.setValue(0);
      sparkleAnim.setValue(0);
    }
  }, [visible, plant, isNewDiscovery]);

  if (!plant) return null;

  const isDangerous = plant.danger === 'RED';
  const isWarning = plant.danger === 'YELLOW';
  const isRare = plant.rarity >= 4;
  const isLegendary = plant.rarity === 5;
  const gradientColors = RARITY_GRADIENT[plant.rarity] ?? RARITY_GRADIENT[1];

  const emojiScale = shimmerAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [1, 1.14],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.28],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* ── Gradient header ── */}
          <LinearGradient colors={gradientColors} style={styles.gradientHeader}>

            {/* Sparkle overlay for rare discoveries */}
            {isRare && (
              <Animated.View
                style={[styles.sparkleOverlay, { opacity: sparkleOpacity }]}
                pointerEvents="none"
              />
            )}

            {/* New discovery / rarity label */}
            {isNewDiscovery && (
              <View style={[
                styles.newLabel,
                isLegendary && styles.newLabelLegendary,
                isRare && !isLegendary && styles.newLabelSuperRare,
              ]}>
                <Text style={styles.newLabelText}>
                  {isLegendary
                    ? '🏆 LEGENDARY FIND!'
                    : isRare
                    ? '⭐ SUPER RARE!'
                    : '✨ NEW DISCOVERY'}
                </Text>
              </View>
            )}

            {/* Emoji */}
            <Animated.View
              style={[
                styles.emojiContainer,
                isDangerous && styles.dangerEmojiContainer,
                isRare && { transform: [{ scale: emojiScale }] },
              ]}
            >
              <Text style={styles.emoji}>{plant.emoji}</Text>
            </Animated.View>

            {/* Names */}
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.plantNameEn}>{plant.nameEn}</Text>
            <Text style={styles.plantNameLatin}>{plant.nameLatin}</Text>

            {/* Rarity */}
            <View style={styles.headerBadgeRow}>
              <View style={styles.rarityLabelBadge}>
                <Text style={styles.rarityLabelText}>{RARITY_LABEL[plant.rarity]}</Text>
              </View>
              <RarityStars rarity={plant.rarity} size="lg" />
            </View>
          </LinearGradient>

          {/* ── Scrollable content ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Danger alerts */}
            {isDangerous && (
              <View style={styles.alertRed}>
                <Text style={styles.alertRedText}>
                  🚨 WARNING: 危険植物が検出されました！ 絶対に触れないでください！
                </Text>
              </View>
            )}
            {isWarning && (
              <View style={styles.alertYellow}>
                <Text style={styles.alertYellowText}>
                  ⚠️ 注意：この植物は扱い方に注意が必要です
                </Text>
              </View>
            )}

            {/* Danger badge */}
            <View style={styles.badgeRow}>
              <DangerBadge danger={plant.danger} />
            </View>

            {/* Confidence */}
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>AI認識精度</Text>
              <View style={styles.confidenceBar}>
                <View style={[styles.confidenceFill, { width: `${confidence}%` }]} />
              </View>
              <Text style={styles.confidenceValue}>{confidence}%</Text>
            </View>

            {/* AI Mode Badge */}
            <View style={[styles.aiBadge, usedRealAI ? styles.aiBadgeReal : styles.aiBadgeMock]}>
              <Text style={[styles.aiBadgeText, usedRealAI ? styles.aiBadgeTextReal : styles.aiBadgeTextMock]}>
                {usedRealAI ? '🤖 Claude AI' : '🎲 モックAI'}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>{plant.description}</Text>

            {/* Effects */}
            {plant.effects.length > 0 && (
              <View style={styles.effectsContainer}>
                <Text style={styles.sectionTitle}>💊 養生効果</Text>
                <View style={styles.effectTags}>
                  {plant.effects.map((effect) => (
                    <View key={effect} style={styles.effectTag}>
                      <Text style={styles.effectText}>{effect}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Warning note */}
            {plant.warningNote && (
              <View style={[styles.warningBox, isDangerous && styles.warningBoxRed]}>
                <Text style={[styles.warningText, isDangerous && styles.warningTextRed]}>
                  {plant.warningNote}
                </Text>
              </View>
            )}

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              ⚠️ このアプリの判定は参考情報です。採取・摂取前には必ず専門家に確認してください。
            </Text>
          </ScrollView>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onScanAgain}>
              <Text style={styles.btnSecondaryText}>もう一度スキャン</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onAddToZukan}>
              <Text style={styles.btnPrimaryText}>
                📖 図鑑に登録{isNewDiscovery
                  ? ` +${RARITY_XP_DISPLAY[plant.rarity] ?? 100}XP`
                  : ` +${XP_RESCAN}XP`}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    width: '100%',
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },

  // ── Gradient header ──
  gradientHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sparkleOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#FFFFFF',
  },
  newLabel: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  newLabelSuperRare: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  newLabelLegendary: {
    backgroundColor: 'rgba(255,215,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.6)',
  },
  newLabelText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  emojiContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  dangerEmojiContainer: {
    backgroundColor: 'rgba(255,0,0,0.2)',
    borderColor: 'rgba(255,100,100,0.4)',
  },
  emoji: { fontSize: 54 },
  plantName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  plantNameEn: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 2,
  },
  plantNameLatin: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 10,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rarityLabelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rarityLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Content ──
  content: {
    padding: 18,
    alignItems: 'center',
  },
  alertRed: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  alertRedText: {
    color: Colors.dangerRed,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  alertYellow: {
    backgroundColor: Colors.dangerYellowBg,
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    width: '100%',
  },
  alertYellowText: {
    color: Colors.dangerYellow,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 14,
    justifyContent: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  confidenceLabel: { fontSize: 11, color: Colors.textMuted, width: 60 },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    width: 36,
  },
  aiBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
    borderWidth: 1,
  },
  aiBadgeReal: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primaryLight,
  },
  aiBadgeMock: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  aiBadgeText: { fontSize: 11, fontWeight: '700' },
  aiBadgeTextReal: { color: Colors.primaryDark },
  aiBadgeTextMock: { color: Colors.textMuted },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
  },
  effectsContainer: { width: '100%', marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  effectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  effectTag: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  effectText: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600' },
  warningBox: {
    backgroundColor: Colors.dangerYellowBg,
    borderColor: '#FFD54F',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: '100%',
  },
  warningBoxRed: {
    backgroundColor: Colors.dangerRedBg,
    borderColor: '#EF9A9A',
  },
  warningText: {
    fontSize: 11,
    color: Colors.dangerYellow,
    lineHeight: 17,
  },
  warningTextRed: {
    color: Colors.dangerRed,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
  },

  // ── Actions ──
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: { backgroundColor: Colors.primaryPale },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  btnSecondaryText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 13 },
});
