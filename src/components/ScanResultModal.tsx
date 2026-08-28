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
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '../types';
import { IdentificationCandidate } from '../types/observation';
import { RarityStars } from './RarityStars';
import { DangerBadge, DANGER_LABEL } from './DangerBadge';
import { SafetyBanner } from './SafetyBanner';
import { DisclaimerBanner } from './DisclaimerBanner';
import { getSafetyWarnings } from '../data/safety';
import { assessCandidateSafety } from '../utils/candidateSafety';
import { useReduceMotion } from '../utils/reduceMotion';
import { useTheme } from '../theme/ThemeProvider';
import { buildTraitChecklist } from '../utils/traitChecklist';
import { TraitCheck, TraitCheckState, summarizeTraitChecks } from '../types/traitCheck';
import { FEATURE_FLAGS } from '../constants/featureFlags';
import * as Haptics from '../utils/haptics';

const RARITY_GRADIENT: Record<number, [string, string, string]> = {
  1: ['#30343B', '#575D66', '#7D838B'],
  2: ['#174F2A', '#226B35', '#348447'],
  3: ['#103F73', '#155A91', '#2575AD'],
  4: ['#493064', '#684683', '#895DA5'],
  5: ['#7D4916', '#A96013', '#D58A27'],
};

const RARITY_GRADIENT_ALPHA: Record<number, [string, string, string]> = {
  1: ['#30343BDD', '#575D66CC', '#7D838BBB'],
  2: ['#174F2ADD', '#226B35CC', '#348447BB'],
  3: ['#103F73DD', '#155A91CC', '#2575ADBB'],
  4: ['#493064DD', '#684683CC', '#895DA5BB'],
  5: ['#7D4916DD', '#A96013CC', '#D58A27BB'],
};

