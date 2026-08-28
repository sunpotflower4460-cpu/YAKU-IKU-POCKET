import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
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
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS, TOTAL_PLANTS } from '../../src/data/plants';
import { getPlantDefinitionById } from '../../src/data/plantDefinitions';
import { useGameStore } from '../../src/store/useGameStore';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { DangerBadge, DANGER_LABEL } from '../../src/components/DangerBadge';
import { ShareCard } from '../../src/components/ShareCard';
import { useTheme } from '../../src/theme/ThemeProvider';
import { getPlayerTitle } from '../../src/utils/playerTitle';
import { XP_PER_LEVEL } from '../../src/store/useGameStore';
import { getCurrentSeason, SEASON_CONFIG, seasonForDate } from '../../src/utils/season';
import { todayLocalStr, localDayFromISO } from '../../src/utils/date';
import { normalizeForSearch } from '../../src/utils/kana';
import { useReduceMotion } from '../../src/utils/reduceMotion';
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

type WebFocusable = {
  focus?: () => void;
  isConnected?: boolean;
};

type WebDocumentLike = {
  activeElement?: WebFocusable | null;
  body?: WebFocusable | null;
};

function getWebDocument(): WebDocumentLike | undefined {
  return (globalThis as unknown as { document?: WebDocumentLike }).document;
}

function safeSeasonForIso(iso: string): string | null {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  return seasonForDate(date);
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_discovery', icon: 'leaf-outline', label: '初めての観察', desc: '初めて植物を記録した', check: (ctx) => ctx.discoveredPlantIds.length >= 1 },
  { id: 'ten_plants', icon: 'book-outline', label: '10種類の記録', desc: '10種類の植物を記録した', check: (ctx) => ctx.discoveredPlantIds.length >= 10 },
  { id: 'twenty_five', icon: 'ribbon-outline', label: '25種類の記録', desc: '25種類の植物を記録した', check: (ctx) => ctx.discoveredPlantIds.length >= 25 },
  { id: 'all_fifty', icon: 'trophy-outline', label: '図鑑の記録達成', desc: `全${TOTAL_PLANTS}種類の植物を記録した`, check: (ctx) => ctx.discoveredPlantIds.length >= TOTAL_PLANTS },
  {
    id: 'danger_master', icon: 'shield-checkmark-outline', label: '危険植物を学ぶ', desc: '危険（RED）植物を記録した',
    check: (ctx) => PLANTS.filter((p) => p.danger === 'RED').some((p) => ctx.discoveredPlantIds.includes(p.id)),
  },
  {
    id: 'herb_collector', icon: 'leaf', label: 'ハーブの観察者', desc: 'ハーブを10種類記録した',
    check: (ctx) => PLANTS.filter((p) => p.category === 'スパイス・ハーブ' && ctx.discoveredPlantIds.includes(p.id)).length >= 10,
  },
  {
    id: 'wild_hunter', icon: 'compass-outline', label: '野草の観察者', desc: '野草を10種類記録した',
    check: (ctx) => PLANTS.filter((p) => p.category === '野草' && ctx.discoveredPlantIds.includes(p.id)).length >= 10,
  },
  {
    id: 'rare_finder', icon: 'star-outline', label: '珍しい発見', desc: '珍しさ★5の植物を記録した',
    check: (ctx) => PLANTS.filter((p) => p.rarity === 5).some((p) => ctx.discoveredPlantIds.includes(p.id)),
  },
  {
    id: 'all_categories', icon: 'grid-outline', label: '二つのフィールド', desc: '野草とハーブの両方を記録した',
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
          .filter((family): family is string => !!family)
      );
      return families.size >= 5;
    },
  },
  { id: 'note_taker', icon: 'create-outline', label: '記録上手', desc: '10件の観察メモを残した', check: (ctx) => Object.keys(ctx.plantNotes).length >= 10 },
  {
    id: 'cross_season', icon: 'sync-outline', label: '季節をまたぐ観察', desc: '同じ植物を異なる季節に観察した',
    check: (ctx) => {
      const seasonsByPlant = new Map<string, Set<string>>();
      for (const record of ctx.scanHistory) {
        const season = safeSeasonForIso(record.scannedAt);
        if (!season) continue;
        if (!seasonsByPlant.has(record.plantId)) seasonsByPlant.set(record.plantId, new Set());
        seasonsByPlant.get(record.plantId)!.add(season);
      }
      return [...seasonsByPlant.values()].some((seasons) => seasons.size >= 2);
    },
  },
  { id: 'safety_reader', icon: 'shield-checkmark-outline', label: '安全情報を読む', desc: '危険植物の安全情報を確認した', check: (ctx) => ctx.viewedSafetyCardPlantIds.length >= 1 },
  { id: 'candidate_comparer', icon: 'git-compare-outline', label: '見比べ上手', desc: '複数候補を見比べて選んだ', check: (ctx) => ctx.hasComparedCandidates },
];

function formatScanDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '日時不明';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return `${d.getMonth() + 1}/${d.getDate()}`;

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
  const reduceMotion = useReduceMotion();
  const { width, fontScale } = useWindowDimensions();
  const compactLayout = width < 380 || fontScale >= 1.3;
  const singleColumnStats = width < 340 || fontScale >= 1.6;
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
  const editNamePreviousWebFocusRef = useRef<WebFocusable | null>(null);
  const sourcesPreviousWebFocusRef = useRef<WebFocusable | null>(null);
  const sourcesTitleRef = useRef<React.ElementRef<typeof Text>>(null);
  const sourcesCloseButtonRef = useRef<React.ElementRef<typeof Pressable>>(null);

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
  const normalizedTempName = tempName.trim();
  const canSaveName = normalizedTempName.length > 0 && normalizedTempName !== playerName;

  const achievementCtx: AchievementContext = useMemo(
    () => ({ discoveredPlantIds, plantNotes, scanHistory, viewedSafetyCardPlantIds, hasComparedCandidates }),
    [discoveredPlantIds, plantNotes, scanHistory, viewedSafetyCardPlantIds, hasComparedCandidates]
  );
  const unlockedAchievements = ACHIEVEMENTS.filter((achievement) => achievement.check(achievementCtx)).map((achievement) => ({ icon: achievement.icon, label: achievement.label }));
  const greenCount = PLANTS.filter((p) => p.danger === 'GREEN' && discoveredPlantIds.includes(p.id)).length;
  const yellowCount = PLANTS.filter((p) => p.danger === 'YELLOW' && discoveredPlantIds.includes(p.id)).length;
  const redCount = PLANTS.filter((p) => p.danger === 'RED' && discoveredPlantIds.includes(p.id)).length;
  const rarity5Count = PLANTS.filter((p) => p.rarity === 5 && discoveredPlantIds.includes(p.id)).length;

  const trimmedSearch = historySearch.trim();
  const normalizedHistorySearch = normalizeForSearch(trimmedSearch);
  const allScansWithPlant = useMemo(
    () => scanHistory.flatMap((record) => {
      const plant = PLANTS.find((p) => p.id === record.plantId);
      return plant ? [{ record, plant }] : [];
    }),
    [scanHistory]
  );
  const recentScans = useMemo(() => {
    if (!normalizedHistorySearch) return allScansWithPlant.slice(0, 10);
    return allScansWithPlant.filter(
      ({ plant }) =>
        normalizeForSearch(plant.name).includes(normalizedHistorySearch) ||
        normalizeForSearch(plant.nameEn).includes(normalizedHistorySearch) ||
        normalizeForSearch(plantNotes[plant.id] ?? '').includes(normalizedHistorySearch)
    );
  }, [allScansWithPlant, normalizedHistorySearch, plantNotes]);
  const matchingUnidentified = useMemo(() => {
    if (!normalizedHistorySearch) return [];
    return unidentifiedObservations.filter((observation) =>
      normalizeForSearch(observation.note ?? '').includes(normalizedHistorySearch)
    );
  }, [unidentifiedObservations, normalizedHistorySearch]);

  const seasonCounts = useMemo(() => {
    const counts: Record<string, number> = { 春: 0, 夏: 0, 秋: 0, 冬: 0 };
    for (const record of scanHistory) {
      const seasonName = safeSeasonForIso(record.scannedAt);
      if (seasonName && seasonName in counts) counts[seasonName]++;
    }
    return counts;
  }, [scanHistory]);

  const upcomingRevisits = useMemo(() => {
    const fromScans = scanHistory
      .filter((record) => record.revisitAt)
      .map((record) => ({
        kind: 'scan' as const,
        id: record.id,
        revisitAt: record.revisitAt!,
        label: PLANTS.find((p) => p.id === record.plantId)?.name ?? '不明な植物',
        plantId: record.plantId,
      }));
    const fromUnidentified = unidentifiedObservations
      .filter((observation) => observation.revisitAt)
      .map((observation) => ({
        kind: 'unidentified' as const,
        id: observation.id,
        revisitAt: observation.revisitAt!,
        label: observation.note ? observation.note.slice(0, 20) : '未同定の観察',
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
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
    return { cells, year, month, mm, todayStr: todayKey };
  }, [todayKey]);

  useEffect(() => {
    if (!sourcesVisible) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (Platform.OS === 'web') {
      timer = setTimeout(() => {
        const target = sourcesCloseButtonRef.current as unknown as WebFocusable | null;
        target?.focus?.();
      }, 0);
    } else {
      timer = setTimeout(() => {
        const node = findNodeHandle(sourcesTitleRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, reduceMotion ? 70 : 180);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [sourcesVisible, reduceMotion]);

  function captureCurrentWebFocus(targetRef: React.MutableRefObject<WebFocusable | null>) {
    if (Platform.OS !== 'web') return;
    const doc = getWebDocument();
    const active = doc?.activeElement;
    targetRef.current = active && active !== doc?.body ? active : null;
  }

  function restoreWebFocus(targetRef: React.MutableRefObject<WebFocusable | null>) {
    if (Platform.OS !== 'web') return;
    const target = targetRef.current;
    targetRef.current = null;
    setTimeout(() => {
      if (target?.isConnected !== false) target?.focus?.();
    }, 0);
  }

  function openEditName() {
    captureCurrentWebFocus(editNamePreviousWebFocusRef);
    setTempName(playerName);
    setEditNameVisible(true);
  }

  function closeEditName() {
    setEditNameVisible(false);
    restoreWebFocus(editNamePreviousWebFocusRef);
  }

  function openSources() {
    captureCurrentWebFocus(sourcesPreviousWebFocusRef);
    setSourcesVisible(true);
  }

  function closeSources() {
    setSourcesVisible(false);
    restoreWebFocus(sourcesPreviousWebFocusRef);
  }

  function handleSaveName() {
    if (!canSaveName) return;
    setPlayerName(normalizedTempName);
    closeEditName();
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
    } catch {
      Alert.alert('観察データを共有できませんでした', '通信状態や共有先を確認して、もう一度お試しください。');
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.canvas }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={['#123F24', '#1C542C', '#2B6638']} style={[styles.hero, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.heroEyebrow}>FIELD NOTE</Text>
        <View style={styles.identityRow}>
          <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Ionicons name="person-outline" size={34} color="#FFFFFF" />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.playerName} numberOfLines={2}>{playerName}</Text>
            <Text style={styles.titleText}>{title}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.editNameBtn, pressed && styles.glassPressed]}
            onPress={openEditName}
            accessibilityRole="button"
            accessibilityLabel="名前を変更"
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          </Pressable>
        </View>

        <View style={styles.levelBox} accessible accessibilityRole="text" accessibilityLabel={`レベル${level}。次のレベルまで${xpToNext}XP`}>
          <View style={[styles.levelTitleRow, compactLayout && styles.levelTitleRowCompact]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text style={styles.levelLabel}>Level {level}</Text>
            <Text style={styles.xpLabel}>{xpCurrent} / {XP_PER_LEVEL} XP</Text>
          </View>
          <View style={styles.xpBarOuter} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[styles.xpBarInner, { width: `${Math.min((xpCurrent / XP_PER_LEVEL) * 100, 100)}%` }]} />
          </View>
        </View>

        <View style={[styles.heroBottomRow, compactLayout && styles.heroBottomRowStacked]}>
          <View
            style={[styles.streakBadge, compactLayout && styles.heroActionStacked]}
            accessible
            accessibilityRole="text"
            accessibilityLabel={streak > 0 ? `継続日数${streak}日` : '今日から記録を開始'}
          >
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.streakVisualRow}>
              <Ionicons name="calendar-outline" size={17} color="#E7F3E8" />
              <Text style={styles.streakText}>{streak > 0 ? `${streak}日継続` : '今日から'}</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, compactLayout && styles.heroActionStacked, pressed && styles.glassPressed]}
            onPress={() => setShareCardVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="観察カードを開く"
          >
            <Ionicons name="share-outline" size={17} color="#FFFFFF" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <Text style={styles.shareBtnText}>観察カード</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <Section title="観察の記録" icon="stats-chart-outline">
        <View style={styles.statsGrid}>
          <StatBox label="記録した種類" value={`${discoveredCount}`} unit={`/ ${PLANTS.length}`} color={theme.colors.accentPrimary} compact={compactLayout} singleColumn={singleColumnStats} />
          <StatBox label="合計XP" value={String(xp)} unit="XP" color={theme.colors.rarityLegendary} compact={compactLayout} singleColumn={singleColumnStats} />
          <StatBox label="一般食用区分" value={String(greenCount)} unit="種" color={theme.colors.statusObserved} compact={compactLayout} singleColumn={singleColumnStats} />
          <StatBox label="要注意" value={String(yellowCount)} unit="種" color={theme.colors.statusCaution} compact={compactLayout} singleColumn={singleColumnStats} />
          <StatBox label="危険植物" value={String(redCount)} unit="種" color={theme.colors.statusDanger} compact={compactLayout} singleColumn={singleColumnStats} />
          <StatBox label="珍しい植物" value={String(rarity5Count)} unit="種" color={theme.colors.rarityLegendary} compact={compactLayout} singleColumn={singleColumnStats} />
        </View>
      </Section>

      <Section title="観察カレンダー" icon="calendar-outline">
        <View style={[styles.calendarCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]}>
          <Text style={[styles.calendarMonth, { color: theme.colors.textPrimary }]}>{calendarData.year}年{calendarData.month + 1}月</Text>
          <View style={styles.calendarDowRow}>
            {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
              <Text key={day} maxFontSizeMultiplier={1.6} style={[styles.calendarDow, { color: theme.colors.textTertiary }]}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarData.cells.map((day, index) => {
              if (day === null) return <View key={`pad-${index}`} style={styles.calendarCell} />;
              const dd = String(day).padStart(2, '0');
              const dateStr = `${calendarData.year}-${calendarData.mm}-${dd}`;
              const isToday = dateStr === calendarData.todayStr;
              const count = dayObservationCount[dateStr] ?? 0;
              const intensityIndex = count <= 0 ? -1 : Math.min(count - 1, observationIntensity.length - 1);
              const fillColor = intensityIndex >= 0 ? observationIntensity[intensityIndex] : undefined;
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
                  <Text
                    maxFontSizeMultiplier={1.6}
                    style={[styles.calendarDayNum, { color: fillColor ? theme.colors.textOnAccent : isToday ? theme.colors.accentPrimary : theme.colors.textSecondary }]}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.calendarLegend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text maxFontSizeMultiplier={1.6} style={[styles.calendarLegendLabel, { color: theme.colors.textTertiary }]}>観察数: 少</Text>
            {observationIntensity.map((color, index) => <View key={index} style={[styles.calendarLegendDot, { backgroundColor: color }]} />)}
            <Text maxFontSizeMultiplier={1.6} style={[styles.calendarLegendLabel, { color: theme.colors.textTertiary }]}>多</Text>
          </View>
        </View>
      </Section>

      <Section title="観察の足あと" icon="ribbon-outline">
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = achievement.check(achievementCtx);
            return (
              <View
                key={achievement.id}
                style={[
                  styles.achCard,
                  compactLayout && styles.achCardCompact,
                  {
                    backgroundColor: unlocked ? theme.colors.surfaceSecondary : theme.colors.surfacePrimary,
                    borderColor: unlocked ? theme.colors.borderStrong : theme.colors.borderSubtle,
                  },
                ]}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${achievement.label}。${achievement.desc}。${unlocked ? '達成済み' : '未達成'}`}
              >
                <View
                  style={[styles.achIconWrap, { backgroundColor: unlocked ? `${theme.colors.accentPrimary}16` : theme.colors.surfaceSecondary }]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Ionicons
                    name={(unlocked ? achievement.icon : 'lock-closed-outline') as React.ComponentProps<typeof Ionicons>['name']}
                    size={24}
                    color={unlocked ? theme.colors.accentPrimary : theme.colors.textTertiary}
                  />
                </View>
                <View style={styles.achTextWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Text style={[styles.achLabel, { color: unlocked ? theme.colors.textPrimary : theme.colors.textTertiary }]}>{achievement.label}</Text>
                  <Text style={[styles.achDesc, { color: theme.colors.textSecondary }]}>{achievement.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Section>

      {scanHistory.length > 0 && (
        <Section title="季節別の観察数" icon="flower-outline">
          <View style={[styles.seasonBreakdownRow, compactLayout && styles.seasonBreakdownRowCompact]}>
            {(['春', '夏', '秋', '冬'] as const).map((seasonName) => (
              <View key={seasonName} style={[styles.seasonBreakdownCell, compactLayout && styles.seasonBreakdownCellCompact, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
                <Text style={[styles.seasonBreakdownLabel, { color: theme.colors.textSecondary }]}>{seasonName}</Text>
                <Text style={[styles.seasonBreakdownValue, { color: theme.colors.accentPrimary }]}>{seasonCounts[seasonName]}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {upcomingRevisits.length > 0 && (
        <Section title="再訪予定" icon="alarm-outline">
          <View style={[styles.historyList, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
            {upcomingRevisits.map((revisit) => (
              <View key={`${revisit.kind}_${revisit.id}`} style={[styles.revisitRow, { borderBottomColor: theme.colors.borderSubtle }]}>
                <View style={[styles.rowIconWrap, { backgroundColor: theme.colors.surfaceSecondary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Ionicons name="alarm-outline" size={17} color={theme.colors.accentPrimary} />
                </View>
                {revisit.kind === 'scan' && revisit.plantId ? (
                  <Pressable
                    style={styles.rowMainAction}
                    onPress={() => router.push(`/plant/${revisit.plantId}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${revisit.label}の図鑑詳細を開く。再訪予定 ${revisit.revisitAt}`}
                  >
                    <Text style={[styles.revisitLabel, { color: theme.colors.textPrimary }]} numberOfLines={compactLayout ? 2 : 1}>{revisit.label}</Text>
                    <Text style={[styles.revisitDate, { color: theme.colors.textTertiary }]}>{revisit.revisitAt}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.rowMainAction}>
                    <Text style={[styles.revisitLabel, { color: theme.colors.textPrimary }]} numberOfLines={compactLayout ? 2 : 1}>{revisit.label}</Text>
                    <Text style={[styles.revisitDate, { color: theme.colors.textTertiary }]}>{revisit.revisitAt}</Text>
                  </View>
                )}
                <IconButton icon="close" label="再訪予定を削除" onPress={() => revisit.kind === 'scan' ? setScanRevisit(revisit.id, undefined) : setUnidentifiedRevisit(revisit.id, undefined)} />
              </View>
            ))}
          </View>
        </Section>
      )}

      {unidentifiedObservations.length > 0 && (
        <Section title="未同定の観察" icon="help-circle-outline">
          <View style={[styles.historyList, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
            {unidentifiedObservations.slice(0, 20).map((observation) => (
              <View key={observation.id} style={[styles.historyItem, { borderBottomColor: theme.colors.borderSubtle }]}>
                <View style={[styles.historyEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Text style={styles.historyEmoji}>❔</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyName, { color: theme.colors.textPrimary }]} numberOfLines={compactLayout ? 2 : 1}>{observation.note || '未同定の植物'}</Text>
                  <Text style={[styles.historyTime, { color: theme.colors.textTertiary }]}>{formatScanDate(observation.observedAt)}</Text>
                </View>
                <IconButton
                  icon="trash-outline"
                  label="この未同定の観察記録を削除"
                  danger
                  onPress={() => Alert.alert('観察記録を削除', 'この未同定の観察記録を削除してもよいですか？', [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: '削除', style: 'destructive', onPress: () => deleteUnidentifiedObservation(observation.id) },
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
            <Ionicons name="search-outline" size={18} color={theme.colors.textTertiary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
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
            <Ionicons name="leaf-outline" size={28} color={theme.colors.textTertiary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <Text style={[styles.emptyHistoryText, { color: theme.colors.textTertiary }]}>
              {trimmedSearch ? '一致する観察記録が見つかりませんでした' : 'まだ観察履歴がありません'}
            </Text>
          </View>
        ) : (
          <View style={[styles.historyList, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
            {recentScans.map(({ record, plant }) => (
              <HistoryRow key={record.id} record={record} plant={plant} onPress={() => router.push(`/plant/${plant.id}`)} />
            ))}
            {matchingUnidentified.map((observation) => (
              <View key={observation.id} style={[styles.historyItem, { borderBottomColor: theme.colors.borderSubtle }]}>
                <View style={[styles.historyEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Text style={styles.historyEmoji}>❔</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyName, { color: theme.colors.textPrimary }]} numberOfLines={compactLayout ? 2 : 1}>{observation.note}</Text>
                  <Text style={[styles.historyTime, { color: theme.colors.textTertiary }]}>{formatScanDate(observation.observedAt)}</Text>
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
          <View style={[styles.segmentedRow, compactLayout && styles.segmentedRowStacked, { backgroundColor: theme.colors.surfaceSecondary }]} accessibilityRole="radiogroup">
            {(['system', 'light', 'dark'] as const).map((mode) => {
              const selected = themeOverride === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setThemeOverride(mode)}
                  style={({ pressed }) => [
                    styles.segmentBtn,
                    compactLayout && styles.segmentBtnStacked,
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
          <View style={[styles.settingsRowHeader, compactLayout && styles.settingsRowHeaderStacked]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingsGroupLabel, { color: theme.colors.textPrimary, marginBottom: 2 }]}>AI画像解析への同意</Text>
              <Text style={[styles.settingsMiniStatus, { color: aiConsentGiven ? theme.colors.statusVerified : theme.colors.textTertiary }]}>{aiConsentGiven ? 'オン' : 'オフ・デモモード'}</Text>
            </View>
            <Switch
              value={aiConsentGiven}
              onValueChange={setAiConsentGiven}
              trackColor={{ false: theme.colors.surfaceTertiary, true: theme.colors.accentPrimary }}
              accessibilityLabel="AI画像解析への同意"
            />
          </View>
          <Text style={[styles.settingsDesc, { color: theme.colors.textSecondary }]}>
            オンにすると、撮影した写真を外部AIサービスへ送信し植物候補の解析に使用します。オフではデモモードになり、写真は外部へ送信されません。デモ結果は図鑑・XP・履歴に反映しません。
          </Text>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
          <Text style={[styles.settingsGroupLabel, { color: theme.colors.textPrimary }]}>データ管理</Text>
          <SettingsRow icon="share-outline" label="観察データをエクスポート" onPress={handleExportData} />
          <SettingsRow icon="trash-outline" label="すべてのデータを削除" onPress={handleDeleteAllData} danger />
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle }]}>
          <SettingsRow icon="library-outline" label="データソース・出典について" onPress={openSources} />
          <SettingsRow icon="shield-checkmark-outline" label="プライバシーポリシー" onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => Alert.alert('プライバシーポリシーを開けませんでした', 'もう一度お試しください。'))} />
          <SettingsRow icon="document-text-outline" label="利用規約" onPress={() => Linking.openURL(TERMS_URL).catch(() => Alert.alert('利用規約を開けませんでした', 'もう一度お試しください。'))} />
          <SettingsRow icon="mail-outline" label="お問い合わせ" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => Alert.alert('メールアプリを開けませんでした', `お問い合わせ先: ${SUPPORT_EMAIL}`))} />
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

      <Modal visible={editNameVisible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={closeEditName}>
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeEditName} accessible={false} />
          <View
            style={[styles.modalCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]}
            accessibilityViewIsModal
            onAccessibilityEscape={closeEditName}
          >
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
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
              accessibilityLabel="名前"
              accessibilityHint={`20文字まで入力できます。残り${20 - tempName.length}文字`}
            />
            <Text
              style={[styles.nameCounter, { color: theme.colors.textTertiary }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {tempName.length}/20
            </Text>
            <View style={[styles.modalBtns, compactLayout && styles.modalBtnsStacked]}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, compactLayout && styles.modalBtnStacked, { backgroundColor: theme.colors.surfaceSecondary }, pressed && styles.buttonPressed]}
                onPress={closeEditName}
                accessibilityRole="button"
                accessibilityLabel="名前の変更をキャンセル"
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.textSecondary }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalBtn,
                  compactLayout && styles.modalBtnStacked,
                  { backgroundColor: canSaveName ? theme.colors.accentPrimary : theme.colors.surfaceTertiary },
                  pressed && canSaveName && styles.buttonPressed,
                ]}
                onPress={handleSaveName}
                disabled={!canSaveName}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSaveName }}
                accessibilityLabel="名前を保存"
              >
                <Text style={[styles.modalBtnText, { color: canSaveName ? theme.colors.textOnAccent : theme.colors.textTertiary }]}>保存</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={sourcesVisible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={closeSources}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSources} accessible={false} />
          <View
            style={[styles.modalCard, { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, shadowColor: theme.colors.shadow }]}
            accessibilityViewIsModal
            onAccessibilityEscape={closeSources}
          >
            <Text
              ref={sourcesTitleRef}
              style={[styles.modalTitle, { color: theme.colors.textPrimary }]}
              accessibilityRole="header"
            >
              データソース・出典について
            </Text>
            <ScrollView style={styles.sourcesScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sourcesText, { color: theme.colors.textSecondary }]}>
                本アプリの植物データ（科・属などの分類情報を含む）は、編集部が一般的な植物学の知見をもとに整理しています。現時点ではGBIF・POWO・iNaturalist・YListなどの公的・専門データベースと直接連携しておらず、個々の記載に外部データベースIDや出典を紐づけていません。
                {'\n\n'}
                用途に関する記述は、医学的な効果を保証するものではなく、伝統的な言い伝え・慣習的な利用として紹介しています。
                {'\n\n'}
                AI画像解析は、同意がオンの場合のみ外部AIサービスを利用します。将来的に専門データベースとの連携や専門家レビューを追加し、出典をより明確にしていく予定です。
              </Text>
            </ScrollView>
            <Pressable
              ref={sourcesCloseButtonRef}
              style={({ pressed }) => [styles.modalBtn, compactLayout && styles.modalBtnStacked, { backgroundColor: theme.colors.accentPrimary, marginTop: 16 }, pressed && styles.buttonPressed]}
              onPress={closeSources}
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
        <Ionicons name={icon} size={18} color={theme.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">{title}</Text>
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
      <Ionicons
        name={icon}
        size={18}
        color={danger ? theme.colors.statusDanger : theme.colors.textTertiary}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
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
      <Ionicons name={icon} size={18} color={color} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Text style={[styles.legalRowText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.textTertiary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
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
      accessibilityLabel={`${plant.name}。${DANGER_LABEL[plant.danger]}。${formatScanDate(record.scannedAt)}。詳細を見る`}
    >
      {showThumb ? (
        <Image
          source={{ uri: record.imageUri }}
          style={[styles.historyThumb, { backgroundColor: theme.colors.surfaceSecondary }]}
          resizeMode="cover"
          onError={() => setImgError(true)}
          accessibilityIgnoresInvertColors
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : (
        <View style={[styles.historyEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.historyEmoji}>{plant.emoji}</Text>
        </View>
      )}
      <View style={styles.historyInfo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={[styles.historyName, { color: theme.colors.textPrimary }]}>{plant.name}</Text>
        <Text style={[styles.historyTime, { color: theme.colors.textTertiary }]}>{formatScanDate(record.scannedAt)}</Text>
      </View>
      <DangerBadge danger={plant.danger} size="sm" accessible={false} />
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </Pressable>
  );
}

function StatBox({
  label,
  value,
  unit,
  color,
  compact,
  singleColumn,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  compact: boolean;
  singleColumn: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.statBox,
        compact && styles.statBoxCompact,
        singleColumn && styles.statBoxSingleColumn,
        { backgroundColor: theme.colors.surfacePrimary, borderColor: theme.colors.borderSubtle, borderTopColor: color, shadowColor: theme.colors.shadow },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label} ${value} ${unit}`}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.statVisual}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={[styles.statUnit, { color: theme.colors.textTertiary }]}>{unit}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  hero: { paddingBottom: 24, paddingHorizontal: 20 },
  heroEyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '800', letterSpacing: 1.7, color: '#E7F3E8', marginBottom: 10 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  identityText: { flex: 1, minWidth: 0 },
  playerName: { fontSize: 22, lineHeight: 28, fontWeight: '900', color: '#FFFFFF' },
  titleText: { fontSize: 13, lineHeight: 18, color: '#D9E9DA', marginTop: 2 },
  editNameBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.20)', justifyContent: 'center', alignItems: 'center' },
  levelBox: { width: '100%', marginTop: 18 },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, gap: 8 },
  levelTitleRowCompact: { flexWrap: 'wrap', alignItems: 'flex-start' },
  levelLabel: { fontSize: 14, lineHeight: 19, fontWeight: '800', color: '#FFFFFF' },
  xpLabel: { fontSize: 11, lineHeight: 15, color: '#E1EFE2', fontWeight: '600' },
  xpBarOuter: { height: 8, backgroundColor: 'rgba(255,255,255,0.17)', borderRadius: 4, overflow: 'hidden' },
  xpBarInner: { height: '100%', backgroundColor: '#E8D866', borderRadius: 4 },
  heroBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10 },
  heroBottomRowStacked: { flexDirection: 'column', alignItems: 'stretch' },
  heroActionStacked: { width: '100%', justifyContent: 'center' },
  streakBadge: { minHeight: 44, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 999, paddingHorizontal: 13 },
  streakVisualRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
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
  statVisual: { alignItems: 'center' },
  statBoxCompact: { minWidth: '46%' },
  statBoxSingleColumn: { flexBasis: '100%', minWidth: '100%' },
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
  calendarLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 4, flexWrap: 'wrap' },
  calendarLegendLabel: { fontSize: 10, lineHeight: 13, fontWeight: '600' },
  calendarLegendDot: { width: 12, height: 12, borderRadius: 6 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  achCard: { width: '48.5%', minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 11 },
  achCardCompact: { width: '100%', minHeight: 92 },
  achIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  achTextWrap: { flex: 1, minWidth: 0 },
  achLabel: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  achDesc: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  seasonBreakdownRow: { flexDirection: 'row', gap: 8 },
  seasonBreakdownRowCompact: { flexWrap: 'wrap' },
  seasonBreakdownCell: { flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 11, alignItems: 'center' },
  seasonBreakdownCellCompact: { flex: 0, width: '48.5%', minWidth: 0 },
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
  historyInfo: { flex: 1, minWidth: 0 },
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
  settingsRowHeaderStacked: { alignItems: 'flex-start', flexWrap: 'wrap' },
  settingsDesc: { fontSize: 13, lineHeight: 20 },
  segmentedRow: { flexDirection: 'row', borderRadius: 14, padding: 3, gap: 3 },
  segmentedRowStacked: { flexDirection: 'column' },
  segmentBtn: { flex: 1, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentBtnStacked: { flex: 0, width: '100%' },
  segmentBtnText: { fontSize: 13, lineHeight: 17, fontWeight: '700' },
  legalRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2, paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  legalRowText: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 19, fontWeight: '600' },
  versionText: { marginTop: 12, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 20, width: '100%', maxWidth: 440, maxHeight: '90%', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.24, shadowRadius: 20, elevation: 16 },
  modalTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800', marginBottom: 15, textAlign: 'center' },
  nameInput: { minHeight: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  nameCounter: { fontSize: 12, lineHeight: 17, textAlign: 'right', marginTop: 5, marginBottom: 12 },
  modalBtns: { flexDirection: 'row', gap: 9 },
  modalBtnsStacked: { flexDirection: 'column-reverse' },
  modalBtn: { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9 },
  modalBtnStacked: { flex: 0, width: '100%' },
  modalBtnText: { fontSize: 15, lineHeight: 20, fontWeight: '800', textAlign: 'center' },
  sourcesScroll: { maxHeight: 360 },
  sourcesText: { fontSize: 14, lineHeight: 22 },
  rowPressed: { opacity: 0.68 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
