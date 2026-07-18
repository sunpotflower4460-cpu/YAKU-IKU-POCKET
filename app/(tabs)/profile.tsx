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
  Share,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS, TOTAL_PLANTS } from '../../src/data/plants';
import { getPlantDefinitionById } from '../../src/data/plantDefinitions';
import { useGameStore } from '../../src/store/useGameStore';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { DangerBadge } from '../../src/components/DangerBadge';
import { ShareCard } from '../../src/components/ShareCard';
import { Colors } from '../../src/constants/colors';
import { getPlayerTitle } from '../../src/utils/playerTitle';
import { XP_PER_LEVEL } from '../../src/store/useGameStore';
import { getCurrentSeason, SEASON_CONFIG, seasonForDate } from '../../src/utils/season';
import { todayLocalStr, localDayFromISO } from '../../src/utils/date';
import { PRIVACY_POLICY_URL, TERMS_URL, SUPPORT_EMAIL, APP_VERSION } from '../../src/constants/app';
import { ScanRecord } from '../../src/types';

// Observation-count intensity tiers for the calendar (§7.8: "レアリティ色ではな
// く観察数または多様性" — no longer keyed to rarity).
const OBSERVATION_INTENSITY = [Colors.primaryLight, Colors.primary, Colors.primaryDark];

interface AchievementContext {
  discoveredPlantIds: string[];
  plantNotes: Record<string, string>;
  scanHistory: ScanRecord[];
  viewedSafetyCardPlantIds: string[];
  hasComparedCandidates: boolean;
}

