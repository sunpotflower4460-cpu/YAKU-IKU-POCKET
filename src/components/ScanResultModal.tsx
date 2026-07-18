import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RARITY_XP, XP_PER_RESCAN } from '../store/useGameStore';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  ScrollView,
  Image,
  Platform,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '../types';
import { IdentificationCandidate } from '../types/observation';
import { Colors } from '../constants/colors';
import { RarityStars } from './RarityStars';
import { DangerBadge, DANGER_LABEL } from './DangerBadge';
import { SafetyBanner } from './SafetyBanner';
import { getSafetyWarnings } from '../data/safety';
import { assessCandidateSafety } from '../utils/candidateSafety';
import { useReduceMotion } from '../utils/reduceMotion';
import { buildTraitChecklist } from '../utils/traitChecklist';
import { TraitCheck, TraitCheckState, summarizeTraitChecks } from '../types/traitCheck';
import { FEATURE_FLAGS } from '../constants/featureFlags';
import * as Haptics from '../utils/haptics';

// Gradient header color per rarity
const RARITY_GRADIENT: Record<number, [string, string, string]> = {
  1: ['#424242', '#757575', '#9E9E9E'],
  2: ['#1B5E20', '#2E7D32', '#43A047'],
  3: ['#0D47A1', '#1565C0', '#1976D2'],
  4: ['#4A148C', '#6A1B9A', '#8E24AA'],
  5: ['#BF360C', '#D84315', '#FF8F00'],
};

// Semi-transparent variant (when user photo is shown as bg)
const RARITY_GRADIENT_ALPHA: Record<number, [string, string, string]> = {
  1: ['#424242CC', '#757575BB', '#9E9E9EAA'],
  2: ['#1B5E20CC', '#2E7D32BB', '#43A047AA'],
  3: ['#0D47A1CC', '#1565C0BB', '#1976D2AA'],
  4: ['#4A148CCC', '#6A1B9ABB', '#8E24AAAA'],
  5: ['#BF360CCC', '#D84315BB', '#FF8F00AA'],
};

const RARITY_LABEL: Record<number, string> = {
  1: 'コモン',
  2: 'アンコモン',
  3: 'レア',
  4: 'スーパーレア',
  5: 'レジェンダリー',
};

const TRAIT_STATE_COLOR: Record<TraitCheckState, string> = {
  match: Colors.dangerGreen,
  mismatch: Colors.dangerRed,
  unknown: '#9E9E9E',
};

interface Props {
  visible: boolean;
  plant: Plant | null;
  confidence: number;
  isNewDiscovery: boolean;
  usedRealAI: boolean;
  /** Demo (mock) mode: result is view-only — no save, no XP, no registration. */
  isDemo?: boolean;
  reason?: string;
  /**
   * Ranked candidates from real AI (§7.5). Undefined/length<=1 keeps the
   * classic single-result view — demo mode has no real ranking to compare,
   * so it never populates this (see docs/IDENTIFICATION_PIPELINE.md).
   */
  candidates?: IdentificationCandidate[];
  /** Which candidate's plant is currently selected for saving. */
  selectedPlantId?: string;
  onSelectCandidate?: (candidate: IdentificationCandidate) => void;
  imageUri?: string;
  /** Receives the user's completed 現物確認 checklist (empty if unused/skipped). */
  onAddToZukan: (traitChecks: TraitCheck[]) => void;
  onScanAgain: () => void;
}

