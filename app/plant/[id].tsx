import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../src/utils/haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { getPlantById, PLANTS } from '../../src/data/plants';
import { RarityStars } from '../../src/components/RarityStars';
import { DangerBadge, DANGER_LABEL } from '../../src/components/DangerBadge';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { Colors } from '../../src/constants/colors';
import { RARITY_XP, useGameStore } from '../../src/store/useGameStore';
import { getCurrentSeason, isPlantInSeason } from '../../src/utils/season';
import { SafetyBanner } from '../../src/components/SafetyBanner';
import { getSafetyWarnings } from '../../src/data/safety';
import { localDateStrOffset } from '../../src/utils/date';
import { getPlantDefinitionById } from '../../src/data/plantDefinitions';
import { getPlantUses } from '../../src/data/plantUses';
import { determineMaxGate, isCategoryUnlocked, isUseUnlocked, requiredGateForCategory } from '../../src/utils/useGate';
import { SourceOrigin, USE_GATE_LABEL, UseGate } from '../../src/types/plantUse';

const ORIGIN_LABEL: Record<SourceOrigin, string> = {
  wild_observed: '野生で観察した',
  wild_collected: '野生で採取した',
  home_grown_verified: '自宅で栽培（確認済み）',
  nursery_plant: '苗・種から購入',
  store_bought_food: '購入した食材',
  store_bought_herb: '購入したハーブ',
  unknown: 'わからない',
};


