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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS, TOTAL_PLANTS } from '../../src/data/plants';
import { getPlantDefinitionById } from '../../src/data/plantDefinitions';
import { useGameStore } from '../../src/store/useGameStore';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { DangerBadge } from '../../src/components/DangerBadge';
import { ShareCard } from '../../src/components/ShareCard';
import { useTheme } from '../../src/theme/ThemeProvider';
import { getPlayerTitle } from '../../src/utils/playerTitle';
import { XP_PER_LEVEL } from '../../src/store/useGameStore';
import { getCurrentSeason, SEASON_CONFIG, seasonForDate } from '../../src/utils/season';
import { todayLocalStr, localDayFromISO } from '../../src/utils/date';
import { PRIVACY_POLICY_URL, TERMS_URL, SUPPORT_EMAIL, APP_VERSION } from '../../src/constants/app';
import { ScanRecord } from '../../src/types';

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
  { id: 'first_discovery', icon: 'leaf-outline', label: '初めての発見', desc: '初めて植物を発見した', check: (ctx) => ctx.discoveredPlantIds.length >= 1 },
  { id: 'ten_plants', icon: 'book-outline', label: '図鑑の始まり', desc: '10種類の植物を発見した', check: (ctx) => ctx.discoveredPlantIds.length >= 10 },
  { id: 'twenty_five', icon: 'ribbon-outline', label: 'コレクター見習い', desc: '25種類の植物を発見した', check: (ctx) => ctx.discoveredPlantIds.length >= 25 },
  { id: 'all_fifty', icon: 'trophy-outline', label: '図鑑完成', desc: `全${TOTAL_PLANTS}種類の植物を発見した`, check: (ctx) => ctx.discoveredPlantIds.length >= TOTAL_PLANTS },
  {
    id: 'danger_master', icon: 'skull-outline', label: '毒草の知識', desc: '危険（RED）植物を発見した',
    check: (ctx) => PLANTS.filter((p) => p.danger === 'RED').some((p) => ctx.discoveredPlantIds.includes(p.id)),
  },
  {
    id: 'herb_collector', icon: 'leaf', label: 'ハーブ愛好家', desc: 'ハーブを10種類発見した',
    check: (ctx) => PLANTS.filter((p) => p.category === 'スパイス・ハーブ' && ctx.discoveredPlantIds.includes(p.id)).length >= 10,
  },
  {
    id: 'wild_hunter', icon: 'compass-outline', label: '野草ハンター', desc: '野草を10種類発見した',
    check: (ctx) => PLANTS.filter((p) => p.category === '野草' && ctx.discoveredPlantIds.includes(p.id)).length >= 10,
  },
  {
    id: 'rare_finder', icon: 'star-outline', label: 'レアハンター', desc: '★5レアを発見した',
    check: (ctx) => PLANTS.filter((p) => p.rarity === 5).some((p) => ctx.discoveredPlantIds.includes(p.id)),
  },
  {
    id: 'all_categories', icon: 'grid-outline', label: 'バランス型', desc: '野草とハーブ両方を発見した',
    check: (ctx) =>
      PLANTS.some((p) => p.category === '野草' && ctx.discoveredPlantIds.includes(p.id)) &&
      PLANTS.some((p) => p.category === 'スパイス・ハーブ' && ctx.discoveredPlantIds.includes(p.id)),
  },
  {
    id: 'family_diversity', icon: 'git-branch-outline', label: '科の探求者', desc: '5つの科の植物を観察した',
    check: (ctx) => {
      const families = new Set(
        ctx.discoveredPlantIds
          .map((id) => getPlantDefinitionById(id)?.taxonomy.family)
          .filter((f): f is string => !!f)
      );
      return families.size >= 5;
    },
  },
  { id: 'note_taker', icon: 'create-outline', label: 'メモ魔', desc: '10件のメモを残した', check: (ctx) => Object.keys(ctx.plantNotes).length >= 10 },
  {
    id: 'cross_season', icon: 'sync-outline', label: '季節をまたぐ観察', desc: '同じ植物を異なる季節に観察した',
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
  { id: 'safety_reader', icon: 'shield-checkmark-outline', label: '危険植物を学ぶ', desc: '危険植物の安全情報を確認した', check: (ctx) => ctx.viewedSafetyCardPlantIds.length >= 1 },
  { id: 'candidate_comparer', icon: 'git-compare-outline', label: '見比べ上手', desc: '複数候補を見比べて選んだ', check: (ctx) => ctx.hasComparedCandidates },
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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
  const todayKey = todayLocalStr();
  const observationIntensity = [theme.colors.accentSecondary, theme.colors.accentPrimary, theme.colors.accentPrimaryPressed];

  const achievementCtx: AchievementContext = useMemo(
    () => ({ discoveredPlantIds, plantNotes, scanHistory, viewedSafetyCardPlantIds, hasComparedCandidates }),
    [discoveredPlantIds, plantNotes, scanHistory, viewedSafetyCardPlantIds, hasComparedCandidates]
  );
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.check(achievementCtx)).map((a) => ({ icon: a.icon, label: a.label }));
  const greenCount = PLANTS.filter((p) => p.danger === 'GREEN' && discoveredPlantIds.includes(p.id)).length;
  const yellowCount = PLANTS.filter((p) => p.danger === 'YELLOW' && discoveredPlantIds.includes(p.id)).length;
  const redCount = PLANTS.filter((p) => p.danger === 'RED' && discoveredPlantIds.includes(p.id)).length;
  const rarity5Count = PLANTS.filter((p) => p.rarity === 5 && discoveredPlantIds.includes(p.id)).length;

  const trimmedSearch = historySearch.trim();
  const allScansWithPlant = useMemo(
    () => scanHistory.flatMap((record) => {
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

  const seasonCounts = useMemo(() => {
    const counts: Record<string, number> = { 春: 0, 夏: 0, 秋: 0, 冬: 0 };
    for (const record of scanHistory) counts[seasonForDate(new Date(record.scannedAt))]++;
    return counts;
  }, [scanHistory]);

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

  const dayObservationCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const record of scanHistory) {
      const day = localDayFromISO(record.scannedAt);
      map[day] = (map[day] ?? 0) + 1;
    }
    return map;
  }, [scanHistory]);

  // Recompute from the local day key instead of relying on the tab subtree to
  // remount at midnight. This also makes date-bound UI easier to reuse later.
  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const startOffset = (firstDow + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mm = String(month + 1).padStart(2, '0');
    const cells: (number | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    return { cells, year, month, mm, todayStr: todayKey };
  }, [todayKey]);

  function handleSaveName() {
    if (tempName.trim().length > 0) setPlayerName(tempName.trim());
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
      unidentifiedObservations: unidentifiedObservations.map(({ id, observedAt, note, revisitAt }) => ({ id, observedAt, note, revisitAt })),
    };
    try {
      await Share.share({ message: JSON.stringify(payload, null, 2) });
    } catch { /* user cancellation */ }
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.canvas }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Field-note Hero */}
      <LinearGradient colors={['#174F2A', '#226B35', '#348447']} style={[styles.hero, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.heroEyebrow}>YOUR FIELD NOTE</Text>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={34} color="#FFFFFF" />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.playerName} numberOfLines={1}>{playerName}</Text>
            <Text style={styles.titleText}>{title}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.editNameBtn, pressed && styles.glassPressed]}
            onPress={() => {
              setTempName(playerName);
              setEditNameVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="名前を変更"
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.levelBox} accessible accessibilityRole="text" accessibilityLabel={`レベル${level}。次のレベルまで${xpToNext}XP`}>
          <View style={styles.levelTitleRow}>
            <Text style={styles.levelLabel}>Level {level}</Text>
            <Text style={styles.xpLabel}>{xpCurrent} / {XP_PER_LEVEL} XP</Text>
          </View>
          <View style={styles.xpBarOuter} accessibilityElementsHidden>
            <View style={[styles.xpBarInner, { width: `${Math.min((xpCurrent / XP_PER_LEVEL) * 100, 100)}%` }]} />
          </View>
        </View>

        <View style={styles.heroBottomRow}>
          <View style={styles.streakBadge} accessible accessibilityRole="text" accessibilityLabel={streak > 0 ? `${streak}日連続` : '今日から開始'}>
            <Ionicons name="flame-outline" size={17} color="#FFD28B" />
            <Text style={styles.streakText}>{streak > 0 ? `${streak}日連続` : '今日から開始'}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.glassPressed]}
            onPress={() => setShareCardVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="実績カードを開く"
          >
            <Ionicons name="ribbon-outline" size={17} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>実績カード</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <Section title="コレクション統計" icon="stats-chart-outline">
        <View style={styles.statsGrid}>
          <StatBox label="発見数" value={`${discoveredCount}`} unit={`/ ${PLANTS.length}`} color={theme.colors.accentPrimary} />
          <StatBox label="合計XP" value={String(xp)} unit="XP" color={theme.colors.rarityLegendary} />
          <StatBox label="一般食用" value={String(greenCount)} unit="種" color={theme.colors.statusObserved} />
          <StatBox label="要注意" value={String(yellowCount)} unit="種" color={theme.colors.statusCaution} />
          <StatBox label="危険植物" value={String(redCount)} unit="種" color={theme.colors.statusDanger} />
          <StatBox label="★5レア" value={String(rarity5Count)} unit="種" color={theme.colors.rarityLegendary} />
        </View>
      </Section>

      <Section title="観察カレンダー" icon="calendar-outline">
        <View style={[styles.calendarCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]}>
          <Text style={[styles.calendarMonth, { color: theme.colors.textPrimary }]}>{calendarData.year}年{calendarData.month + 1}月</Text>
          <View style={styles.calendarDowRow}>
            {['月', '火', '水', '木', '金', '土', '日'].map((d) => (
              <Text key={d} style={[styles.calendarDow, { color: theme.colors.textTertiary }]}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarData.cells.map((day, idx) => {
              if (day === null) return <View key={`pad-${idx}`} style={styles.calendarCell} />;
              const dd = String(day).padStart(2, '0');
              const dateStr = `${calendarData.year}-${calendarData.mm}-${dd}`;
              const isToday = dateStr === calendarData.todayStr;
              const count = dayObservationCount[dateStr] ?? 0;
              const intensityIdx = count <= 0 ? -1 : Math.min(count - 1, observationIntensity.length - 1);
              const fillColor = intensityIdx >= 0 ? observationIntensity[intensityIdx] : undefined;
              return (
                <View
                  key={dateStr}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`${calendarData.month + 1}月${day}日${isToday ? '、今日' : ''}。観察${count}件`}
                  style={[
                    styles.calendarCell,
                    styles.calendarDayCell,
                    fillColor ? { backgroundColor: fillColor } : undefined,
                    !fillColor && isToday ? { borderWidth: 2, borderColor: theme.colors.accentPrimary } : undefined,
                    !fillColor && !isToday ? { backgroundColor: theme.colors.surfaceSecondary } : undefined,
                    isToday && fillColor ? { borderWidth: 2, borderColor: theme.colors.textOnAccent } : undefined,
                  ]}
                >
                  <Text style={[styles.calendarDayNum, { color: fillColor ? theme.colors.textOnAccent : isToday ? theme.colors.accentPrimary : theme.colors.textSecondary }]}>{day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.calendarLegend} accessibilityElementsHidden>
            <Text style={[styles.calendarLegendLabel, { color: theme.colors.textTertiary }]}>観察数: 少</Text>
            {observationIntensity.map((c, i) => <View key={i} style={[styles.calendarLegendDot, { backgroundColor: c }]} />)}
            <Text style={[styles.calendarLegendLabel, { color: theme.colors.textTertiary }]}>多</Text>
          </View>
        </View>
      </Section>

      <Section title="実績バッジ" icon="ribbon-outline">
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = ach.check(achievementCtx);
            return (
              <View
                key={ach.id}
                style={[
                  styles.achCard,
                  {
                    backgroundColor: unlocked ? theme.colors.surfaceSecondary : theme.colors.surfacePrimary,
                    borderColor: unlocked ? theme.colors.borderStrong : theme.colors.borderSubtle,
                  },
                ]}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${ach.label}。${ach.desc}。${unlocked ? '達成済み' : '未達成'}`}
              >
                <View style={[styles.achIconWrap, { backgroundColor: unlocked ? `${theme.colors.accentPrimary}16` : theme.colors.surfaceSecondary }]}>
                  <Ionicons
                    name={(unlocked ? ach.icon : 'lock-closed-outline') as React.ComponentProps<typeof Ionicons>['name']}
                    size={24}
                    color={unlocked ? theme.colors.accentPrimary : theme.colors.textTertiary}
                  />
                </View>
                <View style={styles.achTextWrap}>
                  <Text style={[styles.achLabel, { color: unlocked ? theme.colors.textPrimary : theme.colors.textTertiary }]}>{ach.label}</Text>
                  <Text style={[styles.achDesc, { color: theme.colors.textSecondary }]}>{ach.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Section>

      {scanHistory.length > 0 && (
        <Section title="季節別の観察数" icon="flower-outline">
          <View style={styles.seasonBreakdownRow}>
            {(['春', '夏', '秋', '冬'] as const).map((s) => (
              <View key={s} style={[styles.seasonBreakdownCell, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
                <Text style={[styles.seasonBreakdownLabel, { color: theme.colors.textSecondary }]}>{s}</Text>
                <Text style={[styles.seasonBreakdownValue, { color: theme.colors.accentPrimary }]}>{seasonCounts[s]}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {upcomingRevisits.length > 0 && (
        <Section title="再訪予定" icon="alarm-outline">
          <View style={[styles.historyList, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
            {upcomingRevisits.map((r) => (
              <View key={`${r.kind}_${r.id}`} style={[styles.revisitRow, { borderBottomColor: theme.colors.borderSubtle }]}>
                <View style={[styles.rowIconWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <Ionicons name="alarm-outline" size={17} color={theme.colors.accentPrimary} />
                </View>
                {r.kind === 'scan' && r.plantId ? (
                  <Pressable
                    style={styles.rowMainAction}
                    onPress={() => router.push(`/plant/${r.plantId}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.label}の図鑑詳細を開く。再訪予定 ${r.revisitAt}`}
                  >
                    <Text style={[styles.revisitLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>{r.label}</Text>
                    <Text style={[styles.revisitDate, { color: theme.colors.textTertiary }]}>{r.revisitAt}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.rowMainAction}>
                    <Text style={[styles.revisitLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>{r.label}</Text>
                    <Text style={[styles.revisitDate, { color: theme.colors.textTertiary }]}>{r.revisitAt}</Text>
                  </View>
                )}
                <IconButton icon="close" label="再訪予定を削除" onPress={() => r.kind === 'scan' ? setScanRevisit(r.id, undefined) : setUnidentifiedRevisit(r.id, undefined)} />
              </View>
            ))}
          </View>
        </Section>
      )}

      {unidentifiedObservations.length > 0 && (
        <Section title="未同定の観察" icon="help-circle-outline">
          <View style={[styles.historyList, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
            {unidentifiedObservations.slice(0, 20).map((o) => (
              <View key={o.id} style={[styles.historyItem, { borderBottomColor: theme.colors.borderSubtle }]}>
                <View style={[styles.historyEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <Text style={styles.historyEmoji}>❔</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{o.note || '未同定の植物'}</Text>
                  <Text style={[styles.historyTime, { color: theme.colors.textTertiary }]}>{formatScanDate(o.observedAt)}</Text>
                </View>
                <IconButton
                  icon="trash-outline"
                  label="この未同定の観察記録を削除"
                  danger
                  onPress={() => Alert.alert('観察記録を削除', 'この未同定の観察記録を削除してもよいですか？', [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: '削除', style: 'destructive', onPress: () => deleteUnidentifiedObservation(o.id) },
                  ])}
                />
              </View>
            ))}
          </View>
        </Section>
      )}

      <Section title="観察履歴" icon="time-outline">
        {scanHistory.length > 0 && (
          <View style={[styles.historySearchBox, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.historySearchInput, { color: theme.colors.textPrimary }]}
              value={historySearch}
              onChangeText={setHistorySearch}
              placeholder="植物名やメモで検索"
              placeholderTextColor={theme.colors.textTertiary}
              accessibilityLabel="観察履歴を植物名やメモで検索"
            />
            {historySearch.length > 0 && (
              <IconButton icon="close" label="検索をクリア" onPress={() => setHistorySearch('')} compact />
            )}
          </View>
        )}
        {recentScans.length === 0 && matchingUnidentified.length === 0 ? (
          <View style={[styles.emptyHistory, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
            <Ionicons name="leaf-outline" size={28} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyHistoryText, { color: theme.colors.textTertiary }]}>
              {trimmedSearch ? '一致する観察記録が見つかりませんでした' : 'まだ観察履歴がありません'}
            </Text>
          </View>
        ) : (
          <View style={[styles.historyList, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
            {recentScans.map(({ record, plant }) => (
              <HistoryRow key={record.id} record={record} plant={plant} onPress={() => router.push(`/plant/${plant.id}`)} />
            ))}
            {matchingUnidentified.map((o) => (
              <View key={o.id} style={[styles.historyItem, { borderBottomColor: theme.colors.borderSubtle }]}>
                <View style={[styles.historyEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <Text style={styles.historyEmoji}>❔</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{o.note}</Text>
                  <Text style={[styles.historyTime, { color: theme.colors.textTertiary }]}>{formatScanDate(o.observedAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Section>

      <View style={styles.disclaimerSection}><DisclaimerBanner /></View>

      <Section title="設定" icon="settings-outline">
        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
          <Text style={[styles.settingsGroupLabel, { color: theme.colors.textPrimary }]}>外観</Text>
          <View style={[styles.segmentedRow, { backgroundColor: theme.colors.surfaceSecondary }]} accessibilityRole="radiogroup">
            {(['system', 'light', 'dark'] as const).map((mode) => {
              const selected = themeOverride === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setThemeOverride(mode)}
                  style={({ pressed }) => [
                    styles.segmentBtn,
                    selected && { backgroundColor: theme.colors.accentPrimary },
                    pressed && styles.rowPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={mode === 'system' ? '外観、自動' : mode === 'light' ? '外観、ライト' : '外観、ダーク'}
                >
                  <Text style={[styles.segmentBtnText, { color: selected ? theme.colors.textOnAccent : theme.colors.textSecondary }]}>
                    {mode === 'system' ? '自動' : mode === 'light' ? 'ライト' : 'ダーク'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
          <View style={styles.settingsRowHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingsGroupLabel, { color: theme.colors.textPrimary, marginBottom: 2 }]}>AI画像識別への同意</Text>
              <Text style={[styles.settingsMiniStatus, { color: aiConsentGiven ? theme.colors.statusVerified : theme.colors.textTertiary }]}>{aiConsentGiven ? 'オン' : 'オフ・デモモード'}</Text>
            </View>
            <Switch
              value={aiConsentGiven}
              onValueChange={setAiConsentGiven}
              trackColor={{ false: theme.colors.surfaceTertiary, true: theme.colors.accentPrimary }}
              accessibilityLabel="AI画像識別への同意"
            />
          </View>
          <Text style={[styles.settingsDesc, { color: theme.colors.textSecondary }]}>
            オンにすると、撮影した写真を外部AIサービスへ送信し植物候補の解析に使用します。オフではデモモードになり、写真は外部へ送信されません。デモ結果は図鑑・XP・履歴に反映しません。
          </Text>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
          <Text style={[styles.settingsGroupLabel, { color: theme.colors.textPrimary }]}>データ管理</Text>
          <SettingsRow icon="share-outline" label="データをエクスポート" onPress={handleExportData} />
          <SettingsRow icon="trash-outline" label="すべてのデータを削除" onPress={handleDeleteAllData} danger />
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
          <SettingsRow icon="library-outline" label="データソース・出典について" onPress={() => setSourcesVisible(true)} />
          <SettingsRow icon="shield-checkmark-outline" label="プライバシーポリシー" onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})} />
          <SettingsRow icon="document-text-outline" label="利用規約" onPress={() => Linking.openURL(TERMS_URL).catch(() => {})} />
          <SettingsRow icon="mail-outline" label="お問い合わせ" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})} />
          <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>バージョン {APP_VERSION}</Text>
        </View>
      </Section>

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

      <Modal visible={editNameVisible} transparent animationType="fade" onRequestClose={() => setEditNameVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditNameVisible(false)} accessibilityElementsHidden />
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]} accessibilityViewIsModal>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">名前を変更</Text>
            <TextInput
              style={[styles.nameInput, { borderColor: theme.colors.accentPrimary, color: theme.colors.textPrimary, backgroundColor: theme.colors.surfaceSecondary }]}
              value={tempName}
              onChangeText={setTempName}
              placeholder="名前を入力"
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={20}
              autoFocus
              keyboardType="default"
              autoCapitalize="words"
              accessibilityLabel="名前"
            />
            <View style={styles.modalBtns}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, { backgroundColor: theme.colors.surfaceSecondary }, pressed && styles.buttonPressed]}
                onPress={() => setEditNameVisible(false)}
                accessibilityRole="button"
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.textSecondary }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, { backgroundColor: theme.colors.accentPrimary }, pressed && styles.buttonPressed]}
                onPress={handleSaveName}
                accessibilityRole="button"
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.textOnAccent }]}>保存</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={sourcesVisible} transparent animationType="fade" onRequestClose={() => setSourcesVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSourcesVisible(false)} accessibilityElementsHidden />
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]} accessibilityViewIsModal>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">データソース・出典について</Text>
            <ScrollView style={styles.sourcesScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sourcesText, { color: theme.colors.textSecondary }]}>
                本アプリの植物データ（科・属などの分類情報を含む）は、編集部が一般的な植物学の知見をもとに作成したものです（reviewStatus: editorial）。特定の公的データベース（GBIF・POWO・iNaturalist・YListなど）とはまだ連携しておらず、個々の記載に外部データベースIDや出典を紐づけていません。
                {'\n\n'}
                効能・用途に関する記述は、医学的な効果を保証するものではなく、伝統的な言い伝え・慣習的な利用として紹介しています。
                {'\n\n'}
                AI画像識別は、同意がオンの場合のみ外部AIサービスを利用します。将来的に専門データベースとの連携や専門家レビューを追加し、出典を明示していく予定です。
              </Text>
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: theme.colors.accentPrimary, marginTop: 16 }, pressed && styles.buttonPressed]}
              onPress={() => setSourcesVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="出典情報を閉じる"
            >
              <Text style={[styles.modalBtnText, { color: theme.colors.textOnAccent }]}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  danger = false,
  compact = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
  compact?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [styles.iconButton, compact && styles.iconButtonCompact, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={danger ? theme.colors.statusDanger : theme.colors.textTertiary} />
    </Pressable>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  const color = danger ? theme.colors.statusDanger : theme.colors.textSecondary;
  return (
    <Pressable
      style={({ pressed }) => [styles.legalRow, { borderBottomColor: theme.colors.borderSubtle }, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.legalRowText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.textTertiary} />
    </Pressable>
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
  const theme = useTheme();
  const [imgError, setImgError] = useState(false);
  const showThumb = !!record.imageUri && !imgError;
  return (
    <Pressable
      style={({ pressed }) => [styles.historyItem, { borderBottomColor: theme.colors.borderSubtle }, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${plant.name}。${formatScanDate(record.scannedAt)}。詳細を見る`}
    >
      {showThumb ? (
        <Image source={{ uri: record.imageUri }} style={[styles.historyThumb, { backgroundColor: theme.colors.surfaceSecondary }]} resizeMode="cover" onError={() => setImgError(true)} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.historyEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <Text style={styles.historyEmoji}>{plant.emoji}</Text>
        </View>
      )}
      <View style={styles.historyInfo}>
        <Text style={[styles.historyName, { color: theme.colors.textPrimary }]}>{plant.name}</Text>
        <Text style={[styles.historyTime, { color: theme.colors.textTertiary }]}>{formatScanDate(record.scannedAt)}</Text>
      </View>
      <DangerBadge danger={plant.danger} size="sm" />
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
    </Pressable>
  );
}

function StatBox({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.statBox, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, borderTopColor: color, shadowColor: theme.colors.shadow }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label} ${value} ${unit}`}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statUnit, { color: theme.colors.textTertiary }]}>{unit}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  hero: { paddingBottom: 24, paddingHorizontal: 20 },
  heroEyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '800', letterSpacing: 1.7, color: 'rgba(255,255,255,0.58)', marginBottom: 10 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  identityText: { flex: 1 },
  playerName: { fontSize: 22, lineHeight: 28, fontWeight: '900', color: '#FFFFFF' },
  titleText: { fontSize: 13, lineHeight: 18, color: '#B7DDBB', marginTop: 2 },
  editNameBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.20)', justifyContent: 'center', alignItems: 'center' },
  levelBox: { width: '100%', marginTop: 18 },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  levelLabel: { fontSize: 14, lineHeight: 19, fontWeight: '800', color: '#FFFFFF' },
  xpLabel: { fontSize: 11, lineHeight: 15, color: '#CBE4CE', fontWeight: '600' },
  xpBarOuter: { height: 8, backgroundColor: 'rgba(255,255,255,0.17)', borderRadius: 4, overflow: 'hidden' },
  xpBarInner: { height: '100%', backgroundColor: '#E8D866', borderRadius: 4 },
  heroBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10 },
  streakBadge: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 999, paddingHorizontal: 13 },
  streakText: { fontSize: 13, lineHeight: 18, fontWeight: '800', color: '#FFFFFF' },
  shareBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 14 },
  shareBtnText: { fontSize: 13, lineHeight: 18, fontWeight: '800', color: '#FFFFFF' },
  glassPressed: { backgroundColor: 'rgba(255,255,255,0.22)' },

  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 11 },
  sectionTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800' },
  disclaimerSection: { paddingTop: 22 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statBox: { flex: 1, minWidth: '30%', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderTopWidth: 3, paddingVertical: 13, paddingHorizontal: 9, alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 2 },
  statValue: { fontSize: 22, lineHeight: 27, fontWeight: '900' },
  statUnit: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
  statLabel: { fontSize: 11, lineHeight: 15, marginTop: 3, textAlign: 'center', fontWeight: '600' },

  calendarCard: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 14, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 2 },
  calendarMonth: { fontSize: 14, lineHeight: 19, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  calendarDowRow: { flexDirection: 'row', marginBottom: 4 },
  calendarDow: { flex: 1, textAlign: 'center', fontSize: 11, lineHeight: 14, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2, alignItems: 'center', justifyContent: 'center' },
  calendarDayCell: { borderRadius: 100 },
  calendarDayNum: { fontSize: 11, lineHeight: 14, fontWeight: '700', textAlign: 'center' },
  calendarLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 4 },
  calendarLegendLabel: { fontSize: 10, lineHeight: 13, fontWeight: '600' },
  calendarLegendDot: { width: 12, height: 12, borderRadius: 6 },

  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  achCard: { width: '48.5%', minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 11 },
  achIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  achTextWrap: { flex: 1 },
  achLabel: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  achDesc: { fontSize: 11, lineHeight: 16, marginTop: 2 },

  seasonBreakdownRow: { flexDirection: 'row', gap: 8 },
  seasonBreakdownCell: { flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 11, alignItems: 'center' },
  seasonBreakdownLabel: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  seasonBreakdownValue: { fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 2 },

  historyList: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  revisitRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingLeft: 11, paddingRight: 4, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, gap: 9 },
  rowIconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  rowMainAction: { flex: 1, minHeight: 48, justifyContent: 'center' },
  revisitLabel: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  revisitDate: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  historySearchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingLeft: 12, paddingRight: 3, marginBottom: 10 },
  historySearchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  historyItem: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingLeft: 11, paddingRight: 4, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  historyEmojiWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  historyEmoji: { fontSize: 26 },
  historyThumb: { width: 48, height: 48, borderRadius: 14 },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  historyTime: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  iconButtonCompact: { width: 44, height: 44 },
  emptyHistory: { minHeight: 112, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 9 },
  emptyHistoryText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },

  settingsCard: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 13, marginBottom: 10 },
  settingsGroupLabel: { fontSize: 14, lineHeight: 19, fontWeight: '800', marginBottom: 10 },
  settingsMiniStatus: { fontSize: 11, lineHeight: 15, fontWeight: '700' },
  settingsRowHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  settingsDesc: { fontSize: 13, lineHeight: 20 },
  segmentedRow: { flexDirection: 'row', borderRadius: 14, padding: 3, gap: 3 },
  segmentBtn: { flex: 1, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentBtnText: { fontSize: 13, lineHeight: 17, fontWeight: '700' },
  legalRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  legalRowText: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '600' },
  versionText: { marginTop: 12, fontSize: 12, lineHeight: 16, textAlign: 'center' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 20, width: '100%', maxWidth: 440, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.24, shadowRadius: 20, elevation: 16 },
  modalTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800', marginBottom: 15, textAlign: 'center' },
  nameInput: { minHeight: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, fontSize: 16, marginBottom: 15 },
  modalBtns: { flexDirection: 'row', gap: 9 },
  modalBtn: { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  modalBtnText: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  sourcesScroll: { maxHeight: 360 },
  sourcesText: { fontSize: 14, lineHeight: 22 },

  rowPressed: { opacity: 0.68 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
