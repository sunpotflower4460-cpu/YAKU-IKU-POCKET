import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { getPlantById, PLANTS } from '../../src/data/plants';
import { RarityStars } from '../../src/components/RarityStars';
import { DangerBadge, DANGER_LABEL } from '../../src/components/DangerBadge';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { SafetyBanner } from '../../src/components/SafetyBanner';
import { RARITY_XP, useGameStore } from '../../src/store/useGameStore';
import { getCurrentSeason, isPlantInSeason } from '../../src/utils/season';
import { getSafetyWarnings } from '../../src/data/safety';
import { localDateStrOffset } from '../../src/utils/date';
import { getPlantDefinitionById } from '../../src/data/plantDefinitions';
import { getPlantUses } from '../../src/data/plantUses';
import {
  determineMaxGate,
  isCategoryUnlocked,
  isUseUnlocked,
  requiredGateForCategory,
} from '../../src/utils/useGate';
import { SourceOrigin, USE_GATE_LABEL, UseGate } from '../../src/types/plantUse';
import { useTheme } from '../../src/theme/ThemeProvider';
import { READING_MAX_WIDTH } from '../../src/theme/layout';

const ORIGIN_LABEL: Record<SourceOrigin, string> = {
  wild_observed: '野生で観察した',
  wild_collected: '野生で採取した',
  home_grown_verified: '自宅で栽培（確認済み）',
  nursery_plant: '苗・種から購入',
  store_bought_food: '購入した食材',
  store_bought_herb: '購入したハーブ',
  unknown: 'わからない',
};

const RARITY_LABEL: Record<number, string> = {
  1: 'よく見かける',
  2: '比較的見つけやすい',
  3: 'やや珍しい',
  4: '珍しい',
  5: 'とても珍しい',
};

function sourceHostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();
  const {
    scanHistory,
    favoritePlantIds,
    toggleFavorite,
    plantNotes,
    setPlantNote,
    discoveredPlantIds,
    markSafetyCardViewed,
    setScanRevisit,
    setScanOrigin,
    practiceRecords,
    addPracticeRecord,
    deletePracticeRecord,
  } = useGameStore();

  const plant = getPlantById(id ?? '');
  const def = plant ? getPlantDefinitionById(plant.id) : undefined;
  const lookalikes = plant ? getSafetyWarnings(plant.id) : [];
  const hasDangerousLookalike = lookalikes.some((risk) => risk.severity === 'high_risk');

  useEffect(() => {
    if (plant?.danger === 'RED') {
      markSafetyCardViewed(plant.id);
    }
  }, [plant?.id, plant?.danger, markSafetyCardViewed]);

  const isFavorite = favoritePlantIds.includes(id ?? '');
  const savedNote = plantNotes[id ?? ''] ?? '';
  const [noteText, setNoteText] = useState(savedNote);
  const [expandedTier, setExpandedTier] = useState<'compare' | 'deep' | 'living' | null>(null);
  const [practiceNoteText, setPracticeNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    if (savedNote === noteText) return;
    setNoteText(savedNote);
    setNoteSaved(false);
    // Keep local edits authoritative until the persisted source itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedNote]);

  function handleSaveNote() {
    if (noteText === savedNote) return;
    setPlantNote(id ?? '', noteText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteSaved(true);
  }

  function handleDeleteNote() {
    Alert.alert('メモを削除', 'このメモを削除してもよいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          setNoteText('');
          setPlantNote(id ?? '', '');
          setNoteSaved(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  const plantImageUri = scanHistory.find(
    (record) => record.plantId === (id ?? '') && record.imageUri
  )?.imageUri;

  const plantScans = scanHistory.filter((record) => record.plantId === (id ?? ''));
  const scanCount = plantScans.length;
  const firstScan = plantScans.length > 0
    ? plantScans.reduce((a, b) => (a.scannedAt < b.scannedAt ? a : b))
    : null;
  const firstScanLabel = firstScan
    ? new Date(firstScan.scannedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const latestScan = plantScans[0] ?? null;
  const revisitLabel = latestScan?.revisitAt
    ? new Date(latestScan.revisitAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  function handleSetRevisit() {
    if (!latestScan) return;
    Alert.alert('再訪の目安を設定', '花や実がつく頃に、もう一度観察するための目安です。', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '2週間後', onPress: () => setScanRevisit(latestScan.id, localDateStrOffset(14)) },
      { text: '1ヶ月後', onPress: () => setScanRevisit(latestScan.id, localDateStrOffset(30)) },
      { text: '次の季節', onPress: () => setScanRevisit(latestScan.id, localDateStrOffset(90)) },
    ]);
  }

  function handleClearRevisit() {
    if (!latestScan) return;
    Alert.alert('再訪予定を取り消す', 'この再訪予定を取り消しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '取り消す', style: 'destructive', onPress: () => setScanRevisit(latestScan.id, undefined) },
    ]);
  }

  const bestOrigin: SourceOrigin | undefined = latestScan?.sourceOrigin;
  const achievedGate: UseGate = plant
    ? determineMaxGate({
        origin: bestOrigin ?? 'unknown',
        identificationState: latestScan ? 'user_selected' : 'unidentified',
        hasDangerousLookalike,
        plantDanger: plant.danger,
      })
    : 'gate0';
  const plantUses = plant ? getPlantUses(plant) : [];
  const plantPracticeRecords = practiceRecords.filter((record) => record.plantId === (id ?? ''));

  function handleSetOrigin() {
    if (!latestScan) return;
    Alert.alert('入手経路を選択', '安全性と用途の案内に使います。', [
      { text: 'キャンセル', style: 'cancel' },
      ...(Object.keys(ORIGIN_LABEL) as SourceOrigin[]).map((origin) => ({
        text: ORIGIN_LABEL[origin],
        onPress: () => setScanOrigin(latestScan.id, origin),
      })),
    ]);
  }

  function handleSavePracticeRecord() {
    const trimmed = practiceNoteText.trim();
    if (!plant || !trimmed) return;
    addPracticeRecord(plant.id, 'general', trimmed);
    setPracticeNoteText('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleDeletePracticeRecord(recordId: string) {
    Alert.alert('実践記録を削除', 'この記録を削除してもよいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deletePracticeRecord(recordId) },
    ]);
  }

  const currentSeason = getCurrentSeason();
  const relatedPlants = useMemo(() => {
    if (!plant) return [];
    const discoveredSet = new Set(discoveredPlantIds);
    return PLANTS.filter(
      (candidate) =>
        candidate.id !== plant.id &&
        candidate.category === plant.category &&
        isPlantInSeason(candidate.season, currentSeason) &&
        discoveredSet.has(candidate.id)
    ).slice(0, 6);
  }, [plant, discoveredPlantIds, currentSeason]);

  useLayoutEffect(() => {
    if (plant) navigation.setOptions({ title: plant.name });
  }, [plant, navigation]);

  if (!plant) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.colors.canvas }]}>
        <Ionicons name="leaf-outline" size={34} color={theme.colors.textTertiary} accessibilityElementsHidden />
        <Text style={[styles.notFoundText, { color: theme.colors.textSecondary }]} accessibilityRole="header">植物が見つかりません</Text>
      </View>
    );
  }

  const heroGradient: [string, string, string] = plant.danger === 'RED'
    ? theme.mode === 'dark'
      ? ['#250C0B', '#4B1714', '#74241F']
      : ['#5B1713', '#8A2721', '#AF3931']
    : plant.danger === 'YELLOW'
      ? theme.mode === 'dark'
        ? ['#24180B', '#553713', '#76501B']
        : ['#5A350F', '#936016', '#B5771B']
      : theme.mode === 'dark'
        ? ['#0D2314', '#183821', '#24542E']
        : ['#174C25', '#286634', '#377A40'];

  const showHeroImage = !!plantImageUri && !heroImgError;
  const gradientWithAlpha: [string, string, string] = showHeroImage
    ? [heroGradient[0] + 'E8', heroGradient[1] + 'D6', heroGradient[2] + 'C8']
    : heroGradient;
  const practiceCanSave = practiceNoteText.trim().length > 0;
  const noteCanSave = noteText !== savedNote;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.canvas }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.heroWrapper, { backgroundColor: heroGradient[0] }]}>
        {showHeroImage && (
          <Image
            source={{ uri: plantImageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={Platform.OS === 'ios' ? 6 : 2}
            onError={() => setHeroImgError(true)}
            accessibilityIgnoresInvertColors
          />
        )}
        <LinearGradient colors={gradientWithAlpha} style={styles.hero}>
          {showHeroImage && <View style={styles.heroContrastScrim} pointerEvents="none" />}
          {plant.danger === 'RED' && (
            <View style={styles.alertBanner} accessibilityRole="alert">
              <Ionicons name="warning" size={18} color="#FFD3CF" />
              <Text style={styles.alertBannerText}>
                この候補は危険植物として登録されています。採取・摂取の判断には使用しないでください。
              </Text>
            </View>
          )}
          {plant.danger === 'YELLOW' && (
            <View style={styles.warningBanner} accessibilityRole="alert">
              <Ionicons name="warning-outline" size={18} color="#FFE7A6" />
              <Text style={styles.warningBannerText}>
                注意情報があります。特徴と安全情報を確認してください。
              </Text>
            </View>
          )}

          <View style={[styles.emojiCircle, plant.danger === 'RED' && styles.emojiCircleDanger]}>
            <Text style={styles.emoji}>{plant.emoji}</Text>
          </View>
          <Text style={styles.plantName} accessibilityRole="header">{plant.name}</Text>
          <Text style={styles.plantNameEn}>{plant.nameEn}</Text>
          <Text style={styles.plantNameLatin}>{plant.nameLatin}</Text>

          <View style={styles.badgeRow}>
            <RarityStars rarity={plant.rarity} size="lg" />
            <DangerBadge danger={plant.danger} />
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{plant.category}</Text>
            </View>
            {showHeroImage && (
              <View style={styles.photoIndicator}>
                <Ionicons name="camera-outline" size={14} color="#F2F8F2" />
                <Text style={styles.photoIndicatorText}>撮影した写真</Text>
              </View>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.favoriteBtn, pressed && styles.heroPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleFavorite(id ?? '');
            }}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? `${plant.name}をお気に入りから外す` : `${plant.name}をお気に入りに追加`}
            accessibilityState={{ selected: isFavorite }}
          >
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={19} color={isFavorite ? '#FFD2D2' : '#FFFFFF'} />
            <Text style={styles.favoriteBtnText}>{isFavorite ? 'お気に入り' : 'お気に入りに追加'}</Text>
          </Pressable>
        </LinearGradient>
      </View>

      {scanCount > 0 && (
        <View style={[styles.discoveryBar, { backgroundColor: theme.colors.surfacePrimary, borderBottomColor: theme.colors.borderSubtle }]}>
          {firstScanLabel && (
            <View style={[styles.discoveryChip, { backgroundColor: theme.colors.surfaceSecondary }]} accessible accessibilityLabel={`初めて観察した日 ${firstScanLabel}`}>
              <Ionicons name="calendar-outline" size={15} color={theme.colors.textTertiary} />
              <Text style={[styles.discoveryChipText, { color: theme.colors.textSecondary }]}>初観察 {firstScanLabel}</Text>
            </View>
          )}
          <View style={[styles.discoveryChip, { backgroundColor: theme.colors.surfaceSecondary }]} accessible accessibilityLabel={`観察回数 ${scanCount}回`}>
            <Ionicons name="camera-outline" size={15} color={theme.colors.textTertiary} />
            <Text style={[styles.discoveryChipText, { color: theme.colors.textSecondary }]}>{scanCount}回観察</Text>
          </View>
          {revisitLabel ? (
            <Pressable
              style={({ pressed }) => [styles.discoveryActionChip, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle }, pressed && styles.pressed]}
              onPress={handleClearRevisit}
              accessibilityRole="button"
              accessibilityLabel={`再訪予定 ${revisitLabel}`}
              accessibilityHint="ダブルタップで予定を取り消します"
            >
              <Ionicons name="alarm-outline" size={16} color={theme.colors.accentPrimary} />
              <Text style={[styles.discoveryChipText, { color: theme.colors.accentPrimaryPressed }]}>再訪 {revisitLabel}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.discoveryActionChip, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle }, pressed && styles.pressed]}
              onPress={handleSetRevisit}
              accessibilityRole="button"
              accessibilityLabel="再訪の目安を設定"
            >
              <Ionicons name="alarm-outline" size={16} color={theme.colors.accentPrimary} />
              <Text style={[styles.discoveryChipText, { color: theme.colors.accentPrimaryPressed }]}>再訪を設定</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.body}>
        <SafetyBanner warnings={lookalikes} />

        <Section icon="flash-outline" title="まず知る">
          <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>{plant.description}</Text>
          <View style={styles.infoBlock}>
            <InfoRow icon="location-outline" label="生息地" value={plant.habitat} />
            <InfoRow icon="calendar-outline" label="旬の時期" value={plant.season} />
          </View>
          {(plant.warningNote || lookalikes[0]) && (
            <View style={[styles.quickCautionRow, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.statusDanger }]}>
              <Ionicons name="alert-circle-outline" size={17} color={theme.colors.statusDanger} />
              <Text style={[styles.quickCautionText, { color: theme.colors.textPrimary }]}>
                {plant.warningNote ?? lookalikes[0].note}
              </Text>
            </View>
          )}
        </Section>

        <Section icon="star-outline" title="見つけやすさ">
          <View style={styles.rarityDetail}>
            <RarityStars rarity={plant.rarity} size="lg" />
            <Text style={[styles.rarityLabel, { color: theme.colors.textPrimary }]}>{RARITY_LABEL[plant.rarity]}</Text>
          </View>
          <Text style={[styles.rarityXpHint, { color: theme.colors.textTertiary }]}>
            初めて記録すると +{RARITY_XP[plant.rarity]}XP
          </Text>
        </Section>

        {plant.warningNote && (
          <Section icon={plant.danger === 'RED' ? 'shield-outline' : 'warning-outline'} title={plant.danger === 'RED' ? '安全情報' : '注意事項'}>
            <View
              style={[
                styles.warningNote,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: plant.danger === 'RED' ? theme.colors.statusDanger : theme.colors.statusCaution,
                },
              ]}
            >
              <Text style={[styles.warningNoteText, { color: theme.colors.textPrimary }]}>{plant.warningNote}</Text>
            </View>
          </Section>
        )}

        <ExpandableTier
          icon="git-compare-outline"
          title="見分ける"
          subtitle="特徴と類似種を確認"
          expanded={expandedTier === 'compare'}
          onToggle={() => setExpandedTier((tier) => (tier === 'compare' ? null : 'compare'))}
        >
          {def && (def.taxonomy.family || def.taxonomy.genus) && (
            <View style={styles.identPointRow}>
              {def.taxonomy.family && <InfoRow icon="git-branch-outline" label="科" value={def.taxonomy.family} />}
              {def.taxonomy.genus && <InfoRow icon="leaf-outline" label="属" value={def.taxonomy.genus} />}
            </View>
          )}
          {lookalikes.length > 0 ? (
            <>
              <Text style={[styles.tierSubLabel, { color: theme.colors.textSecondary }]}>類似種との違い</Text>
              {lookalikes.map((risk) => (
                <View key={risk.name} style={[styles.lookalikeCard, { backgroundColor: theme.colors.surfaceSecondary, borderColor: risk.severity === 'high_risk' ? theme.colors.statusDanger : theme.colors.statusCaution }]}>
                  <View style={styles.lookalikeNameRow}>
                    <Ionicons name={risk.severity === 'high_risk' ? 'warning' : 'warning-outline'} size={16} color={risk.severity === 'high_risk' ? theme.colors.statusDanger : theme.colors.statusCaution} />
                    <Text style={[styles.lookalikeName, { color: theme.colors.textPrimary }]}>{risk.name}</Text>
                  </View>
                  <Text style={[styles.lookalikeNote, { color: theme.colors.textSecondary }]}>{risk.note}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={[styles.tierEmptyText, { color: theme.colors.textTertiary }]}>登録されている危険な類似種はありません。</Text>
          )}
          <Pressable
            style={({ pressed }) => [styles.compareCta, { backgroundColor: theme.colors.accentPrimary }, pressed && styles.pressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/scan');
            }}
            accessibilityRole="button"
            accessibilityLabel="観察画面を開いて現物と見比べる"
          >
            <Ionicons name="camera-outline" size={18} color={theme.colors.textOnAccent} />
            <Text style={[styles.compareCtaText, { color: theme.colors.textOnAccent }]}>現物と見比べる</Text>
          </Pressable>
        </ExpandableTier>

        <ExpandableTier
          icon="library-outline"
          title="深く学ぶ"
          subtitle="分類・言い伝え・出典"
          expanded={expandedTier === 'deep'}
          onToggle={() => setExpandedTier((tier) => (tier === 'deep' ? null : 'deep'))}
        >
          <InfoRow icon="flask-outline" label="学名" value={plant.nameLatin} />
          {def?.taxonomy.family && <InfoRow icon="git-branch-outline" label="科" value={def.taxonomy.family} />}
          {def?.taxonomy.genus && <InfoRow icon="leaf-outline" label="属" value={def.taxonomy.genus} />}

          {plant.effects.length > 0 && (
            <>
              <Text style={[styles.tierSubLabel, { color: theme.colors.textSecondary }]}>伝統的な用途・言い伝え</Text>
              <View style={styles.effectTags}>
                {plant.effects.map((effect) => (
                  <Pressable
                    key={effect}
                    style={({ pressed }) => [
                      styles.effectTag,
                      { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderStrong },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/(tabs)/zukan?filterEffect=${encodeURIComponent(effect)}`);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${effect}に関連する植物を図鑑で見る`}
                  >
                    <Text style={[styles.effectText, { color: theme.colors.accentPrimaryPressed }]}>{effect}</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.effectsCaveat, { color: theme.colors.textTertiary }]}>
                伝統的な言い伝え・慣習的な利用の紹介です。医学的な効果を保証するものではありません。
              </Text>
            </>
          )}

          <Text style={[styles.tierSubLabel, { color: theme.colors.textSecondary }]}>データの確度・出典</Text>
          <Text style={[styles.tierEmptyText, { color: theme.colors.textSecondary }]}>
            {def?.reviewStatus === 'expert'
              ? '専門家によるレビュー済みの情報です。'
              : '編集部が一般的な植物学の知見をもとに整理した情報です。専門データベース連携・専門家レビューは今後の対応予定です。'}
          </Text>
          {def && def.sourceRefs.length > 0 && (
            <View style={styles.sourceRefList}>
              {def.sourceRefs.map((url) => (
                <Pressable
                  key={url}
                  style={({ pressed }) => [styles.sourceRefRow, { borderColor: theme.colors.borderSubtle }, pressed && styles.pressed]}
                  onPress={() => Linking.openURL(url).catch(() => {})}
                  accessibilityRole="link"
                  accessibilityLabel={`参考資料を開く ${sourceHostLabel(url)}`}
                >
                  <Ionicons name="open-outline" size={17} color={theme.colors.accentPrimary} />
                  <Text style={[styles.sourceRefText, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                    {sourceHostLabel(url)}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={theme.colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          )}
        </ExpandableTier>

        <ExpandableTier
          icon="home-outline"
          title="暮らしに活かす"
          subtitle="確認レベルに応じた用途"
          expanded={expandedTier === 'living'}
          onToggle={() => setExpandedTier((tier) => (tier === 'living' ? null : 'living'))}
        >
          {!latestScan ? (
            <View style={[styles.emptyCallout, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Ionicons name="camera-outline" size={18} color={theme.colors.textTertiary} />
              <Text style={[styles.tierEmptyText, { color: theme.colors.textSecondary, flex: 1 }]}>
                観察を記録すると、この植物の入手経路に応じた案内を確認できます。
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.originRow}>
                <Text style={[styles.tierSubLabel, { color: theme.colors.textSecondary, marginTop: 0 }]}>入手経路</Text>
                <Pressable
                  style={({ pressed }) => [styles.originBtn, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle }, pressed && styles.pressed]}
                  onPress={handleSetOrigin}
                  accessibilityRole="button"
                  accessibilityLabel={`入手経路 ${bestOrigin ? ORIGIN_LABEL[bestOrigin] : '未選択'}`}
                >
                  <Text style={[styles.originBtnText, { color: theme.colors.textPrimary }]}>{bestOrigin ? ORIGIN_LABEL[bestOrigin] : '入手経路を選ぶ'}</Text>
                  <Ionicons name="chevron-forward" size={17} color={theme.colors.textTertiary} />
                </Pressable>
                <View style={styles.gateRow} accessible accessibilityLabel={`現在の確認レベル ${USE_GATE_LABEL[achievedGate]}`}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={theme.colors.statusVerified} />
                  <Text style={[styles.gateText, { color: theme.colors.textSecondary }]}>確認レベル {USE_GATE_LABEL[achievedGate]}</Text>
                </View>
              </View>

              {plantUses.map((use) => {
                const unlocked = isUseUnlocked(use, achievedGate, bestOrigin ?? 'unknown');
                return (
                  <View key={use.id} style={[styles.useCard, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle }, !unlocked && styles.useCardLocked]}>
                    <View style={styles.useCardHeaderRow}>
                      <Ionicons name={unlocked ? 'checkmark-circle-outline' : 'lock-closed-outline'} size={17} color={unlocked ? theme.colors.statusVerified : theme.colors.textTertiary} />
                      <Text style={[styles.useCardTitle, { color: theme.colors.textPrimary }]}>{use.title}</Text>
                    </View>
                    {unlocked ? (
                      <Text style={[styles.useCardSummary, { color: theme.colors.textSecondary }]}>{use.summary}</Text>
                    ) : isCategoryUnlocked(use.category, achievedGate) ? (
                      <Text style={[styles.tierEmptyText, { color: theme.colors.textTertiary }]}>
                        選択中の入手経路「{bestOrigin ? ORIGIN_LABEL[bestOrigin] : '未選択'}」では、この用途を表示できません。
                      </Text>
                    ) : (
                      <Text style={[styles.tierEmptyText, { color: theme.colors.textTertiary }]}>
                        「{USE_GATE_LABEL[requiredGateForCategory(use.category)]}」以上の確認レベルで表示されます。
                      </Text>
                    )}
                    {unlocked && use.warnings.map((warning) => (
                      <View key={warning} style={styles.useWarningRow}>
                        <Ionicons name="warning-outline" size={15} color={theme.colors.statusCaution} />
                        <Text style={[styles.useCardWarning, { color: theme.colors.textSecondary }]}>{warning}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </>
          )}

          <Text style={[styles.tierSubLabel, { color: theme.colors.textSecondary }]}>実践記録</Text>
          {plantPracticeRecords.length === 0 ? (
            <Text style={[styles.tierEmptyText, { color: theme.colors.textTertiary }]}>まだ記録がありません。</Text>
          ) : (
            <View style={[styles.practiceList, { borderColor: theme.colors.borderSubtle }]}>
              {plantPracticeRecords.map((record) => (
                <View key={record.id} style={[styles.practiceRow, { borderBottomColor: theme.colors.borderSubtle }]}>
                  <Text style={[styles.practiceNote, { color: theme.colors.textPrimary }]}>{record.note}</Text>
                  <Pressable
                    style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                    onPress={() => handleDeletePracticeRecord(record.id)}
                    accessibilityRole="button"
                    accessibilityLabel="この実践記録を削除"
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.statusDanger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <View style={styles.practiceAddRow}>
            <TextInput
              style={[styles.practiceInput, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]}
              value={practiceNoteText}
              onChangeText={setPracticeNoteText}
              placeholder="何をしたか記録する"
              placeholderTextColor={theme.colors.textTertiary}
              returnKeyType="done"
              onSubmitEditing={handleSavePracticeRecord}
              accessibilityLabel="実践記録"
            />
            <Pressable
              style={({ pressed }) => [
                styles.practiceAddBtn,
                { backgroundColor: practiceCanSave ? theme.colors.accentPrimary : theme.colors.surfaceTertiary },
                pressed && practiceCanSave && styles.pressed,
              ]}
              onPress={handleSavePracticeRecord}
              disabled={!practiceCanSave}
              accessibilityRole="button"
              accessibilityLabel="実践記録を追加"
              accessibilityState={{ disabled: !practiceCanSave }}
            >
              <Ionicons name="add" size={21} color={practiceCanSave ? theme.colors.textOnAccent : theme.colors.textTertiary} />
            </Pressable>
          </View>
        </ExpandableTier>

        <View style={[styles.noteSection, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]}>
          <View style={styles.noteTitleRow}>
            <View style={styles.noteTitleLabel}>
              <Ionicons name="create-outline" size={18} color={theme.colors.accentPrimary} />
              <Text style={[styles.noteSectionTitle, { color: theme.colors.textPrimary }]}>観察メモ</Text>
            </View>
            {savedNote.length > 0 && (
              <Pressable
                style={({ pressed }) => [styles.noteDeleteBtn, pressed && styles.pressed]}
                onPress={handleDeleteNote}
                accessibilityRole="button"
                accessibilityLabel="観察メモを削除"
              >
                <Text style={[styles.noteDeleteText, { color: theme.colors.statusDanger }]}>削除</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            style={[styles.noteInput, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]}
            value={noteText}
            onChangeText={(text) => {
              setNoteText(text);
              setNoteSaved(false);
            }}
            placeholder="気づいた特徴、見つけた場所、季節の変化など"
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            maxLength={500}
            textAlignVertical="top"
            accessibilityLabel="観察メモ"
          />
          <View style={styles.noteFooterRow}>
            <Text style={[styles.noteCharCount, { color: theme.colors.textTertiary }]}>{noteText.length}/500</Text>
            <Pressable
              style={({ pressed }) => [
                styles.noteSaveBtn,
                {
                  backgroundColor: noteSaved
                    ? theme.colors.surfaceSecondary
                    : noteCanSave
                      ? theme.colors.accentPrimary
                      : theme.colors.surfaceTertiary,
                },
                pressed && noteCanSave && styles.pressed,
              ]}
              onPress={handleSaveNote}
              disabled={!noteCanSave}
              accessibilityRole="button"
              accessibilityLabel={noteSaved ? '観察メモは保存済み' : '観察メモを保存'}
              accessibilityState={{ disabled: !noteCanSave }}
            >
              {noteSaved && <Ionicons name="checkmark" size={17} color={theme.colors.statusVerified} />}
              <Text style={[styles.noteSaveBtnText, { color: noteSaved ? theme.colors.statusVerified : noteCanSave ? theme.colors.textOnAccent : theme.colors.textTertiary }]}>
                {noteSaved ? '保存済み' : '保存'}
              </Text>
            </Pressable>
          </View>
        </View>

        {relatedPlants.length > 0 && (
          <View style={[styles.relatedSection, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="leaf-outline" size={18} color={theme.colors.accentPrimary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>今季の関連植物</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedList}>
              {relatedPlants.map((related) => {
                const statusColor = related.danger === 'RED'
                  ? theme.colors.statusDanger
                  : related.danger === 'YELLOW'
                    ? theme.colors.statusCaution
                    : theme.colors.statusVerified;
                return (
                  <Pressable
                    key={related.id}
                    style={({ pressed }) => [styles.relatedCard, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle, borderTopColor: statusColor }, pressed && styles.pressed]}
                    onPress={() => router.push(`/plant/${related.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${related.name}。${DANGER_LABEL[related.danger]}。詳細を見る`}
                  >
                    <Text style={styles.relatedEmoji}>{related.emoji}</Text>
                    <Text style={[styles.relatedName, { color: theme.colors.textPrimary }]} numberOfLines={2}>{related.name}</Text>
                    <View style={[styles.relatedDangerDot, { backgroundColor: statusColor }]} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <DisclaimerBanner />

        <Pressable
          style={({ pressed }) => [styles.scanCta, { backgroundColor: theme.colors.accentPrimary }, pressed && styles.pressed]}
          onPress={() => router.push('/(tabs)/scan')}
          accessibilityRole="button"
          accessibilityLabel="観察を続ける"
        >
          <Ionicons name="camera-outline" size={20} color={theme.colors.textOnAccent} />
          <Text style={[styles.scanCtaText, { color: theme.colors.textOnAccent }]}>観察を続ける</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={18} color={theme.colors.accentPrimary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow} accessible accessibilityLabel={`${label} ${value}`}>
      <Ionicons name={icon} size={17} color={theme.colors.textTertiary} style={styles.infoIcon} />
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function ExpandableTier({
  icon,
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]}>
      <Pressable
        style={({ pressed }) => [styles.tierHeaderRow, pressed && styles.pressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}。${subtitle}`}
        accessibilityHint={expanded ? 'ダブルタップで閉じます' : 'ダブルタップで開きます'}
      >
        <View style={[styles.tierIcon, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <Ionicons name={icon} size={19} color={theme.colors.accentPrimary} />
        </View>
        <View style={styles.tierTitleBlock}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.tierSubtitle, { color: theme.colors.textTertiary }]}>{subtitle}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={19} color={theme.colors.textTertiary} />
      </Pressable>
      {expanded && <View style={[styles.tierBody, { borderTopColor: theme.colors.borderSubtle }]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 },
  notFoundText: { fontSize: 16, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  heroWrapper: { width: '100%', maxWidth: READING_MAX_WIDTH, alignSelf: 'center', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  hero: { position: 'relative', paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center' },
  heroContrastScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  alertBanner: { width: '100%', maxWidth: 720, minHeight: 52, flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(0,0,0,0.40)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 },
  alertBannerText: { flex: 1, color: '#FFF2F0', fontWeight: '800', fontSize: 13, lineHeight: 19 },
  warningBanner: { width: '100%', maxWidth: 720, minHeight: 50, flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(0,0,0,0.34)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 },
  warningBannerText: { flex: 1, color: '#FFF3C9', fontWeight: '700', fontSize: 13, lineHeight: 19 },
  emojiCircle: { width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.26)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emojiCircleDanger: { backgroundColor: 'rgba(255,120,110,0.12)' },
  emoji: { fontSize: 60 },
  plantName: { maxWidth: '100%', fontSize: 29, lineHeight: 36, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  plantNameEn: { maxWidth: '100%', fontSize: 15, lineHeight: 20, color: '#EEF7EF', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  plantNameLatin: { maxWidth: '100%', fontSize: 13, lineHeight: 18, color: '#E4EFE5', fontStyle: 'italic', marginTop: 2, marginBottom: 13, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  categoryChip: { minHeight: 30, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 999, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.20)' },
  categoryText: { color: '#FFFFFF', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  photoIndicator: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.32)', borderRadius: 999, paddingHorizontal: 11 },
  photoIndicatorText: { color: '#F2F8F2', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  favoriteBtn: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 999, paddingHorizontal: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
  favoriteBtnText: { fontSize: 14, lineHeight: 19, fontWeight: '700', color: '#FFFFFF' },
  heroPressed: { opacity: 0.78 },
  discoveryBar: { width: '100%', maxWidth: READING_MAX_WIDTH, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  discoveryChip: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11 },
  discoveryActionChip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth },
  discoveryChipText: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  body: { width: '100%', maxWidth: READING_MAX_WIDTH, alignSelf: 'center', padding: 16, gap: 0 },
  section: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '800' },
  bodyText: { fontSize: 15, lineHeight: 24 },
  infoBlock: { marginTop: 14 },
  infoRow: { minHeight: 40, flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  infoIcon: { width: 22, marginTop: 1 },
  infoLabel: { width: 68, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  infoValue: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  quickCautionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8, padding: 12, borderRadius: 12, borderLeftWidth: 3 },
  quickCautionText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  rarityDetail: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  rarityLabel: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  rarityXpHint: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 9 },
  warningNote: { borderRadius: 12, padding: 13, borderLeftWidth: 3 },
  warningNoteText: { fontSize: 14, lineHeight: 22, fontWeight: '600' },
  tierHeaderRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 11, margin: -6, padding: 6, borderRadius: 12 },
  tierIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tierTitleBlock: { flex: 1, minWidth: 0 },
  tierSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 1 },
  tierBody: { marginTop: 12, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  tierSubLabel: { fontSize: 13, lineHeight: 19, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  tierEmptyText: { fontSize: 13, lineHeight: 20 },
  identPointRow: { marginBottom: 2 },
  lookalikeCard: { borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3 },
  lookalikeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  lookalikeName: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
  lookalikeNote: { fontSize: 13, lineHeight: 20 },
  compareCta: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 16, marginTop: 12 },
  compareCtaText: { fontWeight: '800', fontSize: 14, lineHeight: 20 },
  effectTags: { gap: 8 },
  effectTag: { minHeight: 44, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderWidth: StyleSheet.hairlineWidth },
  effectText: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  effectsCaveat: { marginTop: 10, fontSize: 12, lineHeight: 18 },
  sourceRefList: { marginTop: 8, gap: 6 },
  sourceRefRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  sourceRefText: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  emptyCallout: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 12 },
  originRow: { marginBottom: 14 },
  originBtn: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, paddingHorizontal: 13, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth },
  originBtnText: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  gateRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  gateText: { fontSize: 12, lineHeight: 17, fontWeight: '600', flexShrink: 1 },
  useCard: { borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth },
  useCardLocked: { opacity: 0.72 },
  useCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  useCardTitle: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  useCardSummary: { fontSize: 13, lineHeight: 20 },
  useWarningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 7 },
  useCardWarning: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 18 },
  practiceList: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  practiceRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  practiceNote: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 20, paddingVertical: 9 },
  iconAction: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  practiceAddRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  practiceInput: { flex: 1, minWidth: 0, minHeight: 46, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, lineHeight: 20 },
  practiceAddBtn: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noteSection: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  noteTitleRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' },
  noteTitleLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 140 },
  noteSectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '800', flexShrink: 1 },
  noteDeleteBtn: { minWidth: 44, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  noteDeleteText: { fontSize: 13, lineHeight: 19, fontWeight: '700' },
  noteInput: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, lineHeight: 22, color: '#000', minHeight: 112 },
  noteFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9, gap: 8, flexWrap: 'wrap' },
  noteCharCount: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  noteSaveBtn: { minHeight: 44, minWidth: 92, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  noteSaveBtnText: { fontSize: 13, lineHeight: 19, fontWeight: '800' },
  relatedSection: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  relatedList: { paddingRight: 6 },
  relatedCard: { width: 112, minHeight: 120, borderRadius: 14, padding: 10, marginRight: 10, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderTopWidth: 3 },
  relatedEmoji: { fontSize: 29, marginBottom: 6 },
  relatedName: { fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center' },
  relatedDangerDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  scanCta: { minHeight: 56, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8, marginTop: 2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 9 },
  scanCtaText: { fontSize: 16, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
