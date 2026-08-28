import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../src/utils/haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS } from '../../src/data/plants';
import { PLANT_DEFINITIONS, getPlantDefinitionById } from '../../src/data/plantDefinitions';
import { hasDangerousLookalike } from '../../src/data/safety';
import { useGameStore } from '../../src/store/useGameStore';
import { PlantCard } from '../../src/components/PlantCard';
import { RarityStars } from '../../src/components/RarityStars';
import { DangerBadge, DANGER_LABEL } from '../../src/components/DangerBadge';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { useTheme } from '../../src/theme/ThemeProvider';
import { DangerLevel, Plant, PlantCategory } from '../../src/types';
import { getCurrentSeason, SEASON_CONFIG, isPlantInSeason } from '../../src/utils/season';
import { normalizeForSearch } from '../../src/utils/kana';

type FilterDiscovered = 'all' | 'discovered' | 'undiscovered' | 'favorites' | 'noted';
type FilterDanger = 'all' | DangerLevel;
type FilterCategory = 'all' | PlantCategory;
type FilterSeason = 'all' | 'current';
type SortRarity = 'none' | 'desc' | 'asc';
type FilterRarity = 'all' | '3up' | '4up' | '5only';
type ViewMode = 'grid' | 'list' | 'family';

/** Every family present in the dataset, sorted — powers the "科で探す" filter (§7.6). */
const FAMILY_OPTIONS: string[] = Array.from(
  new Set(PLANT_DEFINITIONS.map((d) => d.taxonomy.family).filter((f): f is string => !!f))
).sort();

