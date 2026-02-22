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
import { Plant } from '../types';
import { Colors } from '../constants/colors';
import { RarityStars } from './RarityStars';
import { DangerBadge } from './DangerBadge';

interface Props {
  visible: boolean;
  plant: Plant | null;
  confidence: number;
  isNewDiscovery: boolean;
  onAddToZukan: () => void;
  onScanAgain: () => void;
}

export function ScanResultModal({
  visible,
  plant,
  confidence,
  isNewDiscovery,
  onAddToZukan,
  onScanAgain,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [visible]);

  if (!plant) return null;

  const isDangerous = plant.danger === 'RED';
  const isWarning = plant.danger === 'YELLOW';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
        >
          {/* Header */}
          {isNewDiscovery && (
            <View style={styles.newBanner}>
              <Text style={styles.newBannerText}>✨ 新発見！ NEW DISCOVERY ✨</Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Danger alert */}
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

            {/* Plant emoji */}
            <Animated.View
              style={[
                styles.emojiContainer,
                isDangerous && styles.dangerEmojiContainer,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ]}
            >
              <Text style={styles.emoji}>{plant.emoji}</Text>
            </Animated.View>

            {/* Name */}
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.plantNameEn}>{plant.nameEn}</Text>
            <Text style={styles.plantNameLatin}>{plant.nameLatin}</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              <RarityStars rarity={plant.rarity} size="lg" />
              <DangerBadge danger={plant.danger} />
            </View>

            {/* Confidence */}
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>AI認識精度</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${confidence}%` },
                  ]}
                />
              </View>
              <Text style={styles.confidenceValue}>{confidence}%</Text>
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
              <View
                style={[
                  styles.warningBox,
                  isDangerous && styles.warningBoxRed,
                ]}
              >
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

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={onScanAgain}
            >
              <Text style={styles.btnSecondaryText}>もう一度スキャン</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={onAddToZukan}
            >
              <Text style={styles.btnPrimaryText}>
                📖 図鑑に登録{isNewDiscovery ? ' +100XP' : ' +10XP'}
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
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  newBanner: {
    backgroundColor: Colors.rarity5,
    paddingVertical: 10,
    alignItems: 'center',
  },
  newBannerText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  content: {
    padding: 20,
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
    fontSize: 13,
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
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerEmojiContainer: {
    backgroundColor: '#FFEBEE',
  },
  emoji: {
    fontSize: 56,
  },
  plantName: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  plantNameEn: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  plantNameLatin: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    width: '100%',
  },
  confidenceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    width: 60,
  },
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
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
  },
  effectsContainer: {
    width: '100%',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  effectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  effectTag: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  effectText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
  },
  btnSecondary: {
    backgroundColor: Colors.primaryPale,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  btnSecondaryText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
});