const RARITY_LABEL: Record<number, string> = {
  1: 'よく見かける',
  2: '比較的見つけやすい',
  3: 'やや珍しい',
  4: '珍しい',
  5: 'とても珍しい',
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
  candidates?: IdentificationCandidate[];
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
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const stackActions = width < 380;
  const showCompare = !!candidates && candidates.length > 1;
  const candidateSafety = candidates ? assessCandidateSafety(candidates) : null;
  const reduceMotion = useReduceMotion();
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  const [traitStates, setTraitStates] = useState<Record<string, TraitCheckState>>({});
  const traitItems = useMemo(
    () => (FEATURE_FLAGS.compareInField && plant && usedRealAI && !isDemo ? buildTraitChecklist(plant) : []),
    [plant, usedRealAI, isDemo]
  );
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
      scaleAnim.setValue(reduceMotion ? 1 : 0.96);
      opacityAnim.setValue(1);

      let entry: Animated.CompositeAnimation | null = null;
      let shimmerLoop: Animated.CompositeAnimation | null = null;
      let sparkleLoop: Animated.CompositeAnimation | null = null;

      if (!reduceMotion) {
        entry = Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 70,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: theme.motion.stateChange,
            useNativeDriver: true,
          }),
        ]);
        entry.start();
      }

      if (plant.rarity >= 4 && isNewDiscovery && !reduceMotion) {
        shimmerLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(shimmerAnim, { toValue: 0.7, duration: 900, useNativeDriver: true }),
          ])
        );
        shimmerLoop.start();

        sparkleLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(sparkleAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
          ])
        );
        sparkleLoop.start();
      }

      return () => {
        entry?.stop();
        shimmerLoop?.stop();
        sparkleLoop?.stop();
      };
    }

    scaleAnim.setValue(0.96);
    opacityAnim.setValue(0);
    shimmerAnim.setValue(0);
    sparkleAnim.setValue(0);
  }, [visible, plant, isNewDiscovery, reduceMotion, scaleAnim, opacityAnim, shimmerAnim, sparkleAnim, theme.motion.stateChange]);

  if (!plant) return null;

  async function handleShareDiscovery() {
    if (!plant) return;
    const rarityStars = '★'.repeat(plant.rarity) + '☆'.repeat(5 - plant.rarity);
    const dangerLabel = DANGER_LABEL[plant.danger];
    const msg =
      `植物候補を観察しました\n\n` +
      `${plant.emoji} ${plant.name} (${plant.nameEn})\n` +
      `見つけやすさの目安: ${rarityStars}\n` +
      `注意区分: ${dangerLabel}\n\n` +
      `薬育ポケットのフィールドノートから\n` +
      `※AIの候補は参考情報です。採取・摂取はアプリだけで判断せず、専門家に確認してください。\n` +
      `#薬育ポケット #植物観察 #${plant.name}`;
    try {
      await Share.share({ message: msg });
    } catch { /* user cancellation */ }
  }

  const isDangerous = plant.danger === 'RED';
  const isWarning = plant.danger === 'YELLOW';
  const isRare = plant.rarity >= 4;
  const gradientColors = imageUri
    ? (RARITY_GRADIENT_ALPHA[plant.rarity] ?? RARITY_GRADIENT_ALPHA[1])
    : (RARITY_GRADIENT[plant.rarity] ?? RARITY_GRADIENT[1]);
  const safeConfidence = Math.max(0, Math.min(Number.isFinite(confidence) ? confidence : 0, 100));

  const emojiScale = shimmerAnim.interpolate({
    inputRange: [0.7, 1],
    outputRange: [1, 1.06],
  });
  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.14],
  });

  function traitStateColor(state: TraitCheckState) {
    if (state === 'match') return theme.colors.statusObserved;
    if (state === 'mismatch') return theme.colors.statusDanger;
    return theme.colors.textTertiary;
  }

  const discoveryLabel = plant.rarity === 5
    ? 'とても珍しい発見'
    : plant.rarity >= 4
      ? '珍しい発見'
      : '新しい発見';

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      statusBarTranslucent
      onRequestClose={onScanAgain}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onScanAgain}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfacePrimary,
              borderColor: theme.colors.borderSubtle,
              shadowColor: theme.colors.shadow,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.gradientHeader}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                blurRadius={Platform.OS === 'ios' ? 8 : 3}
                accessibilityIgnoresInvertColors
              />
            )}
            <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

            {isRare && (
              <Animated.View
                style={[styles.sparkleOverlay, { opacity: sparkleOpacity }]}
                pointerEvents="none"
              />
            )}

            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && styles.glassPressed]}
              onPress={onScanAgain}
              accessibilityRole="button"
              accessibilityLabel="観察結果を閉じる"
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>

            {isNewDiscovery && (
              <View style={styles.newLabel}>
                <Ionicons name="sparkles-outline" size={13} color="#FFFFFF" />
                <Text style={styles.newLabelText}>{discoveryLabel}</Text>
              </View>
            )}

            <Animated.View
              style={[
                styles.emojiContainer,
                isDangerous && styles.dangerEmojiContainer,
                isRare && { transform: [{ scale: emojiScale }] },
              ]}
              accessibilityElementsHidden
            >
              <Text style={styles.emoji}>{plant.emoji}</Text>
            </Animated.View>

            <Text style={styles.plantName} accessibilityRole="header">{plant.name}</Text>
            <Text style={styles.plantNameEn}>{plant.nameEn}</Text>
            <Text style={styles.plantNameLatin}>{plant.nameLatin}</Text>

            <View style={styles.headerBadgeRow}>
              <View style={styles.rarityLabelBadge}>
                <Text style={styles.rarityLabelText}>{RARITY_LABEL[plant.rarity]}</Text>
              </View>
              <View style={styles.headerStarsWrap}>
                <RarityStars rarity={plant.rarity} size="lg" />
              </View>
            </View>

            {imageUri && (
              <View style={styles.photoLabel}>
                <Ionicons name="camera-outline" size={12} color="rgba(255,255,255,0.88)" />
                <Text style={styles.photoLabelText}>撮影した写真を背景に表示中</Text>
              </View>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {showCompare && candidates && (
              <View style={styles.compareContainer}>
                <Text style={[styles.compareHeadline, { color: theme.colors.textPrimary }]}>候補が{candidates.length}件あります</Text>
                <Text style={[styles.compareSubtext, { color: theme.colors.textSecondary }]}>見た目・季節・安全情報を見比べて、記録する候補を選んでください。</Text>

                {candidateSafety && (candidateSafety.hasDangerousCandidate || candidateSafety.hasLookalikeRisk) && (
                  <View
                    style={[
                      styles.compareSafetyBlock,
                      { backgroundColor: `${theme.colors.statusDanger}10`, borderColor: `${theme.colors.statusDanger}55` },
                    ]}
                    accessibilityRole="alert"
                  >
                    <Ionicons name="warning" size={17} color={theme.colors.statusDanger} />
                    <Text style={[styles.compareSafetyText, { color: theme.colors.statusDanger }]}>
                      候補の中に危険植物、または有毒な類似種があります。採取・摂取の判断には使用しないでください。
                    </Text>
                  </View>
                )}

                <View style={styles.candidateList}>
                  {candidates.map((candidate) => {
                    const selected = candidate.plant.id === selectedPlantId;
                    return (
                      <Pressable
                        key={candidate.plant.id}
                        style={({ pressed }) => [
                          styles.candidateCard,
                          {
                            backgroundColor: selected ? theme.colors.surfaceSecondary : theme.colors.surfacePrimary,
                            borderColor: selected ? theme.colors.accentPrimary : theme.colors.borderSubtle,
                          },
                          pressed && styles.cardPressed,
                        ]}
                        onPress={() => onSelectCandidate?.(candidate)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`候補${candidate.score.overallRank}: ${candidate.plant.name}、画像との一致度${candidate.score.visionScore ?? '不明'}${selected ? '、選択中' : ''}`}
                      >
                        <View style={[styles.candidateEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
                          <Text style={styles.candidateEmoji}>{candidate.plant.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.candidateNameRow}>
                            <Text style={[styles.candidateRank, { color: theme.colors.textTertiary }]}>候補{candidate.score.overallRank}</Text>
                            <Text style={[styles.candidateName, { color: theme.colors.textPrimary }]}>{candidate.plant.name}</Text>
                          </View>
                          <Text style={[styles.candidateLatin, { color: theme.colors.textTertiary }]}>{candidate.plant.nameLatin}</Text>
                          <View style={styles.candidateMetaRow}>
                            <DangerBadge danger={candidate.plant.danger} size="sm" />
                            {candidate.score.visionScore !== undefined && (
                              <Text style={[styles.candidateScore, { color: theme.colors.textSecondary }]}>画像一致 {candidate.score.visionScore}%</Text>
                            )}
                            {candidate.score.seasonScore === 1 && (
                              <View style={[styles.candidateSeasonChip, { backgroundColor: theme.colors.surfaceSecondary }]}>
                                <Ionicons name="leaf-outline" size={11} color={theme.colors.accentPrimary} />
                                <Text style={[styles.candidateSeasonChipText, { color: theme.colors.accentPrimary }]}>季節が合う</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={selected ? theme.colors.accentPrimary : theme.colors.textTertiary}
                        />
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.compareBelowNote, { color: theme.colors.textTertiary }]}>現在は「{plant.name}」の情報を表示しています。</Text>
              </View>
            )}

            {traitItems.length > 0 && (
              <View
                style={[
                  styles.traitCheckContainer,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
                ]}
              >
                <Text style={[styles.traitCheckHeadline, { color: theme.colors.textPrimary }]}>目の前の植物と見比べる</Text>
                <Text style={[styles.traitCheckSubtext, { color: theme.colors.textSecondary }]}>AIの候補をそのまま正解とせず、実物の特徴を一つずつ照合してください。</Text>
                <Text style={[styles.traitCheckSummaryText, { color: theme.colors.textSecondary }]} accessibilityLiveRegion="polite">
                  一致 {traitSummary.match}　不一致 {traitSummary.mismatch}　未確認 {traitSummary.unknown}
                </Text>
                {traitItems.map((item) => {
                  const state = traitStates[item.id] ?? 'unknown';
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.traitItemCard,
                        { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle },
                      ]}
                    >
                      <Text style={[styles.traitItemLabel, { color: theme.colors.textPrimary }]}>{item.label}</Text>
                      <Text style={[styles.traitItemHint, { color: theme.colors.textSecondary }]}>{item.referenceHint}</Text>
                      <View style={styles.traitItemBtnRow}>
                        {(
                          [
                            { key: 'match', label: '一致' },
                            { key: 'mismatch', label: '違う' },
                            { key: 'unknown', label: '分からない' },
                          ] as { key: TraitCheckState; label: string }[]
                        ).map((option) => {
                          const selected = state === option.key;
                          return (
                            <Pressable
                              key={option.key}
                              style={({ pressed }) => [
                                styles.traitItemBtn,
                                {
                                  backgroundColor: selected ? traitStateColor(option.key) : theme.colors.surfaceSecondary,
                                  borderColor: selected ? traitStateColor(option.key) : theme.colors.borderSubtle,
                                },
                                pressed && styles.cardPressed,
                              ]}
                              onPress={() => {
                                Haptics.selectionAsync();
                                setTraitStates((prev) => ({ ...prev, [item.id]: option.key }));
                              }}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                              accessibilityLabel={`${item.label}: ${option.label}`}
                            >
                              <Text style={[styles.traitItemBtnText, { color: selected ? '#FFFFFF' : theme.colors.textSecondary }]}>{option.label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {isDangerous && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: `${theme.colors.statusDanger}10`, borderColor: `${theme.colors.statusDanger}55` },
                ]}
                accessibilityRole="alert"
              >
                <Ionicons name="skull-outline" size={18} color={theme.colors.statusDanger} />
                <Text style={[styles.alertText, { color: theme.colors.statusDanger }]}>
                  危険・有毒として登録されている植物候補です。採取・摂取せず、専門家に確認してください。
                </Text>
              </View>
            )}
            {isWarning && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: `${theme.colors.statusCaution}10`, borderColor: `${theme.colors.statusCaution}55` },
                ]}
              >
                <Ionicons name="warning-outline" size={18} color={theme.colors.statusCaution} />
                <Text style={[styles.alertText, { color: theme.colors.statusCaution }]}>扱いに注意が必要な植物候補です。利用前に必ず安全情報を確認してください。</Text>
              </View>
            )}

            <SafetyBanner warnings={getSafetyWarnings(plant.id)} />

            <View style={styles.badgeRow}>
              <DangerBadge danger={plant.danger} />
            </View>

            <View
              style={styles.confidenceContainer}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${usedRealAI ? '画像との候補一致度' : 'デモ一致スコア'} ${Math.round(safeConfidence)}パーセント`}
            >
              <Text style={[styles.confidenceLabel, { color: theme.colors.textTertiary }]}>{usedRealAI ? '画像一致' : 'デモ値'}</Text>
              <View style={[styles.confidenceBar, { backgroundColor: theme.colors.surfaceTertiary }]} accessibilityElementsHidden>
                <View style={[styles.confidenceFill, { width: `${safeConfidence}%`, backgroundColor: theme.colors.accentPrimary }]} />
              </View>
              <Text style={[styles.confidenceValue, { color: theme.colors.accentPrimary }]}>{Math.round(safeConfidence)}%</Text>
            </View>

            <View
              style={[
                styles.aiBadge,
                { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
              ]}
            >
              <Ionicons name={usedRealAI ? 'hardware-chip-outline' : 'flask-outline'} size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.aiBadgeText, { color: theme.colors.textSecondary }]}>{usedRealAI ? 'AI解析による候補' : 'デモ候補'}</Text>
            </View>

            {isDemo && (
              <View
                style={[
                  styles.fallbackNotice,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
                ]}
              >
                <Ionicons name="information-circle-outline" size={16} color={theme.colors.statusCaution} />
                <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
                  デモ表示です。写真の内容とは関係なく候補を表示し、観察記録・図鑑・XPには反映しません。
                </Text>
              </View>
            )}

            {usedRealAI && reason && (
              <View
                style={[
                  styles.reasonBox,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
                ]}
              >
                <View style={styles.reasonTitleRow}>
                  <Ionicons name="search-outline" size={14} color={theme.colors.accentPrimary} />
                  <Text style={[styles.reasonLabel, { color: theme.colors.textPrimary }]}>候補にした理由</Text>
                </View>
                <Text style={[styles.reasonText, { color: theme.colors.textSecondary }]}>{reason}</Text>
              </View>
            )}

            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{plant.description}</Text>

            {plant.effects.length > 0 && (
              <View style={styles.effectsContainer}>
                <View style={styles.effectsTitleRow}>
                  <Ionicons name="leaf-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>伝統的な用途・言い伝え</Text>
                </View>
                <View style={styles.effectTags}>
                  {plant.effects.map((effect) => (
                    <View
                      key={effect}
                      style={[
                        styles.effectTag,
                        { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
                      ]}
                    >
                      <Text style={[styles.effectText, { color: theme.colors.textSecondary }]}>{effect}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.effectsCaveat, { color: theme.colors.textTertiary }]}>伝統的な記録・言い伝えであり、効果・効能を保証する情報ではありません。</Text>
              </View>
            )}

            {plant.warningNote && (
              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: `${isDangerous ? theme.colors.statusDanger : theme.colors.statusCaution}0D`,
                    borderColor: `${isDangerous ? theme.colors.statusDanger : theme.colors.statusCaution}44`,
                  },
                ]}
              >
                <Text style={[styles.warningText, { color: isDangerous ? theme.colors.statusDanger : theme.colors.statusCaution }]}>{plant.warningNote}</Text>
              </View>
            )}

            <View style={styles.disclaimerWrap}>
              <DisclaimerBanner compact />
            </View>
          </ScrollView>

          <View style={[styles.actions, { borderTopColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfacePrimary }]}>
            {isDemo ? (
              <Pressable
                style={({ pressed }) => [styles.btn, { backgroundColor: theme.colors.accentPrimary }, pressed && styles.buttonPressed]}
                onPress={onScanAgain}
                accessibilityRole="button"
                accessibilityLabel="デモ結果を閉じる"
              >
                <Text style={[styles.btnPrimaryText, { color: theme.colors.textOnAccent }]}>閉じる</Text>
              </Pressable>
            ) : (
              <>
                {isNewDiscovery && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      styles.btnShare,
                      { borderColor: theme.colors.borderStrong },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleShareDiscovery}
                    accessibilityRole="button"
                    accessibilityLabel={`${plant.name}の観察をシェア`}
                  >
                    <Ionicons name="share-outline" size={18} color={theme.colors.accentPrimary} />
                    <Text style={[styles.btnShareText, { color: theme.colors.accentPrimary }]}>観察をシェア</Text>
                  </Pressable>
                )}
                <View style={[styles.actionRow, stackActions && styles.actionRowStacked]}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: theme.colors.surfaceSecondary },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={onScanAgain}
                    accessibilityRole="button"
                    accessibilityLabel="もう一度観察する"
                  >
                    <Text style={[styles.btnSecondaryText, { color: theme.colors.textSecondary }]}>もう一度</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: theme.colors.accentPrimary },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => onAddToZukan(traitChecks)}
                    accessibilityRole="button"
                    accessibilityLabel={`観察記録として保存${isNewDiscovery ? `、${RARITY_XP[plant.rarity] ?? 100}XP獲得` : `、${XP_PER_RESCAN}XP獲得`}`}
                  >
                    <Ionicons name="bookmark-outline" size={18} color={theme.colors.textOnAccent} />
                    <Text style={[styles.btnPrimaryText, { color: theme.colors.textOnAccent }]} numberOfLines={2}>
                      記録に保存{isNewDiscovery
                        ? `  +${RARITY_XP[plant.rarity] ?? 100}XP`
                        : `  +${XP_PER_RESCAN}XP`}
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
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: 520,
    maxHeight: '94%',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 18,
  },
  gradientHeader: { paddingTop: 18, paddingBottom: 18, paddingHorizontal: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  sparkleOverlay: { position: 'absolute', inset: 0, backgroundColor: '#FFFFFF' },
  closeBtn: { position: 'absolute', top: 10, right: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.24)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  glassPressed: { backgroundColor: 'rgba(0,0,0,0.38)' },
  newLabel: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 999, paddingHorizontal: 12, marginBottom: 9 },
  newLabelText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, lineHeight: 16 },
  emojiContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 9, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.26)' },
  dangerEmojiContainer: { backgroundColor: 'rgba(120,0,0,0.20)', borderColor: 'rgba(255,255,255,0.32)' },
  emoji: { fontSize: 50 },
  plantName: { fontSize: 24, lineHeight: 31, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.22)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  plantNameEn: { fontSize: 14, lineHeight: 19, color: 'rgba(255,255,255,0.86)', fontWeight: '600', marginTop: 1 },
  plantNameLatin: { fontSize: 11, lineHeight: 15, color: 'rgba(255,255,255,0.66)', fontStyle: 'italic', marginTop: 1, marginBottom: 9 },
  headerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  rarityLabelBadge: { backgroundColor: 'rgba(0,0,0,0.20)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  rarityLabelText: { color: '#FFFFFF', fontSize: 11, lineHeight: 14, fontWeight: '800' },
  headerStarsWrap: { backgroundColor: 'rgba(255,255,255,0.84)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  photoLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, backgroundColor: 'rgba(0,0,0,0.30)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  photoLabelText: { color: 'rgba(255,255,255,0.88)', fontSize: 10, lineHeight: 14, fontWeight: '600' },
  content: { padding: 16, alignItems: 'center' },
  badgeRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 14, justifyContent: 'center' },
  compareContainer: { width: '100%', marginBottom: 16 },
  compareHeadline: { fontSize: 17, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  compareSubtext: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  compareSafetyBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 11, marginBottom: 12 },
  compareSafetyText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  candidateList: { gap: 8 },
  candidateCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, borderWidth: 1.5, padding: 10 },
  candidateEmojiWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  candidateEmoji: { fontSize: 25 },
  candidateNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  candidateRank: { fontSize: 10, lineHeight: 14, fontWeight: '800' },
  candidateName: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  candidateLatin: { fontSize: 11, lineHeight: 15, fontStyle: 'italic', marginTop: 1 },
  candidateMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, flexWrap: 'wrap' },
  candidateScore: { fontSize: 11, lineHeight: 15, fontWeight: '700' },
  candidateSeasonChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  candidateSeasonChipText: { fontSize: 10, lineHeight: 13, fontWeight: '700' },
  compareBelowNote: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 11 },
  traitCheckContainer: { width: '100%', borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 13, marginBottom: 16 },
  traitCheckHeadline: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  traitCheckSubtext: { fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 9 },
  traitCheckSummaryText: { fontSize: 12, lineHeight: 17, fontWeight: '700', marginBottom: 10 },
  traitItemCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 11, marginBottom: 9 },
  traitItemLabel: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  traitItemHint: { fontSize: 12, lineHeight: 18, marginTop: 3, marginBottom: 10 },
  traitItemBtnRow: { flexDirection: 'row', gap: 7 },
  traitItemBtn: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  traitItemBtnText: { fontSize: 12, lineHeight: 16, fontWeight: '700', textAlign: 'center' },
  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 11, marginBottom: 12, width: '100%' },
  alertText: { flex: 1, fontWeight: '700', fontSize: 13, lineHeight: 19 },
  confidenceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, width: '100%' },
  confidenceLabel: { fontSize: 11, lineHeight: 15, width: 52 },
  confidenceBar: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 4 },
  confidenceValue: { fontSize: 12, lineHeight: 16, fontWeight: '800', width: 38, textAlign: 'right' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth },
  aiBadgeText: { fontSize: 11, lineHeight: 15, fontWeight: '700' },
  reasonBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 11, marginBottom: 13, width: '100%' },
  reasonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  reasonLabel: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  reasonText: { fontSize: 13, lineHeight: 20 },
  fallbackNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 11, marginBottom: 11, width: '100%' },
  fallbackText: { flex: 1, fontSize: 12, lineHeight: 18 },
  description: { fontSize: 14, lineHeight: 22, textAlign: 'left', width: '100%', marginBottom: 15 },
  effectsContainer: { width: '100%', marginBottom: 13 },
  effectsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  effectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  effectTag: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  effectText: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  effectsCaveat: { marginTop: 8, fontSize: 12, lineHeight: 18 },
  warningBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 11, marginBottom: 11, width: '100%' },
  warningText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  disclaimerWrap: { width: '100%', borderRadius: 15, overflow: 'hidden' },
  actions: { gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  actionRow: { flexDirection: 'row', gap: 9 },
  actionRowStacked: { flexDirection: 'column' },
  btn: { flex: 1, minHeight: 52, flexDirection: 'row', paddingHorizontal: 12, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnShare: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth },
  btnPrimaryText: { fontWeight: '800', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  btnSecondaryText: { fontWeight: '700', fontSize: 13, lineHeight: 18 },
  btnShareText: { fontWeight: '800', fontSize: 13, lineHeight: 18 },
  cardPressed: { opacity: 0.76, transform: [{ scale: 0.995 }] },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