export default function ZukanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const { filterEffect: initialFilterEffect } = useLocalSearchParams<{ filterEffect?: string }>();
  const { discoveredPlantIds, scanHistory, favoritePlantIds, toggleFavorite, plantNotes } = useGameStore();

  // Keep cards comfortably readable across compact phones, Dynamic Type,
  // split-screen and tablets instead of forcing a dense three-column grid.
  const gridColumns = fontScale >= 1.3 ? 2 : width >= 900 ? 4 : width >= 540 ? 3 : 2;
  const gridItemWidth = Math.max(0, (width - 24) / gridColumns);

  // plantId → 最新スキャンの imageUri マップ（scanHistory は新しい順）
  const imageUriMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const record of scanHistory) {
      if (record.imageUri && !map[record.plantId]) {
        map[record.plantId] = record.imageUri;
      }
    }
    return map;
  }, [scanHistory]);

  const [hintPlant, setHintPlant] = useState<Plant | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterDiscovered, setFilterDiscovered] = useState<FilterDiscovered>('all');
  const [filterDanger, setFilterDanger] = useState<FilterDanger>('all');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterSeason, setFilterSeason] = useState<FilterSeason>('all');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [onlyLookalikeRisk, setOnlyLookalikeRisk] = useState(false);
  const [sortRarity, setSortRarity] = useState<SortRarity>('none');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const decodedInitialEffect = initialFilterEffect ? decodeURIComponent(initialFilterEffect) : null;
  const [filterEffect, setFilterEffect] = useState<string | null>(decodedInitialEffect);
  const appliedEffectParam = useRef<string | undefined>(initialFilterEffect);

  // Deep links can update params while this screen is mounted. Applying the
  // state change during render causes an extra render and can become unstable
  // under concurrent rendering; synchronize it as an effect instead.
  useEffect(() => {
    if (initialFilterEffect && initialFilterEffect !== appliedEffectParam.current) {
      appliedEffectParam.current = initialFilterEffect;
      setFilterEffect(decodeURIComponent(initialFilterEffect));
    }
  }, [initialFilterEffect]);

  const activeFilterCount = [
    filterDiscovered !== 'all',
    filterDanger !== 'all',
    filterCategory !== 'all',
    filterSeason !== 'all',
    filterFamily !== 'all',
    onlyLookalikeRisk,
    sortRarity !== 'none',
    filterRarity !== 'all',
    filterEffect !== null,
  ].filter(Boolean).length;
  const hasActiveDiscoveryQuery = search.trim().length > 0 || activeFilterCount > 0;

  function resetFilters() {
    setFilterDiscovered('all');
    setFilterDanger('all');
    setFilterCategory('all');
    setFilterSeason('all');
    setFilterFamily('all');
    setOnlyLookalikeRisk(false);
    setSortRarity('none');
    setFilterRarity('all');
    setFilterEffect(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function resetSearchAndFilters() {
    setSearch('');
    resetFilters();
  }

  function commitSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, 5));
  }

  const currentSeason = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[currentSeason];
  const seasonAccent = theme.mode === 'dark' ? theme.colors.accentPrimary : seasonCfg.color;
  const rarityColors = [
    theme.colors.rarityCommon,
    theme.colors.rarityUncommon,
    theme.colors.rarityRare,
    theme.colors.rarityEpic,
    theme.colors.rarityLegendary,
  ];

  const filtered = useMemo(() => {
    let result = PLANTS.filter((plant) => {
      const isDiscovered = discoveredPlantIds.includes(plant.id);
      const isFav = favoritePlantIds.includes(plant.id);
      const hasNote = !!plantNotes[plant.id];

      if (filterDiscovered === 'discovered' && !isDiscovered) return false;
      if (filterDiscovered === 'undiscovered' && isDiscovered) return false;
      if (filterDiscovered === 'favorites' && !isFav) return false;
      if (filterDiscovered === 'noted' && !hasNote) return false;
      if (filterDanger !== 'all' && plant.danger !== filterDanger) return false;
      if (filterCategory !== 'all' && plant.category !== filterCategory) return false;
      if (filterSeason === 'current' && !isPlantInSeason(plant.season, currentSeason)) return false;
      if (filterRarity === '3up' && plant.rarity < 3) return false;
      if (filterRarity === '4up' && plant.rarity < 4) return false;
      if (filterRarity === '5only' && plant.rarity !== 5) return false;
      if (filterEffect && !plant.effects.includes(filterEffect)) return false;
      if (filterFamily !== 'all' && getPlantDefinitionById(plant.id)?.taxonomy.family !== filterFamily) return false;
      if (onlyLookalikeRisk && !hasDangerousLookalike(plant.id)) return false;

      // Undiscovered names are hidden, so search can only match discovered
      // plants. Kana-normalized so hiragana and katakana match each other.
      if (search) {
        if (!isDiscovered) return false;
        const q = normalizeForSearch(search);
        if (
          !normalizeForSearch(plant.name).includes(q) &&
          !normalizeForSearch(plant.nameEn).includes(q) &&
          !normalizeForSearch(plant.nameLatin).includes(q)
        ) return false;
      }
      return true;
    });

    if (sortRarity === 'desc') result = [...result].sort((a, b) => b.rarity - a.rarity);
    else if (sortRarity === 'asc') result = [...result].sort((a, b) => a.rarity - b.rarity);
    return result;
  }, [
    discoveredPlantIds, favoritePlantIds, plantNotes, filterDiscovered, filterDanger,
    filterCategory, filterSeason, filterFamily, onlyLookalikeRisk, sortRarity,
    filterRarity, filterEffect, search, currentSeason,
  ]);

  const familySections = useMemo(() => {
    if (viewMode !== 'family') return [];
    const byFamily = new Map<string, Plant[]>();
    for (const plant of filtered) {
      const family = getPlantDefinitionById(plant.id)?.taxonomy.family ?? 'その他';
      if (!byFamily.has(family)) byFamily.set(family, []);
      byFamily.get(family)!.push(plant);
    }
    return Array.from(byFamily.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'ja'))
      .map(([title, data]) => ({ title, data }));
  }, [filtered, viewMode]);

  const discoveredCount = discoveredPlantIds.length;
  const statsGreen  = PLANTS.filter(p => p.danger === 'GREEN'  && discoveredPlantIds.includes(p.id)).length;
  const statsYellow = PLANTS.filter(p => p.danger === 'YELLOW' && discoveredPlantIds.includes(p.id)).length;
  const statsRed    = PLANTS.filter(p => p.danger === 'RED'    && discoveredPlantIds.includes(p.id)).length;
  const statsWild   = PLANTS.filter(p => p.category === '野草' && discoveredPlantIds.includes(p.id)).length;
  const statsHerb   = PLANTS.filter(p => p.category === 'スパイス・ハーブ' && discoveredPlantIds.includes(p.id)).length;

  function handlePlantPress(item: Plant) {
    if (discoveredPlantIds.includes(item.id)) {
      router.push(`/plant/${item.id}`);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHintPlant(item);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="leaf-outline" size={20} color="#FFFFFF" />
          <Text style={styles.headerTitle}>薬草図鑑</Text>
        </View>
        <Text style={styles.headerSub}>{discoveredCount}/{PLANTS.length} 種類発見</Text>

        {/* Rarity completion bars */}
        <View style={styles.rarityRow}>
          {([1, 2, 3, 4, 5] as const).map((rarity) => {
            const rarityColor = rarityColors[rarity - 1];
            const total = PLANTS.filter((p) => p.rarity === rarity).length;
            const found = PLANTS.filter((p) => p.rarity === rarity && discoveredPlantIds.includes(p.id)).length;
            const pct = total > 0 ? found / total : 0;
            return (
              <View
                key={rarity}
                style={styles.rarityItem}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`珍しさ5段階中${rarity}、${total}種類中${found}種類を発見`}
              >
                <View style={styles.rarityStarsRow} accessibilityElementsHidden>
                  {Array.from({ length: rarity }, (_, i) => (
                    <Ionicons key={i} name="star" size={9} color={rarityColor} />
                  ))}
                </View>
                <View style={styles.rarityMiniBar} accessibilityElementsHidden>
                  <View style={[styles.rarityMiniFill, { width: `${pct * 100}%`, backgroundColor: rarityColor }]} />
                </View>
                <Text style={styles.rarityCount}>{found}/{total}</Text>
              </View>
            );
          })}
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.68)" />
          <TextInput
            style={styles.searchInput}
            placeholder="発見済みの植物を検索"
            placeholderTextColor="rgba(255,255,255,0.58)"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => commitSearch(search)}
            returnKeyType="search"
            accessibilityLabel="発見済みの植物を検索。和名、英名、学名に対応"
          />
          {search.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.searchClearBtn, pressed && styles.headerPressed]}
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="検索文字をクリア"
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {/* Recent searches */}
        {search.length === 0 && recentSearches.length > 0 && (
          <View style={styles.recentSearchRow}>
            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.72)" />
            {recentSearches.map((q) => (
              <Pressable
                key={q}
                style={({ pressed }) => [styles.recentSearchChip, pressed && styles.headerPressed]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSearch(q);
                }}
                accessibilityRole="button"
                accessibilityLabel={`最近の検索 ${q}`}
              >
                <Text style={styles.recentSearchChipText} numberOfLines={1}>{q}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Observation statistics */}
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: theme.colors.surfacePrimary, borderBottomColor: theme.colors.borderSubtle },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.statsToggleRow, pressed && styles.rowPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setStatsOpen(v => !v);
          }}
          accessibilityRole="button"
          accessibilityLabel="観察の内訳"
          accessibilityState={{ expanded: statsOpen }}
        >
          <Ionicons name="stats-chart-outline" size={17} color={theme.colors.accentPrimary} />
          <Text style={[styles.statsToggleText, { color: theme.colors.textPrimary }]}>観察の内訳</Text>
          <Ionicons name={statsOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textTertiary} />
        </Pressable>
        {statsOpen && (
          <View style={styles.statsGrid}>
            <StatMini label="一般食用" value={`${statsGreen}`} color={theme.colors.statusObserved} />
            <StatMini label="要注意" value={`${statsYellow}`} color={theme.colors.statusCaution} />
            <StatMini label="危険" value={`${statsRed}`} color={theme.colors.statusDanger} />
            <StatMini label="野草" value={`${statsWild}/${PLANTS.filter(p => p.category === '野草').length}`} color={theme.colors.accentPrimary} />
            <StatMini label="ハーブ" value={`${statsHerb}/${PLANTS.filter(p => p.category === 'スパイス・ハーブ').length}`} color={theme.colors.rarityLegendary} />
            {([1,2,3,4,5] as const).map(r => {
              const total = PLANTS.filter(p => p.rarity === r).length;
              const found = PLANTS.filter(p => p.rarity === r && discoveredPlantIds.includes(p.id)).length;
              return <StatMini key={r} label={`珍しさ ${r}`} value={`${found}/${total}`} color={rarityColors[r-1]} />;
            })}
          </View>
        )}
      </View>

      {/* Filters */}
      <View
        style={[
          styles.filtersContainer,
          { backgroundColor: theme.colors.surfacePrimary, borderBottomColor: theme.colors.borderSubtle },
        ]}
      >
        <View style={styles.filterToggleRow}>
          <Pressable
            style={({ pressed }) => [styles.filterToggleBtn, pressed && styles.rowPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFiltersOpen((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityLabel="フィルター"
            accessibilityState={{ expanded: filtersOpen }}
          >
            <Ionicons name="options-outline" size={17} color={theme.colors.accentPrimary} />
            <Text style={[styles.filterToggleText, { color: theme.colors.textPrimary }]}>フィルター</Text>
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: theme.colors.accentPrimary }]}>
                <Text style={[styles.filterBadgeText, { color: theme.colors.textOnAccent }]}>{activeFilterCount}</Text>
              </View>
            )}
            <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textTertiary} />
          </Pressable>
          {activeFilterCount > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.filterResetBtn,
                { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
                pressed && styles.rowPressed,
              ]}
              onPress={resetFilters}
              accessibilityRole="button"
              accessibilityLabel="すべてのフィルターをリセット"
            >
              <Text style={[styles.filterResetText, { color: theme.colors.textSecondary }]}>リセット</Text>
            </Pressable>
          )}
        </View>

        {filtersOpen && (
          <View style={styles.filterPanel}>
            <FilterRow label="状態">
              {([
                ['all', 'すべて'],
                ['discovered', '発見済み'],
                ['undiscovered', '未発見'],
                ['favorites', 'お気に入り'],
                ['noted', 'メモあり'],
              ] as [FilterDiscovered, string][]).map(([val, label]) => (
                <FilterChip
                  key={val}
                  label={label}
                  active={filterDiscovered === val}
                  onPress={() => setFilterDiscovered(val)}
                  activeColor={val === 'favorites' ? '#C03568' : val === 'noted' ? '#795548' : theme.colors.accentPrimary}
                />
              ))}
            </FilterRow>

            <FilterRow label="危険度">
              {([
                ['all', 'すべて'],
                ['GREEN', '一般食用'],
                ['YELLOW', '要注意'],
                ['RED', '危険・有毒'],
              ] as [FilterDanger, string][]).map(([val, label]) => (
                <FilterChip
                  key={val}
                  label={label}
                  active={filterDanger === val}
                  onPress={() => setFilterDanger(val)}
                  activeColor={
                    val === 'RED' ? theme.colors.statusDanger :
                    val === 'YELLOW' ? theme.colors.statusCaution :
                    val === 'GREEN' ? theme.colors.statusObserved : theme.colors.accentPrimary
                  }
                />
              ))}
            </FilterRow>

            <FilterRow label="種類">
              {([
                ['all', 'すべて'],
                ['野草', '野草'],
                ['スパイス・ハーブ', 'ハーブ'],
              ] as [FilterCategory, string][]).map(([val, label]) => (
                <FilterChip
                  key={val}
                  label={label}
                  active={filterCategory === val}
                  onPress={() => setFilterCategory(val)}
                  activeColor={theme.colors.rarityLegendary}
                />
              ))}
            </FilterRow>

            <FilterRow label="季節">
              <FilterChip label="すべて" active={filterSeason === 'all'} onPress={() => setFilterSeason('all')} activeColor={theme.colors.accentPrimary} />
              <FilterChip label={`${currentSeason}の季節`} active={filterSeason === 'current'} onPress={() => setFilterSeason('current')} activeColor={seasonAccent} />
            </FilterRow>

            <FilterRow label="科">
              <FilterChip label="すべて" active={filterFamily === 'all'} onPress={() => setFilterFamily('all')} activeColor={theme.colors.accentPrimary} />
              {FAMILY_OPTIONS.map((family) => (
                <FilterChip key={family} label={family.split(' ')[0]} active={filterFamily === family} onPress={() => setFilterFamily(family)} activeColor={theme.colors.rarityEpic} />
              ))}
            </FilterRow>

            <FilterRow label="注意">
              <FilterChip label="危険な類似植物あり" active={onlyLookalikeRisk} onPress={() => setOnlyLookalikeRisk((v) => !v)} activeColor={theme.colors.statusDanger} />
            </FilterRow>

            <FilterRow label="並び順">
              <FilterChip label="デフォルト" active={sortRarity === 'none'} onPress={() => setSortRarity('none')} activeColor={theme.colors.accentPrimary} />
              <FilterChip label="珍しい順" active={sortRarity === 'desc'} onPress={() => setSortRarity('desc')} activeColor={theme.colors.rarityLegendary} />
              <FilterChip label="見つけやすい順" active={sortRarity === 'asc'} onPress={() => setSortRarity('asc')} activeColor={theme.colors.rarityCommon} />
            </FilterRow>

            <FilterRow label="珍しさ">
              {([
                ['all', 'すべて'],
                ['3up', 'やや珍しい以上'],
                ['4up', '珍しい以上'],
                ['5only', 'とても珍しい'],
              ] as [FilterRarity, string][]).map(([val, label]) => (
                <FilterChip key={val} label={label} active={filterRarity === val} onPress={() => setFilterRarity(val)} activeColor={theme.colors.rarityLegendary} />
              ))}
            </FilterRow>
          </View>
        )}
      </View>

      {/* Count + view mode */}
      <View style={styles.countRow}>
        <Text
          style={[styles.countText, { color: theme.colors.textTertiary }]}
          accessibilityLiveRegion="polite"
        >
          {filtered.length}種類を表示
        </Text>
        <View
          style={[
            styles.viewModeRow,
            { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
          ]}
          accessibilityRole="tablist"
        >
          <ViewModeBtn icon="grid-outline" active={viewMode === 'grid'} onPress={() => setViewMode('grid')} label="グリッド" />
          <ViewModeBtn icon="list-outline" active={viewMode === 'list'} onPress={() => setViewMode('list')} label="リスト" />
          <ViewModeBtn icon="git-branch-outline" active={viewMode === 'family'} onPress={() => setViewMode('family')} label="科でまとめる" />
        </View>
      </View>

      {/* Active effect filter chip */}
      {filterEffect && (
        <View style={styles.activeEffectRow}>
          <Ionicons name="medical-outline" size={15} color={theme.colors.accentPrimary} />
          <Text style={[styles.activeEffectLabel, { color: theme.colors.textSecondary }]}>用途:</Text>
          <View
            style={[
              styles.activeEffectChip,
              { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
            ]}
          >
            <Text style={[styles.activeEffectText, { color: theme.colors.textPrimary }]}>{filterEffect}</Text>
            <Pressable
              style={({ pressed }) => [styles.activeEffectClose, pressed && styles.rowPressed]}
              onPress={() => {
                setFilterEffect(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              accessibilityRole="button"
              accessibilityLabel="用途フィルターを解除"
            >
              <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Hint Modal — undiscovered plant clue */}
      <Modal
        visible={hintPlant !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setHintPlant(null)}
      >
        <View style={[styles.hintOverlay, { backgroundColor: theme.colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setHintPlant(null)} accessible={false} />
          <View
            style={[
              styles.hintCard,
              {
                backgroundColor: theme.colors.surfacePrimary,
                shadowColor: theme.colors.shadow,
                paddingBottom: Math.max(insets.bottom + 20, 32),
              },
            ]}
            accessibilityViewIsModal
            onAccessibilityEscape={() => setHintPlant(null)}
          >
            {hintPlant && (
              <>
                <View style={styles.hintHandle} accessibilityElementsHidden />
                <ScrollView
                  style={styles.hintScroll}
                  contentContainerStyle={styles.hintScrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <View style={styles.hintTitleRow}>
                    <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
                    <Text style={[styles.hintTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">
                      未発見の植物のヒント
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.hintMystery,
                      { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderStrong },
                    ]}
                    accessibilityElementsHidden
                  >
                    <Text style={[styles.hintQuestion, { color: theme.colors.textTertiary }]}>？</Text>
                  </View>

                  <View style={[styles.hintRows, { backgroundColor: theme.colors.surfaceSecondary }]}>
                    {getPlantDefinitionById(hintPlant.id)?.taxonomy.family && (
                      <HintRow icon="git-branch-outline" label="科" value={getPlantDefinitionById(hintPlant.id)!.taxonomy.family!} />
                    )}
                    <HintRow icon="calendar-outline" label="旬の時期" value={hintPlant.season} />
                    <HintRow icon="folder-outline" label="カテゴリ" value={hintPlant.category === '野草' ? '野草' : 'スパイス・ハーブ'} />
                    <HintRow icon="warning-outline" label="危険度" value={DANGER_LABEL[hintPlant.danger]} />
                    <View style={[styles.hintRowItem, { borderBottomColor: theme.colors.borderSubtle }]}>
                      <View style={styles.hintLabelRow}>
                        <Ionicons name="star-outline" size={14} color={theme.colors.textTertiary} />
                        <Text style={[styles.hintLabel, { color: theme.colors.textSecondary }]}>珍しさ</Text>
                      </View>
                      <RarityStars rarity={hintPlant.rarity} size="sm" />
                    </View>
                  </View>

                  <View style={styles.hintFooterRow}>
                    <Ionicons name="camera-outline" size={16} color={theme.colors.accentPrimary} />
                    <Text style={[styles.hintFooter, { color: theme.colors.textSecondary }]}>観察して正体を確かめよう</Text>
                  </View>
                </ScrollView>

                <Pressable
                  style={({ pressed }) => [
                    styles.hintCloseBtn,
                    { backgroundColor: theme.colors.accentPrimary },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setHintPlant(null)}
                  accessibilityRole="button"
                  accessibilityLabel="ヒントを閉じる"
                >
                  <Text style={[styles.hintCloseBtnText, { color: theme.colors.textOnAccent }]}>閉じる</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Results */}
      {viewMode === 'family' ? (
        <SectionList
          sections={familySections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }) => (
            <View style={[styles.familySectionHeader, { backgroundColor: theme.colors.canvas }]}>
              <Text style={[styles.familySectionTitle, { color: theme.colors.textPrimary }]}>{section.title}</Text>
              <Text style={[styles.familySectionCount, { color: theme.colors.textTertiary }]}>{section.data.length}種</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <PlantListRow
              plant={item}
              discovered={discoveredPlantIds.includes(item.id)}
              isFavorite={favoritePlantIds.includes(item.id)}
              onPress={() => handlePlantPress(item)}
            />
          )}
          ListEmptyComponent={<EmptyState canReset={hasActiveDiscoveryQuery} onReset={resetSearchAndFilters} />}
          ListFooterComponent={<View style={styles.footerPad}><DisclaimerBanner compact /></View>}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'list' ? 1 : gridColumns}
          key={`${viewMode}-${gridColumns}`}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          windowSize={10}
          renderItem={({ item }) =>
            viewMode === 'list' ? (
              <PlantListRow
                plant={item}
                discovered={discoveredPlantIds.includes(item.id)}
                isFavorite={favoritePlantIds.includes(item.id)}
                onPress={() => handlePlantPress(item)}
              />
            ) : (
              <View style={{ width: gridItemWidth }}>
                <PlantCard
                  plant={item}
                  discovered={discoveredPlantIds.includes(item.id)}
                  imageUri={imageUriMap[item.id]}
                  isFavorite={favoritePlantIds.includes(item.id)}
                  hasNote={!!plantNotes[item.id]}
                  familyHint={getPlantDefinitionById(item.id)?.taxonomy.family}
                  onPress={() => handlePlantPress(item)}
                  onFavorite={() => toggleFavorite(item.id)}
                />
              </View>
            )
          }
          ListEmptyComponent={<EmptyState canReset={hasActiveDiscoveryQuery} onReset={resetSearchAndFilters} />}
          ListFooterComponent={<View style={styles.footerPad}><DisclaimerBanner compact /></View>}
        />
      )}
    </View>
  );
}

function EmptyState({ canReset, onReset }: { canReset: boolean; onReset: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
        <Ionicons name="leaf-outline" size={30} color={theme.colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>条件に一致する植物がありません</Text>
      <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>検索語やフィルターを少し広げてみてください。</Text>
      {canReset && (
        <Pressable
          style={({ pressed }) => [
            styles.emptyResetBtn,
            { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle },
            pressed && styles.rowPressed,
          ]}
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="検索とフィルターをすべて解除"
        >
          <Ionicons name="refresh-outline" size={17} color={theme.colors.accentPrimary} />
          <Text style={[styles.emptyResetText, { color: theme.colors.accentPrimary }]}>条件をすべて解除</Text>
        </Pressable>
      )}
    </View>
  );
}

function ViewModeBtn({
  icon,
  active,
  onPress,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.viewModeBtn,
        active && { backgroundColor: theme.colors.accentPrimary },
        pressed && styles.rowPressed,
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityLabel={`表示切替: ${label}`}
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={17} color={active ? theme.colors.textOnAccent : theme.colors.textTertiary} />
    </Pressable>
  );
}

/** Compact row used by the "リスト" and "科でまとめる" view modes (§7.6). */
function PlantListRow({
  plant,
  discovered,
  isFavorite,
  onPress,
}: {
  plant: Plant;
  discovered: boolean;
  isFavorite: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const family = getPlantDefinitionById(plant.id)?.taxonomy.family;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.listRow,
        {
          backgroundColor: theme.colors.surfacePrimary,
          borderColor: theme.colors.borderSubtle,
        },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={discovered ? `${plant.name}。${DANGER_LABEL[plant.danger]}。詳細を見る` : `未発見の植物。${family ?? 'ヒントなし'}。ヒントを見る`}
    >
      <View style={[styles.listEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
        <Text style={styles.listEmoji}>{discovered ? plant.emoji : '？'}</Text>
      </View>
      <View style={styles.listInfo}>
        <Text style={[styles.listName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {discovered ? plant.name : '？？？'}
        </Text>
        <Text style={[styles.listSub, { color: theme.colors.textTertiary }]} numberOfLines={1}>
          {discovered ? plant.nameLatin : (family ?? '未発見')}
        </Text>
      </View>
      <RarityStars rarity={plant.rarity} size="sm" />
      {discovered && <DangerBadge danger={plant.danger} size="sm" />}
      {discovered && isFavorite && <Ionicons name="heart" size={16} color="#D9363E" />}
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
    </Pressable>
  );
}

function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.statMiniCard, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label} ${value}`}
    >
      <View style={[styles.statMiniDot, { backgroundColor: color }]} />
      <Text style={[styles.statMiniValue, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statMiniLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

function HintRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.hintRowItem, { borderBottomColor: theme.colors.borderSubtle }]} accessible accessibilityRole="text" accessibilityLabel={`${label} ${value}`}>
      <View style={styles.hintLabelRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={icon} size={14} color={theme.colors.textTertiary} />
        <Text style={[styles.hintLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.hintValue, { color: theme.colors.textPrimary }]} accessibilityElementsHidden importantForAccessibility="no">{value}</Text>
    </View>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.filterRow}>
      <Text style={[styles.filterLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
      <View style={styles.filterChips}>{children}</View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  activeColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.colors.surfacePrimary : theme.colors.surfaceSecondary,
          borderColor: active ? activeColor : theme.colors.borderSubtle,
          borderWidth: active ? 2 : StyleSheet.hairlineWidth,
        },
        pressed && styles.rowPressed,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}${active ? '、選択中' : ''}`}
    >
      {active && (
        <Ionicons name="checkmark" size={14} color={theme.colors.textPrimary} accessibilityElementsHidden />
      )}
      <Text style={[styles.chipText, { color: active ? theme.colors.textPrimary : theme.colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#174F2A',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, lineHeight: 29, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 13, lineHeight: 18, color: '#B7DDBB', marginTop: 2, marginBottom: 12 },
  rarityRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  rarityItem: { flex: 1, alignItems: 'center', gap: 3 },
  rarityStarsRow: { flexDirection: 'row', gap: 1 },
  rarityMiniBar: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 2, overflow: 'hidden' },
  rarityMiniFill: { height: '100%', borderRadius: 2 },
  rarityCount: { fontSize: 11, lineHeight: 14, color: 'rgba(255,255,255,0.82)', fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 15,
    paddingLeft: 13,
    minHeight: 48,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingVertical: 0 },
  searchClearBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerPressed: { backgroundColor: 'rgba(255,255,255,0.12)' },
  recentSearchRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  recentSearchChip: { minHeight: 44, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 11, justifyContent: 'center', maxWidth: 150 },
  recentSearchChipText: { fontSize: 12, lineHeight: 17, color: '#FFFFFF', fontWeight: '600' },

  statsContainer: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  statsToggleRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 },
  statsToggleText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingBottom: 6 },
  statMiniCard: { minWidth: 68, minHeight: 58, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 8, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  statMiniDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 3 },
  statMiniValue: { fontSize: 15, lineHeight: 19, fontWeight: '900' },
  statMiniLabel: { fontSize: 11, lineHeight: 14, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  filtersContainer: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  filterToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterToggleBtn: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterToggleText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  filterBadge: { borderRadius: 999, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  filterBadgeText: { fontSize: 10, fontWeight: '900' },
  filterResetBtn: { minHeight: 44, borderRadius: 13, paddingHorizontal: 12, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  filterResetText: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  filterPanel: { paddingTop: 4, paddingBottom: 6, gap: 9 },
  filterRow: { gap: 5 },
  filterLabel: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  filterChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { minHeight: 44, paddingHorizontal: 12, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  chipText: { fontSize: 12, lineHeight: 17, fontWeight: '700' },

  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 9, paddingBottom: 5, gap: 8 },
  countText: { fontSize: 12, lineHeight: 17, flexShrink: 1 },
  viewModeRow: { flexDirection: 'row', gap: 2, borderRadius: 14, padding: 2, borderWidth: StyleSheet.hairlineWidth },
  viewModeBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  listRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, marginHorizontal: 4, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth },
  listEmojiWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  listEmoji: { fontSize: 22 },
  listInfo: { flex: 1, minWidth: 0 },
  listName: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  listSub: { fontSize: 12, lineHeight: 17, marginTop: 1 },
  familySectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 10, marginTop: 5 },
  familySectionTitle: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
  familySectionCount: { fontSize: 12, lineHeight: 17, fontWeight: '600' },

  activeEffectRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 6 },
  activeEffectLabel: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  activeEffectChip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingLeft: 11, borderWidth: StyleSheet.hairlineWidth },
  activeEffectText: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  activeEffectClose: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  grid: { paddingHorizontal: 12, paddingBottom: 16 },
  gridRow: { alignItems: 'stretch' },
  emptyContainer: { paddingHorizontal: 32, paddingVertical: 52, alignItems: 'center' },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, lineHeight: 21, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 5, maxWidth: 320 },
  emptyResetBtn: { minHeight: 48, marginTop: 16, paddingHorizontal: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  emptyResetText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  footerPad: { paddingTop: 16 },

  hintOverlay: { flex: 1, justifyContent: 'flex-end' },
  hintCard: { maxHeight: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 18 },
  hintHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.45)', alignSelf: 'center', marginBottom: 10 },
  hintScroll: { flexShrink: 1 },
  hintScrollContent: { paddingTop: 4, paddingBottom: 4 },
  hintTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 17 },
  hintTitle: { fontSize: 18, lineHeight: 25, fontWeight: '900', textAlign: 'center' },
  hintMystery: { width: 76, height: 76, borderRadius: 38, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 2 },
  hintQuestion: { fontSize: 34, fontWeight: '900' },
  hintRows: { borderRadius: 16, paddingVertical: 4, marginBottom: 16, overflow: 'hidden' },
  hintRowItem: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  hintLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintLabel: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  hintValue: { fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 12 },
  hintFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 15 },
  hintFooter: { fontSize: 13, lineHeight: 19, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  hintCloseBtn: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  hintCloseBtnText: { fontSize: 16, lineHeight: 21, fontWeight: '800' },

  rowPressed: { opacity: 0.68 },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