export function ScanResultModal({
  visible,
  plant,
  confidence,
  isNewDiscovery,
  usedRealAI,
  isDemo = false,
  reason,
  candidates,
  selectedPlantId,
  onSelectCandidate,
  imageUri,
  onAddToZukan,
  onScanAgain,
}: Props) {
  const showCompare = !!candidates && candidates.length > 1;
  const candidateSafety = candidates ? assessCandidateSafety(candidates) : null;
  const reduceMotion = useReduceMotion();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // ── 現物確認チェックリスト（v3 §7.3, PR18） ──────────────────────────
  // Real-AI results only: comparing traits against a demo (random) result
  // would be comparing the specimen against a guess with no basis.
  const [traitStates, setTraitStates] = useState<Record<string, TraitCheckState>>({});
  const traitItems = useMemo(
    () => (FEATURE_FLAGS.compareInField && plant && usedRealAI && !isDemo ? buildTraitChecklist(plant) : []),
    [plant, usedRealAI, isDemo]
  );
  // Reset the checklist whenever the selected candidate changes — a trait
  // check is only meaningful against the specimen *and* the plant it's being
  // checked against.
  useEffect(() => {
    setTraitStates({});
  }, [plant?.id]);
  const traitChecks: TraitCheck[] = traitItems.map((item) => ({
    traitId: item.id,
    state: traitStates[item.id] ?? 'unknown',
  }));
  const traitSummary = summarizeTraitChecks(traitChecks);

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

      // Shimmer + sparkle for ★4/★5 new discoveries (skipped under Reduce Motion)
      if (plant.rarity >= 4 && isNewDiscovery && !reduceMotion) {
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
  }, [visible, plant, isNewDiscovery, reduceMotion]);

  if (!plant) return null;

  async function handleShareDiscovery() {
    if (!plant) return;
    const rarityStars = '★'.repeat(plant.rarity) + '☆'.repeat(5 - plant.rarity);
    const dangerLabel = DANGER_LABEL[plant.danger];
    const msg =
      `植物を観察しました\n\n` +
      `${plant.emoji} ${plant.name} (${plant.nameEn})\n` +
      `レアリティ: ${rarityStars}\n` +
      `分類: ${dangerLabel}\n\n` +
      `薬育ポケットで野草・ハーブを観察中！\n` +
      `※採取・摂取は必ず専門家にご確認ください。\n` +
      `#薬育ポケット #植物観察 #${plant.name}`;
    try {
      await Share.share({ message: msg });
    } catch { /* ignore */ }
  }

  const isDangerous = plant.danger === 'RED';
  const isWarning = plant.danger === 'YELLOW';
  const isRare = plant.rarity >= 4;
  const isLegendary = plant.rarity === 5;
  const gradientColors = imageUri
    ? (RARITY_GRADIENT_ALPHA[plant.rarity] ?? RARITY_GRADIENT_ALPHA[1])
    : (RARITY_GRADIENT[plant.rarity] ?? RARITY_GRADIENT[1]);

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
      onRequestClose={onScanAgain}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* ── Gradient header ── */}
          <View style={styles.gradientHeader}>
            {/* Blurred photo background (user's captured image) */}
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                blurRadius={Platform.OS === 'ios' ? 8 : 3}
              />
            )}

            {/* Color gradient overlay */}
            <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

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
                    ? 'LEGENDARY FIND!'
                    : isRare
                    ? 'SUPER RARE!'
                    : 'NEW DISCOVERY'}
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

            {/* Photo label */}
            {imageUri && (
              <View style={styles.photoLabel}>
                <Ionicons name="camera-outline" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.photoLabelText}>あなたの撮影写真</Text>
              </View>
            )}
          </View>

          {/* ── Scrollable content ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* ── Candidate compare (§7.5) — shown only when real AI returned
                more than one plausible match. Never asserts a single answer. */}
            {showCompare && candidates && (
              <View style={styles.compareContainer}>
                <Text style={styles.compareHeadline}>
                  候補を{candidates.length}件に絞りました
                </Text>
                <Text style={styles.compareSubtext}>
                  タップして候補を選び、内容を確認してください。
                </Text>

                {/* Safety block: shown regardless of which candidate ranks #1
                    (§7.5 "候補1位が安全側でも警告") */}
                {candidateSafety && (candidateSafety.hasDangerousCandidate || candidateSafety.hasLookalikeRisk) && (
                  <View style={styles.compareSafetyBlock}>
                    <Ionicons name="warning" size={14} color={Colors.dangerRed} />
                    <Text style={styles.compareSafetyText}>
                      候補の中に危険植物、または有毒な類似種が含まれます。この観察結果を採取・摂取の判断に使用しないでください。
                    </Text>
                  </View>
                )}

                <View style={styles.candidateList}>
                  {candidates.map((c) => {
                    const selected = c.plant.id === selectedPlantId;
                    return (
                      <Pressable
                        key={c.plant.id}
                        style={[styles.candidateCard, selected && styles.candidateCardSelected]}
                        onPress={() => onSelectCandidate?.(c)}
                        accessibilityRole="button"
                        accessibilityLabel={`候補${c.score.overallRank}: ${c.plant.name}、候補一致度${c.score.visionScore ?? '不明'}${selected ? '、選択中' : ''}`}
                      >
                        <Text style={styles.candidateEmoji}>{c.plant.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <View style={styles.candidateNameRow}>
                            <Text style={styles.candidateRank}>候補{c.score.overallRank}</Text>
                            <Text style={styles.candidateName}>{c.plant.name}</Text>
                          </View>
                          <Text style={styles.candidateLatin}>{c.plant.nameLatin}</Text>
                          <View style={styles.candidateMetaRow}>
                            <DangerBadge danger={c.plant.danger} size="sm" />
                            {c.score.visionScore !== undefined && (
                              <Text style={styles.candidateScore}>一致度 {c.score.visionScore}%</Text>
                            )}
                            {c.score.seasonScore === 1 && (
                              <View style={styles.candidateSeasonChip}>
                                <Ionicons name="leaf-outline" size={10} color={Colors.primaryDark} />
                                <Text style={styles.candidateSeasonChipText}>季節適合</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {selected && (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.primaryDark} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.compareBelowNote}>
                  選択中の候補「{plant.name}」の詳細を以下に表示しています。
                </Text>
              </View>
            )}

            {/* ── 現物確認チェックリスト（v3 §7.1/§7.3, PR18） ── */}
            {traitItems.length > 0 && (
              <View style={styles.traitCheckContainer}>
                <Text style={styles.traitCheckHeadline}>目の前の植物と見比べる</Text>
                <Text style={styles.traitCheckSubtext}>
                  AIの候補を受け取って終わりにせず、実際の特徴と一つずつ照合してください。
                </Text>
                <View style={styles.traitCheckSummaryRow}>
                  <Text style={styles.traitCheckSummaryText}>
                    一致 {traitSummary.match}　不一致 {traitSummary.mismatch}　未確認 {traitSummary.unknown}
                  </Text>
                </View>
                {traitItems.map((item) => {
                  const state = traitStates[item.id] ?? 'unknown';
                  return (
                    <View key={item.id} style={styles.traitItemCard}>
                      <Text style={styles.traitItemLabel}>{item.label}</Text>
                      <Text style={styles.traitItemHint}>{item.referenceHint}</Text>
                      <View style={styles.traitItemBtnRow}>
                        {(
                          [
                            { key: 'match', label: '一致' },
                            { key: 'mismatch', label: '違う' },
                            { key: 'unknown', label: '分からない' },
                          ] as { key: TraitCheckState; label: string }[]
                        ).map((opt) => (
                          <Pressable
                            key={opt.key}
                            style={[
                              styles.traitItemBtn,
                              state === opt.key && {
                                backgroundColor: TRAIT_STATE_COLOR[opt.key],
                                borderColor: TRAIT_STATE_COLOR[opt.key],
                              },
                            ]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setTraitStates((prev) => ({ ...prev, [item.id]: opt.key }));
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`${item.label}: ${opt.label}${state === opt.key ? '（選択中）' : ''}`}
                          >
                            <Text
                              style={[
                                styles.traitItemBtnText,
                                state === opt.key && styles.traitItemBtnTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Danger alerts */}
            {isDangerous && (
              <View style={styles.alertRed}>
                <Ionicons name="skull-outline" size={14} color="#C62828" />
                <Text style={styles.alertRedText}>
                  WARNING: 危険植物が検出されました！ 絶対に触れないでください！
                </Text>
              </View>
            )}
            {isWarning && (
              <View style={styles.alertYellow}>
                <Ionicons name="warning-outline" size={14} color="#E65100" />
                <Text style={styles.alertYellowText}>
                  注意：この植物は扱い方に注意が必要です
                </Text>
              </View>
            )}

            {/* Dangerous look-alike warning (data-driven, never colour-only) */}
            <SafetyBanner warnings={getSafetyWarnings(plant.id)} />

            {/* Danger badge */}
            <View style={styles.badgeRow}>
              <DangerBadge danger={plant.danger} />
            </View>

            {/* Match score. Not a certainty — a candidate match, and in demo
                mode a random placeholder. Labelled honestly. */}
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>
                {usedRealAI ? '候補一致度' : '一致スコア（デモ）'}
              </Text>
              <View style={styles.confidenceBar}>
                <View style={[styles.confidenceFill, { width: `${confidence}%` }]} />
              </View>
              <Text style={styles.confidenceValue}>{confidence}%</Text>
            </View>

            {/* AI Mode Badge */}
            <View style={[styles.aiBadge, usedRealAI ? styles.aiBadgeReal : styles.aiBadgeMock]}>
              <Ionicons name={usedRealAI ? 'hardware-chip-outline' : 'dice-outline'} size={13} color={usedRealAI ? '#1565C0' : '#6D4C41'} />
              <Text style={[styles.aiBadgeText, usedRealAI ? styles.aiBadgeTextReal : styles.aiBadgeTextMock]}>
                {usedRealAI ? 'Claude AI' : 'デモ判定（ランダム）'}
              </Text>
            </View>

            {/* Demo-mode notice: not real recognition, and NOT recorded. */}
            {isDemo && (
              <View style={styles.fallbackNotice}>
                <Ionicons name="information-circle-outline" size={13} color="#B45309" />
                <Text style={styles.fallbackText}>
                  これはデモ表示です。写真の内容に関わらずランダムに候補を表示しており、
                  観察記録・図鑑・XPには反映されません。
                </Text>
              </View>
            )}

            {/* Claude AI reason */}
            {usedRealAI && reason && (
              <View style={styles.reasonBox}>
                <View style={styles.reasonTitleRow}>
                  <Ionicons name="flask-outline" size={13} color={Colors.primaryDark} />
                  <Text style={styles.reasonLabel}>AIの判断根拠</Text>
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            )}

            {/* Description */}
            <Text style={styles.description}>{plant.description}</Text>

            {/* Effects — framed as traditional lore, not medical advice */}
            {plant.effects.length > 0 && (
              <View style={styles.effectsContainer}>
                <View style={styles.effectsTitleRow}>
                  <Ionicons name="leaf-outline" size={14} color={Colors.text} />
                  <Text style={styles.sectionTitle}>伝統的な用途・言い伝え</Text>
                </View>
                <View style={styles.effectTags}>
                  {plant.effects.map((effect) => (
                    <View key={effect} style={styles.effectTag}>
                      <Text style={styles.effectText}>{effect}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.effectsCaveat}>
                  ※ 伝統的な言い伝えであり、効果・効能を保証するものではありません。
                </Text>
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
            <View style={styles.disclaimer}>
              <Ionicons name="warning-outline" size={13} color="#B45309" />
              <Text style={styles.disclaimerText}>
                このアプリの判定は参考情報です。採取・摂取前には必ず専門家に確認してください。
              </Text>
            </View>
          </ScrollView>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            {isDemo ? (
              /* Demo: view-only. No save / XP / registration. */
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onScanAgain}>
                <Text style={styles.btnPrimaryText}>閉じる（デモのため記録されません）</Text>
              </Pressable>
            ) : (
              <>
                {isNewDiscovery && (
                  <Pressable
                    style={[styles.btn, styles.btnShare]}
                    onPress={handleShareDiscovery}
                  >
                    <Ionicons name="leaf-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.btnShareText}>観察をシェア</Text>
                  </Pressable>
                )}
                <View style={styles.actionRow}>
                  <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onScanAgain}>
                    <Text style={styles.btnSecondaryText}>もう一度観察</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => onAddToZukan(traitChecks)}>
                    <Text style={styles.btnPrimaryText}>
                      観察記録として保存{isNewDiscovery
                        ? ` +${RARITY_XP[plant.rarity] ?? 100}XP`
                        : ` +${XP_PER_RESCAN}XP`}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
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
  photoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  photoLabelText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
  },

  // ── Content ──
  content: {
    padding: 18,
    alignItems: 'center',
  },
  alertRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  alertRedText: {
    flex: 1,
    color: Colors.dangerRed,
    fontWeight: '700',
    fontSize: 12,
  },
  alertYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dangerYellowBg,
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    width: '100%',
  },
  alertYellowText: {
    flex: 1,
    color: Colors.dangerYellow,
    fontWeight: '700',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 14,
    justifyContent: 'center',
  },

  // ── Candidate compare (§7.5) ──
  compareContainer: { width: '100%', marginBottom: 16 },
  compareHeadline: { fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  compareSubtext: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2, marginBottom: 12 },
  compareSafetyBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.dangerRedBg,
    borderColor: Colors.dangerRed,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  compareSafetyText: { flex: 1, fontSize: 12, lineHeight: 17, color: Colors.dangerRed, fontWeight: '700' },
  candidateList: { gap: 8 },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    padding: 10,
  },
  candidateCardSelected: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryPale,
  },
  candidateEmoji: { fontSize: 30 },
  candidateNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  candidateRank: { fontSize: 10, fontWeight: '800', color: Colors.textMuted },
  candidateName: { fontSize: 14, fontWeight: '800', color: Colors.text },
  candidateLatin: { fontSize: 11, fontStyle: 'italic', color: Colors.textMuted, marginTop: 1 },
  candidateMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  candidateScore: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  candidateSeasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryPale,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  candidateSeasonChipText: { fontSize: 10, fontWeight: '700', color: Colors.primaryDark },
  compareBelowNote: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 12 },
  traitCheckContainer: {
    width: '100%',
    backgroundColor: Colors.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  traitCheckHeadline: { fontSize: 15, fontWeight: '800', color: Colors.text },
  traitCheckSubtext: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, marginBottom: 10 },
  traitCheckSummaryRow: { marginBottom: 10 },
  traitCheckSummaryText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  traitItemCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  traitItemLabel: { fontSize: 13, fontWeight: '800', color: Colors.text },
  traitItemHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, marginBottom: 10, lineHeight: 17 },
  traitItemBtnRow: { flexDirection: 'row', gap: 8 },
  traitItemBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  traitItemBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  traitItemBtnTextActive: { color: '#FFFFFF' },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  reasonBox: {
    backgroundColor: Colors.primaryPale,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    width: '100%',
  },
  reasonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  reasonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: '100%',
  },
  fallbackText: {
    flex: 1,
    fontSize: 11,
    color: '#E65100',
    lineHeight: 16,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
  },
  effectsContainer: { width: '100%', marginBottom: 12 },
  effectsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  effectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  effectTag: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  effectText: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600' },
  effectsCaveat: { marginTop: 8, fontSize: 10, lineHeight: 14, color: Colors.textMuted },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    width: '100%',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 15,
  },

  // ── Actions ──
  actions: {
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: { backgroundColor: Colors.primaryPale },
  btnShare: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  btnSecondaryText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 13 },
  btnShareText: { color: Colors.primaryDark, fontWeight: '800', fontSize: 13 },
});
