import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../src/utils/haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { getPlantById, PLANTS } from '../../src/data/plants';
import { RarityStars } from '../../src/components/RarityStars';
import { DangerBadge } from '../../src/components/DangerBadge';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { Colors } from '../../src/constants/colors';
import { RARITY_XP, useGameStore } from '../../src/store/useGameStore';
import { getCurrentSeason, isPlantInSeason } from '../../src/utils/season';
import { SafetyBanner } from '../../src/components/SafetyBanner';
import { getSafetyWarnings } from '../../src/data/safety';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { scanHistory, favoritePlantIds, toggleFavorite, plantNotes, setPlantNote, discoveredPlantIds, markSafetyCardViewed } = useGameStore();

  const plant = getPlantById(id ?? '');

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

  // 関連植物（同カテゴリ & 現季節 & 発見済み & 自分以外）— plant が undefined の場合は空配列
  const currentSeason = getCurrentSeason();
  const relatedPlants = plant
    ? PLANTS.filter(
        (p) =>
          p.id !== plant.id &&
          p.category === plant.category &&
          isPlantInSeason(p.season, currentSeason) &&
          discoveredPlantIds.includes(p.id)
      ).slice(0, 6)
    : [];

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
        </View>
      )}

      {/* Body */}
      <View style={styles.body}>
        {/* Dangerous look-alike warning (data-driven safety, not colour-only) */}
        <SafetyBanner warnings={getSafetyWarnings(plant.id)} />

        {/* Description */}
        <Section icon="book-outline" title="説明">
          <Text style={styles.bodyText}>{plant.description}</Text>
        </Section>

        {/* Effects — framed as traditional lore, not medical advice */}
        {plant.effects.length > 0 && (
          <Section icon="leaf-outline" title="伝統的な用途・言い伝え">
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
          </Section>
        )}

        {/* Habitat & Season */}
        <Section icon="map-outline" title="自生環境・季節">
          <InfoRow icon="location-outline" label="生息地" value={plant.habitat} />
          <InfoRow icon="calendar-outline" label="旬の時期" value={plant.season} />
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

        {/* 養生メモ */}
        <View style={styles.noteSection}>
          <View style={styles.noteTitleRow}>
            <Ionicons name="create-outline" size={15} color={Colors.primary} />
            <Text style={styles.noteSectionTitle}>養生メモ</Text>
            {savedNote.length > 0 && (
              <Pressable onPress={handleDeleteNote} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
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
