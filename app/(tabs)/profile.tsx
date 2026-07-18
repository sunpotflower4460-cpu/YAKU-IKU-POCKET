import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS } from '../../src/data/plants';
import { useGameStore } from '../../src/store/useGameStore';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { DangerBadge } from '../../src/components/DangerBadge';
import { ShareCard } from '../../src/components/ShareCard';
import { Colors } from '../../src/constants/colors';
import { getPlayerTitle } from '../../src/utils/playerTitle';
import { XP_PER_LEVEL } from '../../src/store/useGameStore';
import { getCurrentSeason, SEASON_CONFIG } from '../../src/utils/season';
import { todayLocalStr, localDayFromISO } from '../../src/utils/date';
import { PRIVACY_POLICY_URL, TERMS_URL, APP_VERSION } from '../../src/constants/app';

// Prebuilt plantId → rarity lookup (O(1) access, static data)
const PLANT_RARITY: Record<string, number> = Object.fromEntries(
  PLANTS.map((p) => [p.id, p.rarity])
);

// Rarity index → color mapping (module-level to avoid per-render allocation)
const RARITY_COLORS = [
  Colors.rarity1,
  Colors.rarity2,
  Colors.rarity3,
  Colors.rarity4,
  Colors.rarity5,
];

interface AchievementDef {
  id: string;
  icon: string;
  label: string;
  desc: string;
  check: (ids: string[]) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_discovery',
    icon: 'leaf-outline',
    label: '初めての発見',
    desc: '初めて植物を発見した',
    check: (ids) => ids.length >= 1,
  },
  {
    id: 'ten_plants',
    icon: 'book-outline',
    label: '図鑑の始まり',
    desc: '10種類の植物を発見した',
    check: (ids) => ids.length >= 10,
  },
  {
    id: 'twenty_five',
    icon: 'ribbon-outline',
    label: '半分制覇',
    desc: '25種類の植物を発見した',
    check: (ids) => ids.length >= 25,
  },
  {
    id: 'all_fifty',
    icon: 'trophy-outline',
    label: '図鑑完成',
    desc: '全50種類の植物を発見した',
    check: (ids) => ids.length >= 50,
  },
  {
    id: 'danger_master',
    icon: 'skull-outline',
    label: '毒草の知識',
    desc: '危険（RED）植物を発見した',
    check: (ids) =>
      PLANTS.filter((p) => p.danger === 'RED').some((p) => ids.includes(p.id)),
  },
  {
    id: 'herb_collector',
    icon: 'leaf',
    label: 'ハーブ愛好家',
    desc: 'ハーブを10種類発見した',
    check: (ids) =>
      PLANTS.filter((p) => p.category === 'スパイス・ハーブ' && ids.includes(p.id))
        .length >= 10,
  },
  {
    id: 'wild_hunter',
    icon: 'compass-outline',
    label: '野草ハンター',
    desc: '野草を10種類発見した',
    check: (ids) =>
      PLANTS.filter((p) => p.category === '野草' && ids.includes(p.id)).length >= 10,
  },
  {
    id: 'rare_finder',
    icon: 'star-outline',
    label: 'レアハンター',
    desc: '★5レアを発見した',
    check: (ids) =>
      PLANTS.filter((p) => p.rarity === 5).some((p) => ids.includes(p.id)),
  },
  {
    id: 'all_categories',
    icon: 'grid-outline',
    label: 'バランス型',
    desc: '野草とハーブ両方を発見した',
    check: (ids) =>
      PLANTS.some((p) => p.category === '野草' && ids.includes(p.id)) &&
      PLANTS.some((p) => p.category === 'スパイス・ハーブ' && ids.includes(p.id)),
  },
];

function formatScanDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffH < 1) return 'たった今';
  if (diffH < 24) return `${diffH}時間前`;
  if (diffD < 7) return `${diffD}日前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { playerName, xp, discoveredPlantIds, setPlayerName, streak, getLevel, getXpForCurrentLevel, getXpToNextLevel, scanHistory } = useGameStore();
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const [shareCardVisible, setShareCardVisible] = useState(false);

  const season = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[season];

  const level = getLevel();
  const xpCurrent = getXpForCurrentLevel();
  const xpToNext = getXpToNextLevel();
  const title = getPlayerTitle(level);

  const discoveredCount = discoveredPlantIds.length;
  const totalPlants = PLANTS.length;

  const unlockedAchievements = ACHIEVEMENTS.filter((a) =>
    a.check(discoveredPlantIds)
  ).map((a) => ({ icon: a.icon, label: a.label }));
  const greenCount = PLANTS.filter(
    (p) => p.danger === 'GREEN' && discoveredPlantIds.includes(p.id)
  ).length;
  const yellowCount = PLANTS.filter(
    (p) => p.danger === 'YELLOW' && discoveredPlantIds.includes(p.id)
  ).length;
  const redCount = PLANTS.filter(
    (p) => p.danger === 'RED' && discoveredPlantIds.includes(p.id)
  ).length;
  const rarity5Count = PLANTS.filter(
    (p) => p.rarity === 5 && discoveredPlantIds.includes(p.id)
  ).length;

  const recentScans = useMemo(
    () =>
      scanHistory.slice(0, 10).flatMap((record) => {
        const plant = PLANTS.find((p) => p.id === record.plantId);
        return plant ? [{ record, plant }] : [];
      }),
    [scanHistory]
  );

  // Calendar: max rarity scanned per day (O(1) plant lookup via PLANT_RARITY map)
  const dayMaxRarity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const record of scanHistory) {
      const day = localDayFromISO(record.scannedAt);
      const rarity = PLANT_RARITY[record.plantId] ?? 1;
      if (!map[day] || rarity > map[day]) {
        map[day] = rarity;
      }
    }
    return map;
  }, [scanHistory]);

  // Calendar: current month grid cells (mm precomputed once)
  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayStr = todayLocalStr();
    const firstDow = new Date(year, month, 1).getDay();
    const startOffset = (firstDow + 6) % 7; // Mon-start
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mm = String(month + 1).padStart(2, '0');
    const cells: (number | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    return { cells, year, month, mm, todayStr };
  }, []);

  function handleSaveName() {
    if (tempName.trim().length > 0) {
      setPlayerName(tempName.trim());
    }
    setEditNameVisible(false);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Hero */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        style={styles.hero}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={64} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Name */}
        <Text style={styles.playerName} numberOfLines={1} adjustsFontSizeToFit>{playerName}</Text>
        <Text style={styles.titleText}>{title}</Text>

        {/* Edit name button */}
        <Pressable
          style={styles.editNameBtn}
          onPress={() => {
            setTempName(playerName);
            setEditNameVisible(true);
          }}
        >
          <Ionicons name="create-outline" size={14} color="#A5D6A7" />
          <Text style={styles.editNameText}>名前を変更</Text>
        </Pressable>

        {/* Level */}
        <View style={styles.levelBox}>
          <Text style={styles.levelLabel}>Level {level}</Text>
          <View style={styles.xpBarOuter}>
            <View
              style={[
                styles.xpBarInner,
                { width: `${(xpCurrent / XP_PER_LEVEL) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.xpLabel}>
            {xpCurrent} / {XP_PER_LEVEL} XP（次のレベルまで{xpToNext}XP）
          </Text>
        </View>

        {/* Streak + Share */}
        <View style={styles.heroBottomRow}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame-outline" size={16} color="#FF6F00" />
            <Text style={styles.streakText}>
              {streak > 0 ? `${streak}日連続` : '今日から開始'}
            </Text>
          </View>
          <Pressable style={styles.shareBtn} onPress={() => setShareCardVisible(true)}>
            <Ionicons name="ribbon-outline" size={14} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>実績カード</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="stats-chart-outline" size={16} color={Colors.text} />
          <Text style={styles.sectionTitle}>コレクション統計</Text>
        </View>
        <View style={styles.statsGrid}>
          <StatBox label="発見数" value={`${discoveredCount}`} unit={`/ ${PLANTS.length}`} color={Colors.primary} />
          <StatBox label="合計XP" value={String(xp)} unit="XP" color={Colors.rarity5} />
          <StatBox label="食用可能" value={String(greenCount)} unit="種" color={Colors.dangerGreen} />
          <StatBox label="要注意" value={String(yellowCount)} unit="種" color={Colors.dangerYellow} />
          <StatBox label="危険植物" value={String(redCount)} unit="種" color={Colors.dangerRed} />
          <StatBox label="★5レア" value={String(rarity5Count)} unit="種" color={Colors.rarity5} />
        </View>
      </View>

      {/* Scan Calendar */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.text} />
          <Text style={styles.sectionTitle}>スキャンカレンダー</Text>
        </View>
        <View style={styles.calendarCard}>
          <Text style={styles.calendarMonth}>
            {calendarData.year}年{calendarData.month + 1}月
          </Text>
          {/* Day of week header */}
          <View style={styles.calendarDowRow}>
            {['月', '火', '水', '木', '金', '土', '日'].map((d) => (
              <Text key={d} style={styles.calendarDow}>{d}</Text>
            ))}
          </View>
          {/* Calendar cells */}
          <View style={styles.calendarGrid}>
            {calendarData.cells.map((day, idx) => {
              if (day === null) {
                return <View key={`pad-${idx}`} style={styles.calendarCell} />;
              }
              const dd = String(day).padStart(2, '0');
              const dateStr = `${calendarData.year}-${calendarData.mm}-${dd}`;
              const isToday = dateStr === calendarData.todayStr;
              const maxRarity = dayMaxRarity[dateStr];
              const fillColor = maxRarity ? RARITY_COLORS[maxRarity - 1] : undefined;
              return (
                <View
                  key={dateStr}
                  style={[
                    styles.calendarCell,
                    styles.calendarDayCell,
                    fillColor ? { backgroundColor: fillColor } : styles.calendarDayCellEmpty,
                    isToday && !fillColor && styles.calendarDayCellToday,
                    isToday && fillColor ? { borderWidth: 2, borderColor: '#FFFFFF' } : undefined,
                  ]}
                >
                  <Text style={[
                    styles.calendarDayNum,
                    fillColor ? styles.calendarDayNumFilled : styles.calendarDayNumEmpty,
                    isToday && !fillColor && styles.calendarDayNumToday,
                  ]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
          {/* Legend */}
          <View style={styles.calendarLegend}>
            <Text style={styles.calendarLegendLabel}>レアリティ: </Text>
            {RARITY_COLORS.map((c, i) => (
              <View key={i} style={[styles.calendarLegendDot, { backgroundColor: c }]} />
            ))}
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="ribbon-outline" size={16} color={Colors.text} />
          <Text style={styles.sectionTitle}>実績バッジ</Text>
        </View>
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = ach.check(discoveredPlantIds);
            return (
              <View
                key={ach.id}
                style={[styles.achCard, !unlocked && styles.achCardLocked]}
              >
                {unlocked ? (
                  <Ionicons name={ach.icon as React.ComponentProps<typeof Ionicons>['name']} size={28} color={Colors.primary} style={styles.achIconItem} />
                ) : (
                  <Ionicons name="lock-closed-outline" size={28} color="#BDBDBD" style={styles.achIconItem} />
                )}
                <Text
                  style={[styles.achLabel, !unlocked && styles.achTextLocked]}
                  numberOfLines={2}
                >
                  {ach.label}
                </Text>
                <Text style={styles.achDesc} numberOfLines={2}>
                  {ach.desc}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Scan History */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="time-outline" size={16} color={Colors.text} />
          <Text style={styles.sectionTitle}>スキャン履歴</Text>
        </View>
        {recentScans.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>まだスキャン履歴がありません</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {recentScans.map(({ record, plant }) => (
              <HistoryRow
                key={record.id}
                record={record}
                plant={plant}
                onPress={() => router.push(`/plant/${plant.id}`)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Disclaimer */}
      <View style={styles.section}>
        <DisclaimerBanner />
      </View>

      {/* Legal / about */}
      <View style={styles.section}>
        <Pressable
          style={styles.legalRow}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
        >
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.legalRowText}>プライバシーポリシー</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
        <Pressable
          style={styles.legalRow}
          onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
        >
          <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.legalRowText}>利用規約</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
        <Text style={styles.versionText}>バージョン {APP_VERSION}</Text>
      </View>

      <View style={{ height: 32 }} />

      {/* Share Card Modal */}
      <ShareCard
        visible={shareCardVisible}
        onClose={() => setShareCardVisible(false)}
        playerName={playerName}
        title={title}
        level={level}
        xp={xp}
        discoveredCount={discoveredCount}
        totalCount={totalPlants}
        streak={streak}
        unlockedAchievements={unlockedAchievements}
        season={season}
        seasonIcon={seasonCfg.icon}
      />

      {/* Edit Name Modal */}
      <Modal
        visible={editNameVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNameVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditNameVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>名前を変更</Text>
            <TextInput
              style={styles.nameInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="名前を入力..."
              maxLength={20}
              autoFocus
              keyboardType="default"
              autoCapitalize="words"
            />
            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setEditNameVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveName}
              >
                <Text style={styles.modalBtnSaveText}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function HistoryRow({
  record,
  plant,
  onPress,
}: {
  record: { id: string; plantId: string; scannedAt: string; imageUri?: string };
  plant: { id: string; name: string; emoji: string; danger: 'GREEN' | 'YELLOW' | 'RED' };
  onPress: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const showThumb = !!record.imageUri && !imgError;
  return (
    <Pressable style={styles.historyItem} onPress={onPress}>
      {showThumb ? (
        <Image
          source={{ uri: record.imageUri }}
          style={styles.historyThumb}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Text style={styles.historyEmoji}>{plant.emoji}</Text>
      )}
      <View style={styles.historyInfo}>
        <Text style={styles.historyName}>{plant.name}</Text>
        <Text style={styles.historyTime}>{formatScanDate(record.scannedAt)}</Text>
      </View>
      <DangerBadge danger={plant.danger} size="sm" />
    </Pressable>
  );
}

function StatBox({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={[styles.statBox, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  titleText: { fontSize: 13, color: '#C8E6C9', marginTop: 4, marginBottom: 10 },
  editNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  editNameText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  levelBox: { width: '100%', gap: 6 },
  levelLabel: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  xpBarOuter: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarInner: { height: '100%', backgroundColor: '#FFEB3B', borderRadius: 6 },
  xpLabel: { fontSize: 11, color: '#C8E6C9', textAlign: 'center' },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  legalRowText: { flex: 1, fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  versionText: { marginTop: 12, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },

  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  streakText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  statValue: { fontSize: 24, fontWeight: '900', lineHeight: 28 },
  statUnit: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 3, textAlign: 'center', fontWeight: '600' },

  calendarCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  calendarMonth: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  calendarDowRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarDow: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCell: {
    borderRadius: 100,
  },
  calendarDayCellEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDayCellToday: {
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  calendarDayNum: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarDayNumFilled: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarDayNumEmpty: {
    color: Colors.textMuted,
  },
  calendarDayNumToday: {
    color: Colors.primaryDark,
    fontWeight: '900',
  },
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 4,
  },
  calendarLegendLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  calendarLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '31%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  achCardLocked: {
    backgroundColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  achIconItem: { marginBottom: 6 },
  achLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'center',
    lineHeight: 14,
  },
  achTextLocked: { color: Colors.textMuted, fontWeight: '600' },
  achDesc: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 3,
  },

  emptyHistory: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  historyList: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  historyEmoji: { fontSize: 30 },
  historyThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  historyInfo: { flex: 1 },
  historyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  historyTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: Colors.bg },
  modalBtnSave: { backgroundColor: Colors.primary },
  modalBtnCancelText: { color: Colors.textSecondary, fontWeight: '700' },
  modalBtnSaveText: { color: '#FFFFFF', fontWeight: '800' },
});