interface AchievementDef {
  id: string;
  icon: string;
  label: string;
  desc: string;
  check: (ctx: AchievementContext) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_discovery',
    icon: 'leaf-outline',
    label: '初めての発見',
    desc: '初めて植物を発見した',
    check: (ctx) => ctx.discoveredPlantIds.length >= 1,
  },
  {
    id: 'ten_plants',
    icon: 'book-outline',
    label: '図鑑の始まり',
    desc: '10種類の植物を発見した',
    check: (ctx) => ctx.discoveredPlantIds.length >= 10,
  },
  {
    id: 'twenty_five',
    icon: 'ribbon-outline',
    label: '半分制覇',
    desc: '25種類の植物を発見した',
    check: (ctx) => ctx.discoveredPlantIds.length >= 25,
  },
  {
    id: 'all_fifty',
    icon: 'trophy-outline',
    label: '図鑑完成',
    desc: `全${TOTAL_PLANTS}種類の植物を発見した`,
    check: (ctx) => ctx.discoveredPlantIds.length >= TOTAL_PLANTS,
  },
  {
    id: 'danger_master',
    icon: 'skull-outline',
    label: '毒草の知識',
    desc: '危険（RED）植物を発見した',
    check: (ctx) =>
      PLANTS.filter((p) => p.danger === 'RED').some((p) => ctx.discoveredPlantIds.includes(p.id)),
  },
  {
    id: 'herb_collector',
    icon: 'leaf',
    label: 'ハーブ愛好家',
    desc: 'ハーブを10種類発見した',
    check: (ctx) =>
      PLANTS.filter((p) => p.category === 'スパイス・ハーブ' && ctx.discoveredPlantIds.includes(p.id))
        .length >= 10,
  },
  {
    id: 'wild_hunter',
    icon: 'compass-outline',
    label: '野草ハンター',
    desc: '野草を10種類発見した',
    check: (ctx) =>
      PLANTS.filter((p) => p.category === '野草' && ctx.discoveredPlantIds.includes(p.id)).length >= 10,
  },
  {
    id: 'rare_finder',
    icon: 'star-outline',
    label: 'レアハンター',
    desc: '★5レアを発見した',
    check: (ctx) =>
      PLANTS.filter((p) => p.rarity === 5).some((p) => ctx.discoveredPlantIds.includes(p.id)),
  },
  {
    id: 'all_categories',
    icon: 'grid-outline',
    label: 'バランス型',
    desc: '野草とハーブ両方を発見した',
    check: (ctx) =>
      PLANTS.some((p) => p.category === '野草' && ctx.discoveredPlantIds.includes(p.id)) &&
      PLANTS.some((p) => p.category === 'スパイス・ハーブ' && ctx.discoveredPlantIds.includes(p.id)),
  },
  // ── 学習系（統合仕様書§7.8: 収集数だけでなく学習系を増やす） ──
  {
    id: 'family_diversity',
    icon: 'git-branch-outline',
    label: '科の探求者',
    desc: '5つの科の植物を観察した',
    check: (ctx) => {
      const families = new Set(
        ctx.discoveredPlantIds
          .map((id) => getPlantDefinitionById(id)?.taxonomy.family)
          .filter((f): f is string => !!f)
      );
      return families.size >= 5;
    },
  },
  {
    id: 'note_taker',
    icon: 'create-outline',
    label: 'メモ魔',
    desc: '10件のメモを残した',
    check: (ctx) => Object.keys(ctx.plantNotes).length >= 10,
  },
  {
    id: 'cross_season',
    icon: 'sync-outline',
    label: '季節をまたぐ観察',
    desc: '同じ植物を異なる季節に観察した',
    check: (ctx) => {
      const seasonsByPlant = new Map<string, Set<string>>();
      for (const record of ctx.scanHistory) {
        const season = seasonForDate(new Date(record.scannedAt));
        if (!seasonsByPlant.has(record.plantId)) seasonsByPlant.set(record.plantId, new Set());
        seasonsByPlant.get(record.plantId)!.add(season);
      }
      return [...seasonsByPlant.values()].some((s) => s.size >= 2);
    },
  },
  {
    id: 'safety_reader',
    icon: 'shield-checkmark-outline',
    label: '危険植物を学ぶ',
    desc: '危険植物の安全情報を確認した',
    check: (ctx) => ctx.viewedSafetyCardPlantIds.length >= 1,
  },
  {
    id: 'candidate_comparer',
    icon: 'git-compare-outline',
    label: '見比べ上手',
    desc: '複数候補を見比べて選んだ',
    check: (ctx) => ctx.hasComparedCandidates,
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
  const {
    playerName, xp, discoveredPlantIds, setPlayerName, streak, getLevel, getXpForCurrentLevel,
    getXpToNextLevel, scanHistory, plantNotes, viewedSafetyCardPlantIds, hasComparedCandidates,
    themeOverride, setThemeOverride, aiConsentGiven, setAiConsentGiven, resetAllData,
    favoritePlantIds, unidentifiedObservations, deleteUnidentifiedObservation,
    setScanRevisit, setUnidentifiedRevisit,
  } = useGameStore();
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const [shareCardVisible, setShareCardVisible] = useState(false);
  const [sourcesVisible, setSourcesVisible] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const season = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[season];

  const level = getLevel();
  const xpCurrent = getXpForCurrentLevel();
  const xpToNext = getXpToNextLevel();
  const title = getPlayerTitle(level);

  const discoveredCount = discoveredPlantIds.length;
  const totalPlants = PLANTS.length;

  const achievementCtx: AchievementContext = useMemo(
    () => ({ discoveredPlantIds, plantNotes, scanHistory, viewedSafetyCardPlantIds, hasComparedCandidates }),
    [discoveredPlantIds, plantNotes, scanHistory, viewedSafetyCardPlantIds, hasComparedCandidates]
  );
  const unlockedAchievements = ACHIEVEMENTS.filter((a) =>
    a.check(achievementCtx)
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

  // タイムライン検索（v3 §9.3）: 「去年の春に見た黄色い花」のような自然言語
  // 解析は本環境のAIインフラでは誠実に実装できないため行わない。植物名・
  // メモ本文に対する正直な部分一致検索として提供する（PR20）。
  const trimmedSearch = historySearch.trim();
  const allScansWithPlant = useMemo(
    () =>
      scanHistory.flatMap((record) => {
        const plant = PLANTS.find((p) => p.id === record.plantId);
        return plant ? [{ record, plant }] : [];
      }),
    [scanHistory]
  );
  const recentScans = useMemo(() => {
    if (!trimmedSearch) return allScansWithPlant.slice(0, 10);
    const q = trimmedSearch.toLowerCase();
    return allScansWithPlant.filter(
      ({ plant }) =>
        plant.name.toLowerCase().includes(q) ||
        plant.nameEn.toLowerCase().includes(q) ||
        (plantNotes[plant.id] ?? '').toLowerCase().includes(q)
    );
  }, [allScansWithPlant, trimmedSearch, plantNotes]);
  const matchingUnidentified = useMemo(() => {
    if (!trimmedSearch) return [];
    const q = trimmedSearch.toLowerCase();
    return unidentifiedObservations.filter((o) => (o.note ?? '').toLowerCase().includes(q));
  }, [unidentifiedObservations, trimmedSearch]);

  // 季節別内訳（v3 §9.2「季節別」）
  const seasonCounts = useMemo(() => {
    const counts: Record<string, number> = { 春: 0, 夏: 0, 秋: 0, 冬: 0 };
    for (const record of scanHistory) {
      counts[seasonForDate(new Date(record.scannedAt))]++;
    }
    return counts;
  }, [scanHistory]);

  // 再訪予定（v3 §9.2「再訪」）: 特定済み・未特定の両方から集約し、日付昇順。
  const upcomingRevisits = useMemo(() => {
    const fromScans = scanHistory
      .filter((r) => r.revisitAt)
      .map((r) => ({
        kind: 'scan' as const,
        id: r.id,
        revisitAt: r.revisitAt!,
        label: PLANTS.find((p) => p.id === r.plantId)?.name ?? '不明な植物',
        plantId: r.plantId,
      }));
    const fromUnidentified = unidentifiedObservations
      .filter((o) => o.revisitAt)
      .map((o) => ({
        kind: 'unidentified' as const,
        id: o.id,
        revisitAt: o.revisitAt!,
        label: o.note ? o.note.slice(0, 20) : '未同定の観察',
        plantId: undefined as string | undefined,
      }));
    return [...fromScans, ...fromUnidentified].sort((a, b) => a.revisitAt.localeCompare(b.revisitAt));
  }, [scanHistory, unidentifiedObservations]);

  // Calendar: observation COUNT per day (§7.8 — not rarity-coded anymore).
  const dayObservationCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const record of scanHistory) {
      const day = localDayFromISO(record.scannedAt);
      map[day] = (map[day] ?? 0) + 1;
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

  async function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      playerName,
      xp,
      level,
      streak,
      discoveredPlantIds,
      favoritePlantIds,
      plantNotes,
      scanHistory: scanHistory.map(({ id, plantId, scannedAt, revisitAt }) => ({ id, plantId, scannedAt, revisitAt })),
      unidentifiedObservations: unidentifiedObservations.map(({ id, observedAt, note, revisitAt }) => ({
        id,
        observedAt,
        note,
        revisitAt,
      })),
    };
    try {
      await Share.share({ message: JSON.stringify(payload, null, 2) });
    } catch {
      // ユーザーによるキャンセル等。エラー表示は不要。
    }
  }

  function handleDeleteAllData() {
    Alert.alert(
      'すべてのデータを削除',
      '図鑑・XP・履歴・メモ・設定がすべて消去されます。この操作は取り消せません。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: () => resetAllData() },
      ]
    );
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
          <StatBox label="一般食用" value={String(greenCount)} unit="種" color={Colors.dangerGreen} />
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
              const count = dayObservationCount[dateStr] ?? 0;
              const intensityIdx = count <= 0 ? -1 : Math.min(count - 1, OBSERVATION_INTENSITY.length - 1);
              const fillColor = intensityIdx >= 0 ? OBSERVATION_INTENSITY[intensityIdx] : undefined;
              const a11yLabel = `${calendarData.month + 1}月${day}日${isToday ? '（今日）' : ''}、観察${count}件`;
              return (
                <View
                  key={dateStr}
                  accessibilityLabel={a11yLabel}
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
            <Text style={styles.calendarLegendLabel}>観察数: 少</Text>
            {OBSERVATION_INTENSITY.map((c, i) => (
              <View key={i} style={[styles.calendarLegendDot, { backgroundColor: c }]} />
            ))}
            <Text style={styles.calendarLegendLabel}>多</Text>
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
            const unlocked = ach.check(achievementCtx);
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

      {/* 季節別内訳（v3 §9.2「季節別」） */}
      {scanHistory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flower-outline" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>季節別の観察数</Text>
          </View>
          <View style={styles.seasonBreakdownRow}>
            {(['春', '夏', '秋', '冬'] as const).map((s) => (
              <View key={s} style={styles.seasonBreakdownCell}>
                <Text style={styles.seasonBreakdownLabel}>{s}</Text>
                <Text style={styles.seasonBreakdownValue}>{seasonCounts[s]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 再訪予定（v3 §9.2「再訪」） */}
      {upcomingRevisits.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="alarm-outline" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>再訪予定</Text>
          </View>
          <View style={styles.historyList}>
            {upcomingRevisits.map((r) => (
              <Pressable
                key={`${r.kind}_${r.id}`}
                style={styles.revisitRow}
                onPress={() => {
                  if (r.kind === 'scan' && r.plantId) router.push(`/plant/${r.plantId}`);
                }}
              >
                <Ionicons name="alarm-outline" size={16} color={Colors.primaryDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.revisitLabel} numberOfLines={1}>{r.label}</Text>
                  <Text style={styles.revisitDate}>{r.revisitAt}</Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    r.kind === 'scan' ? setScanRevisit(r.id, undefined) : setUnidentifiedRevisit(r.id, undefined)
                  }
                >
                  <Ionicons name="close-circle-outline" size={18} color={Colors.textMuted} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* 未同定の観察（v3 §6.1「そのまま記録する」の一覧・PR17で保存導線のみ実装済み） */}
      {unidentifiedObservations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="help-circle-outline" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>未同定の観察</Text>
          </View>
          <View style={styles.historyList}>
            {unidentifiedObservations.slice(0, 20).map((o) => (
              <View key={o.id} style={styles.historyItem}>
                <Text style={styles.historyEmoji}>❔</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName} numberOfLines={1}>{o.note || '未同定の植物'}</Text>
                  <Text style={styles.historyTime}>{formatScanDate(o.observedAt)}</Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    Alert.alert('観察記録を削除', 'この未同定の観察記録を削除してもよいですか？', [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: '削除', style: 'destructive', onPress: () => deleteUnidentifiedObservation(o.id) },
                    ])
                  }
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Scan History */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="time-outline" size={16} color={Colors.text} />
          <Text style={styles.sectionTitle}>スキャン履歴</Text>
        </View>
        {scanHistory.length > 0 && (
          <View style={styles.historySearchBox}>
            <Ionicons name="search-outline" size={14} color={Colors.textMuted} />
            <TextInput
              style={styles.historySearchInput}
              value={historySearch}
              onChangeText={setHistorySearch}
              placeholder="植物名やメモで検索..."
              placeholderTextColor={Colors.textMuted}
            />
            {historySearch.length > 0 && (
              <Pressable onPress={() => setHistorySearch('')} accessibilityRole="button" accessibilityLabel="検索をクリア">
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
        )}
        {recentScans.length === 0 && matchingUnidentified.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>
              {trimmedSearch ? '一致する観察記録が見つかりませんでした' : 'まだスキャン履歴がありません'}
            </Text>
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
            {matchingUnidentified.map((o) => (
              <View key={o.id} style={styles.historyItem}>
                <Text style={styles.historyEmoji}>❔</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName} numberOfLines={1}>{o.note}</Text>
                  <Text style={styles.historyTime}>{formatScanDate(o.observedAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Disclaimer */}
      <View style={styles.section}>
        <DisclaimerBanner />
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="settings-outline" size={16} color={Colors.text} />
          <Text style={styles.sectionTitle}>設定</Text>
        </View>

        {/* Appearance */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsGroupLabel}>外観</Text>
          <View style={styles.segmentedRow}>
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setThemeOverride(mode)}
                style={[styles.segmentBtn, themeOverride === mode && styles.segmentBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: themeOverride === mode }}
              >
                <Text style={[styles.segmentBtnText, themeOverride === mode && styles.segmentBtnTextActive]}>
                  {mode === 'system' ? '自動' : mode === 'light' ? 'ライト' : 'ダーク'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* AI consent */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsRowHeader}>
            <Text style={styles.settingsGroupLabel}>AI画像識別への同意</Text>
            <Switch
              value={aiConsentGiven}
              onValueChange={setAiConsentGiven}
              accessibilityLabel="AI画像識別への同意"
            />
          </View>
          <Text style={styles.settingsDesc}>
            オンにすると、撮影した写真がAnthropic社のClaude
            APIに送信され、植物の識別に使用されます。オフの場合はデモ（ランダム判定）モードで動作し、写真は外部に送信されません。デモ結果は図鑑・XP・履歴に反映されません。
          </Text>
        </View>

        {/* Data export / delete */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsGroupLabel}>データ管理</Text>
          <Pressable style={styles.legalRow} onPress={handleExportData}>
            <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.legalRowText}>データをエクスポート</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.legalRow} onPress={handleDeleteAllData}>
            <Ionicons name="trash-outline" size={16} color={Colors.dangerRed} />
            <Text style={[styles.legalRowText, { color: Colors.dangerRed }]}>すべてのデータを削除</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Sources & licenses */}
        <View style={styles.settingsCard}>
          <Pressable style={styles.legalRow} onPress={() => setSourcesVisible(true)}>
            <Ionicons name="library-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.legalRowText}>データソース・出典について</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Pressable>
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
          <Pressable
            style={styles.legalRow}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}
          >
            <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.legalRowText}>お問い合わせ</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Pressable>
          <Text style={styles.versionText}>バージョン {APP_VERSION}</Text>
        </View>
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

      {/* Sources & Licenses Modal */}
      <Modal
        visible={sourcesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSourcesVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSourcesVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>データソース・出典について</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              <Text style={styles.sourcesText}>
                本アプリの植物データ（科・属などの分類情報を含む）は、編集部が一般的な植物学の知見をもとに作成したものです（reviewStatus:
                editorial）。特定の公的データベース（GBIF・POWO・iNaturalist・YListなど）とはまだ連携しておらず、個々の記載に外部データベースIDや出典を紐づけていません。
                {'\n\n'}
                効能・用途に関する記述は、医学的な効果を保証するものではなく、伝統的な言い伝え・慣習的な利用として紹介しています。
                {'\n\n'}
                実際の識別（AI認識）にはAnthropic社のClaude
                APIを利用しています（同意した場合のみ）。将来的に専門データベースとの連携や専門家レビューを追加し、出典を明示していく予定です。
              </Text>
            </ScrollView>
            <Pressable
              style={[styles.modalBtn, styles.modalBtnSave, { marginTop: 16 }]}
              onPress={() => setSourcesVisible(false)}
            >
              <Text style={styles.modalBtnSaveText}>閉じる</Text>
            </Pressable>
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
  settingsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  settingsGroupLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  settingsRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingsDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  sourcesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
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
  seasonBreakdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  seasonBreakdownCell: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  seasonBreakdownLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  seasonBreakdownValue: { fontSize: 20, fontWeight: '900', color: Colors.primary, marginTop: 2 },
  revisitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  revisitLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  revisitDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  historySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  historySearchInput: { flex: 1, fontSize: 13, color: Colors.text },
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