/** Short, readable label for a source URL (its hostname) — never the raw URL. */
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
  const {
    scanHistory, favoritePlantIds, toggleFavorite, plantNotes, setPlantNote,
    discoveredPlantIds, markSafetyCardViewed, setScanRevisit, setScanOrigin,
    practiceRecords, addPracticeRecord, deletePracticeRecord,
  } = useGameStore();

  const plant = getPlantById(id ?? '');
  const def = plant ? getPlantDefinitionById(plant.id) : undefined;
  const lookalikes = plant ? getSafetyWarnings(plant.id) : [];
  const hasDangerousLookalike = lookalikes.some((r) => r.severity === 'high_risk');

  // Fieldbook learning achievement (§7.8): record that the user opened a
  // dangerous plant's detail page (i.e. read its safety information).
  useEffect(() => {
    if (plant?.danger === 'RED') {
      markSafetyCardViewed(plant.id);
    }
  }, [plant?.id, plant?.danger]);
  const isFavorite = favoritePlantIds.includes(id ?? '');
  const savedNote = plantNotes[id ?? ''] ?? '';
  const [noteText, setNoteText] = useState(savedNote);
  // 3段階学習（v3 §8.2）: 「30秒で知る」は常時表示、残り2段階は開閉式。
  const [expandedTier, setExpandedTier] = useState<'compare' | 'deep' | 'living' | null>(null);
  const [practiceNoteText, setPracticeNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  // Persisted photo URIs point at the cache dir, which the OS may purge.
  // If the image fails to load, fall back to the solid gradient hero.
  const [heroImgError, setHeroImgError] = useState(false);

  // savedNote が外から変わった場合（例: 別画面でリセット）に同期し、noteSaved もリセット
  useEffect(() => {
    setNoteText(savedNote);
    setNoteSaved(false);
  }, [savedNote]);

  function handleSaveNote() {
    setPlantNote(id ?? '', noteText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  // 最新スキャンの写真 URI を取得
  const plantImageUri = scanHistory.find(
    (r) => r.plantId === (id ?? '') && r.imageUri
  )?.imageUri;

  // 初回発見日時・スキャン回数
  const plantScans = scanHistory.filter((r) => r.plantId === (id ?? ''));
  const scanCount = plantScans.length;
  const firstScan = plantScans.length > 0
    ? plantScans.reduce((a, b) => a.scannedAt < b.scannedAt ? a : b)
    : null;
  const firstScanLabel = firstScan
    ? new Date(firstScan.scannedAt).toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null;

  // Most recent observation of this plant — revisit reminders attach here
  // (scanHistory is newest-first, so filtering preserves that order).
  const latestScan = plantScans[0] ?? null;
  const revisitLabel = latestScan?.revisitAt
    ? new Date(latestScan.revisitAt).toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null;

  function handleSetRevisit() {
    if (!latestScan) return;
    Alert.alert('再訪を記録する', '花や実がつく頃にまた見に行くための目安です。いつ頃にしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '2週間後', onPress: () => setScanRevisit(latestScan.id, localDateStrOffset(14)) },
      { text: '1ヶ月後', onPress: () => setScanRevisit(latestScan.id, localDateStrOffset(30)) },
      { text: '次の季節（3ヶ月後）', onPress: () => setScanRevisit(latestScan.id, localDateStrOffset(90)) },
    ]);
  }

  function handleClearRevisit() {
    if (!latestScan) return;
    setScanRevisit(latestScan.id, undefined);
  }

  // ── 暮らし（v3 §10-§11, PR22） ──────────────────────────────────────
  // 入手経路は最新の観察記録に紐づける。観察が無ければ暮らしタブは
  // 「まず観察してください」の案内のみを表示する。
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
  const plantPracticeRecords = practiceRecords.filter((r) => r.plantId === (id ?? ''));

  function handleSetOrigin() {
    if (!latestScan) return;
    Alert.alert('入手経路を教えてください', 'この植物でできることの案内に使います。', [
      { text: 'キャンセル', style: 'cancel' },
      ...(Object.keys(ORIGIN_LABEL) as SourceOrigin[]).map((o) => ({
        text: ORIGIN_LABEL[o],
        onPress: () => setScanOrigin(latestScan.id, o),
      })),
    ]);
  }

  function handleSavePracticeRecord() {
    if (!plant || practiceNoteText.trim().length === 0) return;
    addPracticeRecord(plant.id, 'general', practiceNoteText.trim());
    setPracticeNoteText('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // 関連植物（同カテゴリ & 現季節 & 発見済み & 自分以外）— plant が undefined の場合は空配列
  const currentSeason = getCurrentSeason();
  const relatedPlants = useMemo(() => {
    if (!plant) return [];
    const discoveredSet = new Set(discoveredPlantIds);
    return PLANTS.filter(
      (p) =>
        p.id !== plant.id &&
        p.category === plant.category &&
        isPlantInSeason(p.season, currentSeason) &&
        discoveredSet.has(p.id)
    ).slice(0, 6);
  }, [plant, discoveredPlantIds, currentSeason]);

  useLayoutEffect(() => {
    if (plant) {
      navigation.setOptions({ title: plant.name });
    }
  }, [plant, navigation]);

  if (!plant) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>植物が見つかりません</Text>
      </View>
    );
  }

  const heroGradient: [string, string, string] = plant.danger === 'RED'
    ? ['#3A0000', '#7B0000', '#C62828']
    : plant.danger === 'YELLOW'
    ? ['#5D1A00', '#E65100', '#F57F17']
    : ['#1B5E20', '#2E7D32', '#43A047'];

  // 写真が有効に読み込める場合のみ背景に使う（キャッシュ削除で壊れた URI は無視）
  const showHeroImage = !!plantImageUri && !heroImgError;

  // 写真がある場合はグラジエントを半透明にする
  const gradientWithAlpha: [string, string, string] = showHeroImage
    ? [heroGradient[0] + 'CC', heroGradient[1] + 'BB', heroGradient[2] + 'AA']
    : heroGradient;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.heroWrapper}>
        {/* ユーザーの撮影写真を背景に表示 */}
        {showHeroImage && (
          <Image
            source={{ uri: plantImageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={Platform.OS === 'ios' ? 6 : 2}
            onError={() => setHeroImgError(true)}
          />
        )}
        <LinearGradient colors={gradientWithAlpha} style={styles.hero}>
          {/* Danger alert banner */}
          {plant.danger === 'RED' && (
            <View style={styles.alertBanner}>
              <Ionicons name="skull-outline" size={14} color="#FF8A80" />
              <Text style={styles.alertBannerText}>
                危険 — この植物は絶対に採取・摂取しないでください
              </Text>
            </View>
          )}
          {plant.danger === 'YELLOW' && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={13} color="#FFE082" />
              <Text style={styles.warningBannerText}>
                注意が必要な植物です
              </Text>
            </View>
          )}

          {/* Emoji */}
          <View
            style={[
              styles.emojiCircle,
              plant.danger === 'RED' && { backgroundColor: 'rgba(255,0,0,0.2)' },
            ]}
          >
            <Text style={styles.emoji}>{plant.emoji}</Text>
          </View>

          {/* Names */}
          <Text style={styles.plantName}>{plant.name}</Text>
          <Text style={styles.plantNameEn}>{plant.nameEn}</Text>
          <Text style={styles.plantNameLatin}>{plant.nameLatin}</Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <RarityStars rarity={plant.rarity} size="lg" />
            <DangerBadge danger={plant.danger} />
          </View>

          {/* Category chip */}
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{plant.category}</Text>
          </View>

          {/* 撮影写真バッジ */}
          {plantImageUri && (
            <View style={styles.photoIndicator}>
              <Ionicons name="camera-outline" size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.photoIndicatorText}>あなたの撮影写真</Text>
            </View>
          )}

          {/* お気に入りボタン */}
          <Pressable
            style={styles.favoriteBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleFavorite(id ?? '');
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isFavorite }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#FF6B6B' : '#FFFFFF'}
            />
            <Text style={styles.favoriteBtnText}>
              {isFavorite ? 'お気に入り済み' : 'お気に入りに追加'}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* Discovery info bar */}
      {scanCount > 0 && (
        <View style={styles.discoveryBar}>
          {firstScanLabel && (
            <View style={styles.discoveryChip}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.discoveryChipText}>初発見: {firstScanLabel}</Text>
            </View>
          )}
          <View style={styles.discoveryChip}>
            <Ionicons name="camera-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.discoveryChipText}>{scanCount}回スキャン済み</Text>
          </View>
          {revisitLabel ? (
            <Pressable style={styles.discoveryChip} onPress={handleClearRevisit} accessibilityRole="button">
              <Ionicons name="alarm-outline" size={12} color={Colors.primaryDark} />
              <Text style={styles.discoveryChipText}>再訪予定: {revisitLabel}（タップで取消）</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.discoveryChip} onPress={handleSetRevisit} accessibilityRole="button">
              <Ionicons name="alarm-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.discoveryChipText}>再訪を記録する</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Body */}
      <View style={styles.body}>
        {/* Dangerous look-alike warning (data-driven safety, not colour-only) */}
        <SafetyBanner warnings={getSafetyWarnings(plant.id)} />

        {/* ── 30秒で知る（v3 §8.2、常時表示） ── */}
        <Section icon="flash-outline" title="30秒で知る">
          <Text style={styles.bodyText}>{plant.description}</Text>
          <InfoRow icon="location-outline" label="生息地" value={plant.habitat} />
          <InfoRow icon="calendar-outline" label="旬の時期" value={plant.season} />
          {(plant.warningNote || lookalikes[0]) && (
            <View style={styles.quickCautionRow}>
              <Ionicons name="alert-circle-outline" size={13} color={Colors.dangerRed} />
              <Text style={styles.quickCautionText} numberOfLines={2}>
                {plant.warningNote ?? lookalikes[0].note}
              </Text>
            </View>
          )}
        </Section>

        {/* Rarity info */}
        <Section icon="star-outline" title="レアリティ">
          <View style={styles.rarityDetail}>
            <RarityStars rarity={plant.rarity} size="lg" />
            <Text style={styles.rarityLabel}>
              {
                ['', 'コモン', 'アンコモン', 'レア', 'スーパーレア', 'レジェンダリー'][
                  plant.rarity
                ]
              }
            </Text>
          </View>
          <Text style={styles.rarityXpHint}>
            初回発見 +{RARITY_XP[plant.rarity]}XP
          </Text>
        </Section>

        {/* Warning note */}
        {plant.warningNote && (
          <Section icon={plant.danger === 'RED' ? 'skull-outline' : 'warning-outline'} title={plant.danger === 'RED' ? '危険情報' : '注意事項'}>
            <View
              style={[
                styles.warningNote,
                plant.danger === 'RED' && styles.warningNoteRed,
              ]}
            >
              <Text
                style={[
                  styles.warningNoteText,
                  plant.danger === 'RED' && styles.warningNoteTextRed,
                ]}
              >
                {plant.warningNote}
              </Text>
            </View>
          </Section>
        )}

        {/* ── 3分で見分ける（v3 §8.2） ── */}
        <ExpandableTier
          icon="git-compare-outline"
          title="3分で見分ける"
          expanded={expandedTier === 'compare'}
          onToggle={() => setExpandedTier((t) => (t === 'compare' ? null : 'compare'))}
        >
          {def && (def.taxonomy.family || def.taxonomy.genus) && (
            <View style={styles.identPointRow}>
              {def.taxonomy.family && <InfoRow icon="git-branch-outline" label="科" value={def.taxonomy.family} />}
              {def.taxonomy.genus && <InfoRow icon="leaf-outline" label="属" value={def.taxonomy.genus} />}
            </View>
          )}
          {lookalikes.length > 0 ? (
            <>
              <Text style={styles.tierSubLabel}>危険な類似種との違い</Text>
              {lookalikes.map((risk) => (
                <View key={risk.name} style={styles.lookalikeCard}>
                  <View style={styles.lookalikeNameRow}>
                    <Ionicons
                      name={risk.severity === 'high_risk' ? 'skull-outline' : 'warning-outline'}
                      size={13}
                      color={Colors.dangerRed}
                    />
                    <Text style={styles.lookalikeName}>{risk.name}</Text>
                  </View>
                  <Text style={styles.lookalikeNote}>{risk.note}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.tierEmptyText}>危険な類似種は登録されていません。</Text>
          )}
          <Pressable
            style={styles.compareCta}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/scan');
            }}
          >
            <Ionicons name="camera-outline" size={15} color="#FFFFFF" />
            <Text style={styles.compareCtaText}>観察して現物と見比べる</Text>
          </Pressable>
        </ExpandableTier>

        {/* ── 深く学ぶ（v3 §8.2） ── */}
        <ExpandableTier
          icon="library-outline"
          title="深く学ぶ"
          expanded={expandedTier === 'deep'}
          onToggle={() => setExpandedTier((t) => (t === 'deep' ? null : 'deep'))}
        >
          <InfoRow icon="flask-outline" label="学名" value={plant.nameLatin} />
          {def?.taxonomy.family && <InfoRow icon="git-branch-outline" label="科" value={def.taxonomy.family} />}
          {def?.taxonomy.genus && <InfoRow icon="leaf-outline" label="属" value={def.taxonomy.genus} />}

          {plant.effects.length > 0 && (
            <>
              <Text style={styles.tierSubLabel}>伝統的な用途・言い伝え</Text>
              <View style={styles.effectTags}>
                {plant.effects.map((effect) => (
                  <Pressable
                    key={effect}
                    style={({ pressed }) => [
                      styles.effectTag,
                      pressed && styles.effectTagPressed,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/(tabs)/zukan?filterEffect=${encodeURIComponent(effect)}`);
                    }}
                  >
                    <Text style={styles.effectText}>{effect}</Text>
                    <Text style={styles.effectTagArrow}>›</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.effectsCaveat}>
                ※ 伝統的な言い伝えであり、効果・効能を保証するものではありません。医療目的での使用はしないでください。
              </Text>
            </>
          )}

          <Text style={styles.tierSubLabel}>データの確度・出典</Text>
          <Text style={styles.tierEmptyText}>
            {def?.reviewStatus === 'expert'
              ? '専門家によるレビュー済みの情報です。'
              : '編集部が一般的な植物学の知見をもとに作成した情報です（専門データベースとの連携・専門家レビューは今後の対応予定）。'}
          </Text>
          {def && def.sourceRefs.length > 0 && (
            <View style={styles.sourceRefList}>
              {def.sourceRefs.map((url) => (
                <Pressable
                  key={url}
                  style={styles.sourceRefRow}
                  onPress={() => Linking.openURL(url).catch(() => {})}
                  accessibilityRole="button"
                  accessibilityLabel={`参考資料を開く: ${sourceHostLabel(url)}`}
                >
                  <Ionicons name="open-outline" size={14} color={Colors.primaryDark} />
                  <Text style={styles.sourceRefText} numberOfLines={1}>
                    参考: {sourceHostLabel(url)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ExpandableTier>

        {/* ── 暮らし（v3 §10-§11, PR22） ── */}
        <ExpandableTier
          icon="home-outline"
          title="暮らしに活かす"
          expanded={expandedTier === 'living'}
          onToggle={() => setExpandedTier((t) => (t === 'living' ? null : 'living'))}
        >
          {!latestScan ? (
            <Text style={styles.tierEmptyText}>
              観察するとこの植物でできることが分かります。まずは観察タブから記録しましょう。
            </Text>
          ) : (
            <>
              <View style={styles.originRow}>
                <Text style={styles.tierSubLabel}>入手経路</Text>
                <Pressable style={styles.originBtn} onPress={handleSetOrigin} accessibilityRole="button">
                  <Text style={styles.originBtnText}>
                    {bestOrigin ? ORIGIN_LABEL[bestOrigin] : '入手経路を選ぶ'}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.primaryDark} />
                </Pressable>
                <Text style={styles.tierEmptyText}>現在の確認レベル: {USE_GATE_LABEL[achievedGate]}</Text>
              </View>

              {plantUses.map((use) => {
                const unlocked = isUseUnlocked(use, achievedGate, bestOrigin ?? 'unknown');
                return (
                  <View key={use.id} style={[styles.useCard, !unlocked && styles.useCardLocked]}>
                    <View style={styles.useCardHeaderRow}>
                      <Ionicons
                        name={unlocked ? 'checkmark-circle-outline' : 'lock-closed-outline'}
                        size={15}
                        color={unlocked ? Colors.primary : Colors.textMuted}
                      />
                      <Text style={styles.useCardTitle}>{use.title}</Text>
                    </View>
                    {unlocked ? (
                      <Text style={styles.useCardSummary}>{use.summary}</Text>
                    ) : isCategoryUnlocked(use.category, achievedGate) ? (
                      // Gate is already reached — it's allowedOrigins that's blocking this
                      // specific card, so telling the user to "reach a higher level" would
                      // be both wrong and unsatisfiable.
                      <Text style={styles.tierEmptyText}>
                        この用途は、選択中の入手経路「{bestOrigin ? ORIGIN_LABEL[bestOrigin] : '未選択'}」では表示できません。
                      </Text>
                    ) : (
                      <Text style={styles.tierEmptyText}>
                        この用途を見るには「{USE_GATE_LABEL[requiredGateForCategory(use.category)]}」以上の確認レベルが必要です。
                      </Text>
                    )}
                    {unlocked && use.warnings.map((w) => (
                      <Text key={w} style={styles.useCardWarning}>⚠ {w}</Text>
                    ))}
                  </View>
                );
              })}
            </>
          )}

          <Text style={styles.tierSubLabel}>実践記録</Text>
          {plantPracticeRecords.length === 0 ? (
            <Text style={styles.tierEmptyText}>まだ記録がありません。</Text>
          ) : (
            plantPracticeRecords.map((r) => (
              <View key={r.id} style={styles.practiceRow}>
                <Text style={styles.practiceNote} numberOfLines={2}>{r.note}</Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => deletePracticeRecord(r.id)}
                  accessibilityRole="button"
                  accessibilityLabel="この実践記録を削除"
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                </Pressable>
              </View>
            ))
          )}
          <View style={styles.practiceAddRow}>
            <TextInput
              style={styles.practiceInput}
              value={practiceNoteText}
              onChangeText={setPracticeNoteText}
              placeholder="何をしたか記録する（例: 押し花にしました）"
              placeholderTextColor={Colors.textMuted}
            />
            <Pressable
              style={styles.practiceAddBtn}
              onPress={handleSavePracticeRecord}
              accessibilityRole="button"
              accessibilityLabel="実践記録を追加"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </ExpandableTier>

        {/* 養生メモ */}
        <View style={styles.noteSection}>
          <View style={styles.noteTitleRow}>
            <Ionicons name="create-outline" size={15} color={Colors.primary} />
            <Text style={styles.noteSectionTitle}>養生メモ</Text>
            {savedNote.length > 0 && (
              <Pressable
                onPress={handleDeleteNote}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                accessibilityRole="button"
              >
                <Text style={styles.noteDeleteText}>削除</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            style={styles.noteInput}
            value={noteText}
            onChangeText={(t) => { setNoteText(t); setNoteSaved(false); }}
            placeholder="この植物について気づいたこと、見つけた場所、使い方のメモなど..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <View style={styles.noteFooterRow}>
            <Text style={styles.noteCharCount}>{noteText.length}/500</Text>
            <Pressable
              style={[
                styles.noteSaveBtn,
                (noteSaved || noteText === savedNote) && styles.noteSaveBtnDisabled,
              ]}
              onPress={handleSaveNote}
              disabled={noteText === savedNote}
            >
              <Text style={styles.noteSaveBtnText}>
                {noteSaved ? '✓ 保存済み' : '保存'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 関連植物 */}
        {relatedPlants.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="leaf-outline" size={15} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                同じカテゴリの今季の発見
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedPlants.map((rp) => (
                <Pressable
                  key={rp.id}
                  style={[
                    styles.relatedCard,
                    {
                      borderTopColor:
                        rp.danger === 'RED' ? '#EF9A9A' :
                        rp.danger === 'YELLOW' ? '#FFD54F' : '#81C784',
                    },
                  ]}
                  onPress={() => router.push(`/plant/${rp.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${rp.name}、${DANGER_LABEL[rp.danger]}`}
                >
                  <Text style={styles.relatedEmoji}>{rp.emoji}</Text>
                  <Text style={styles.relatedName} numberOfLines={1}>{rp.name}</Text>
                  <View
                    style={[
                      styles.relatedDangerDot,
                      {
                        backgroundColor:
                          rp.danger === 'GREEN' ? '#43A047' :
                          rp.danger === 'YELLOW' ? '#F9A825' : '#E53935',
                      },
                    ]}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Disclaimer */}
        <DisclaimerBanner />

        {/* Scan CTA */}
        <Pressable
          style={styles.scanCta}
          onPress={() => router.push('/(tabs)/scan')}
        >
          <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
          <Text style={styles.scanCtaText}>スキャンを続ける</Text>
        </Pressable>

        <View style={{ height: 32 }} />
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
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
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
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color={Colors.textSecondary} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/** A collapsible learning tier ("3分で見分ける" / "深く学ぶ", v3 §8.2). */
function ExpandableTier({
  icon,
  title,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Pressable
        style={styles.tierHeaderRow}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}（タップで${expanded ? '閉じる' : '開く'}）`}
      >
        <Ionicons name={icon} size={15} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
      </Pressable>
      {expanded && <View style={styles.tierBody}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontSize: 16, color: Colors.textMuted },

  heroWrapper: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1B5E20',
  },
  hero: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  alertBanner: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertBannerText: {
    color: '#FF8A80',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
    flex: 1,
  },
  warningBanner: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningBannerText: {
    color: '#FFE082',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
  emojiCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emoji: { fontSize: 64 },
  plantName: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  plantNameEn: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
  plantNameLatin: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    marginTop: 3,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  categoryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoIndicatorText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  favoriteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  body: { padding: 16 },
  section: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  bodyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  effectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  effectTag: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  effectTagPressed: { opacity: 0.7 },
  effectTagArrow: { fontSize: 13, color: Colors.primaryDark, marginLeft: 2, fontWeight: '700' },
  effectText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '700' },
  effectsCaveat: { marginTop: 10, fontSize: 11, lineHeight: 16, color: Colors.textMuted },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  infoIcon: { width: 20 },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 60,
  },
  infoValue: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 20 },

  quickCautionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.dangerRedBg,
  },
  quickCautionText: { flex: 1, fontSize: 12, color: Colors.dangerRed, lineHeight: 17, fontWeight: '600' },

  tierHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierBody: { marginTop: 12 },
  tierSubLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  tierEmptyText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  sourceRefList: { marginTop: 8, gap: 6 },
  sourceRefRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceRefText: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600', flexShrink: 1 },
  identPointRow: { marginBottom: 4 },
  lookalikeCard: {
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  lookalikeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  lookalikeName: { fontSize: 13, fontWeight: '800', color: Colors.dangerRed },
  lookalikeNote: { fontSize: 12, color: Colors.text, lineHeight: 18 },
  compareCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
  },
  compareCtaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  originRow: { marginBottom: 14 },
  originBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryPale,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  originBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  useCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  useCardLocked: { opacity: 0.7 },
  useCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  useCardTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },
  useCardSummary: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  useCardWarning: { fontSize: 11, color: Colors.dangerRed, marginTop: 4, lineHeight: 16 },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  practiceNote: { flex: 1, fontSize: 13, color: Colors.text },
  practiceAddRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  practiceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.text,
  },
  practiceAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rarityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rarityLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  rarityXpHint: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.rarity5,
    marginTop: 8,
  },
  scanCta: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  scanCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  warningNote: {
    backgroundColor: Colors.dangerYellowBg,
    borderColor: '#FFD54F',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  warningNoteRed: {
    backgroundColor: Colors.dangerRedBg,
    borderColor: '#EF9A9A',
  },
  warningNoteText: {
    fontSize: 13,
    color: Colors.dangerYellow,
    lineHeight: 20,
    fontWeight: '600',
  },
  warningNoteTextRed: {
    color: Colors.dangerRed,
    fontWeight: '800',
  },

  noteSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  noteSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  noteDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dangerRed,
  },
  noteInput: {
    backgroundColor: Colors.bg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
    lineHeight: 22,
  },
  noteFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  noteCharCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  noteSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  noteSaveBtnDisabled: {
    backgroundColor: Colors.border,
  },
  noteSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Discovery bar
  discoveryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  discoveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryPale,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  discoveryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // Related plants
  relatedSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  relatedCard: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    alignItems: 'center',
    width: 80,
    borderTopWidth: 3,
  },
  relatedEmoji: { fontSize: 26, marginBottom: 4 },
  relatedName: { fontSize: 10, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  relatedDangerDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
});
