import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import * as Haptics from '../../src/utils/haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS } from '../../src/data/plants';
import { useGameStore } from '../../src/store/useGameStore';
import { PlantCard } from '../../src/components/PlantCard';
import { RarityStars } from '../../src/components/RarityStars';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { Colors } from '../../src/constants/colors';
import { DangerLevel, Plant, PlantCategory } from '../../src/types';
import { getCurrentSeason, SEASON_CONFIG, isPlantInSeason } from '../../src/utils/season';

type FilterDiscovered = 'all' | 'discovered' | 'undiscovered' | 'favorites' | 'noted';
type FilterDanger = 'all' | DangerLevel;
type FilterCategory = 'all' | PlantCategory;
type FilterSeason = 'all' | 'current';
type SortRarity = 'none' | 'desc' | 'asc';
type FilterRarity = 'all' | '3up' | '4up' | '5only';

export default function ZukanScreen() {
  const router = useRouter();
  const { filterEffect: initialFilterEffect } = useLocalSearchParams<{ filterEffect?: string }>();
  const { discoveredPlantIds, scanHistory, favoritePlantIds, toggleFavorite, plantNotes } = useGameStore();

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
  const [filterDiscovered, setFilterDiscovered] =
    useState<FilterDiscovered>('all');
  const [filterDanger, setFilterDanger] = useState<FilterDanger>('all');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterSeason, setFilterSeason] = useState<FilterSeason>('all');
  const [sortRarity, setSortRarity] = useState<SortRarity>('none');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const decodedInitialEffect = initialFilterEffect ? decodeURIComponent(initialFilterEffect) : null;
  const [filterEffect, setFilterEffect] = useState<string | null>(decodedInitialEffect);
  // Track which URL param value the user has already seen, so we only apply new ones
  const appliedEffectParam = useRef<string | undefined>(initialFilterEffect);

  // Apply effect filter when URL param changes to a new value (e.g., deep-link from plant detail)
  if (initialFilterEffect && initialFilterEffect !== appliedEffectParam.current) {
    appliedEffectParam.current = initialFilterEffect;
    setFilterEffect(decodeURIComponent(initialFilterEffect));
  }

  const activeFilterCount = [
    filterDiscovered !== 'all',
    filterDanger !== 'all',
    filterCategory !== 'all',
    filterSeason !== 'all',
    sortRarity !== 'none',
    filterRarity !== 'all',
    filterEffect !== null,
  ].filter(Boolean).length;

  function resetFilters() {
    setFilterDiscovered('all');
    setFilterDanger('all');
    setFilterCategory('all');
    setFilterSeason('all');
    setSortRarity('none');
    setFilterRarity('all');
    setFilterEffect(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const currentSeason = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[currentSeason];

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
      if (filterCategory !== 'all' && plant.category !== filterCategory)
        return false;
      if (filterSeason === 'current' && !isPlantInSeason(plant.season, currentSeason))
        return false;
      if (filterRarity === '3up' && plant.rarity < 3) return false;
      if (filterRarity === '4up' && plant.rarity < 4) return false;
      if (filterRarity === '5only' && plant.rarity !== 5) return false;
      if (filterEffect && !plant.effects.includes(filterEffect)) return false;

      // Search: undiscovered plants have hidden ("???") names, so a search query
      // can only match discovered plants. Hide undiscovered cards while searching
      // so the grid actually narrows to matches.
      if (search) {
        if (!isDiscovered) return false;
        const q = search.toLowerCase();
        if (
          !plant.name.includes(q) &&
          !plant.nameEn.toLowerCase().includes(q) &&
          !plant.nameLatin.toLowerCase().includes(q)
        )
          return false;
      }

      return true;
    });

    if (sortRarity === 'desc') {
      result = [...result].sort((a, b) => b.rarity - a.rarity);
    } else if (sortRarity === 'asc') {
      result = [...result].sort((a, b) => a.rarity - b.rarity);
    }

    return result;
  }, [discoveredPlantIds, favoritePlantIds, plantNotes, filterDiscovered, filterDanger, filterCategory, filterSeason, sortRarity, filterRarity, filterEffect, search, currentSeason]);

  const discoveredCount = discoveredPlantIds.length;

  // Stats for dashboard
  const statsGreen  = PLANTS.filter(p => p.danger === 'GREEN'  && discoveredPlantIds.includes(p.id)).length;
  const statsYellow = PLANTS.filter(p => p.danger === 'YELLOW' && discoveredPlantIds.includes(p.id)).length;
  const statsRed    = PLANTS.filter(p => p.danger === 'RED'    && discoveredPlantIds.includes(p.id)).length;
  const statsWild   = PLANTS.filter(p => p.category === '野草' && discoveredPlantIds.includes(p.id)).length;
  const statsHerb   = PLANTS.filter(p => p.category === 'スパイス・ハーブ' && discoveredPlantIds.includes(p.id)).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="leaf-outline" size={20} color="#FFFFFF" />
          <Text style={styles.headerTitle}>薬草図鑑</Text>
        </View>
        <Text style={styles.headerSub}>
          {discoveredCount}/{PLANTS.length} 種類発見
        </Text>

        {/* Rarity completion bars */}
        <View style={styles.rarityRow}>
          {([1, 2, 3, 4, 5] as const).map((rarity) => {
            const rarityColor = [Colors.rarity1, Colors.rarity2, Colors.rarity3, Colors.rarity4, Colors.rarity5][rarity - 1];
            const total = PLANTS.filter((p) => p.rarity === rarity).length;
            const found = PLANTS.filter(
              (p) => p.rarity === rarity && discoveredPlantIds.includes(p.id)
            ).length;
            const pct = total > 0 ? found / total : 0;
            return (
              <View key={rarity} style={styles.rarityItem}>
                <View style={styles.rarityStarsRow}>
                  {Array.from({ length: rarity }, (_, i) => (
                    <Ionicons key={i} name="star" size={9} color={rarityColor} />
                  ))}
                </View>
                <View style={styles.rarityMiniBar}>
                  <View
                    style={[
                      styles.rarityMiniFill,
                      { width: `${pct * 100}%`, backgroundColor: rarityColor },
                    ]}
                  />
                </View>
                <Text style={styles.rarityCount}>{found}/{total}</Text>
              </View>
            );
          })}
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="発見済みの植物を検索..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Statistics Dashboard */}
      <View style={styles.statsContainer}>
        <Pressable
          style={styles.statsToggleRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setStatsOpen(v => !v);
          }}
        >
          <Ionicons name={statsOpen ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.primaryDark} />
          <Ionicons name="stats-chart-outline" size={14} color={Colors.primaryDark} />
          <Text style={styles.statsToggleText}>コレクション統計</Text>
        </Pressable>
        {statsOpen && (
          <View style={styles.statsGrid}>
            <StatMini label="一般食用" value={`${statsGreen}`} color={Colors.dangerGreen} dotColor="#43A047" />
            <StatMini label="要注意" value={`${statsYellow}`} color={Colors.dangerYellow} dotColor="#F9A825" />
            <StatMini label="危険"   value={`${statsRed}`}    color={Colors.dangerRed} dotColor="#E53935" />
            <StatMini label="野草"     value={`${statsWild}/${PLANTS.filter(p => p.category === '野草').length}`} color={Colors.primary} />
            <StatMini label="ハーブ"   value={`${statsHerb}/${PLANTS.filter(p => p.category === 'スパイス・ハーブ').length}`} color="#FF8F00" />
            {([1,2,3,4,5] as const).map(r => {
              const total = PLANTS.filter(p => p.rarity === r).length;
              const found = PLANTS.filter(p => p.rarity === r && discoveredPlantIds.includes(p.id)).length;
              const col = [Colors.rarity1,Colors.rarity2,Colors.rarity3,Colors.rarity4,Colors.rarity5][r-1];
              return <StatMini key={r} label={`★${r}`} value={`${found}/${total}`} color={col} />;
            })}
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Toggle row */}
        <View style={styles.filterToggleRow}>
          <Pressable
            style={styles.filterToggleBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFiltersOpen((v) => !v);
            }}
          >
            <View style={styles.filterToggleBtnInner}>
              <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.primaryDark} />
              <Ionicons name="options-outline" size={14} color={Colors.primaryDark} />
              <Text style={styles.filterToggleText}>フィルター</Text>
            </View>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
          {activeFilterCount > 0 && (
            <Pressable style={styles.filterResetBtn} onPress={resetFilters}>
              <Text style={styles.filterResetText}>リセット</Text>
            </Pressable>
          )}
        </View>

        {/* Collapsible filter rows */}
        {filtersOpen && (
          <>
        {/* Discovery filter */}
        <FilterRow label="状態">
          {(
            [
              ['all', 'すべて'],
              ['discovered', '発見済み'],
              ['undiscovered', '未発見'],
              ['favorites', '❤️ お気に入り'],
              ['noted', '✏️ メモあり'],
            ] as [FilterDiscovered, string][]
          ).map(([val, label]) => (
            <FilterChip
              key={val}
              label={label}
              active={filterDiscovered === val}
              onPress={() => setFilterDiscovered(val)}
              activeColor={val === 'favorites' ? '#E91E63' : val === 'noted' ? '#795548' : Colors.primary}
            />
          ))}
        </FilterRow>

        <FilterRow label="危険度">
          {(
            [
              ['all', 'すべて'],
              ['GREEN', '安全'],
              ['YELLOW', '注意'],
              ['RED', '危険'],
            ] as [FilterDanger, string][]
          ).map(([val, label]) => (
            <FilterChip
              key={val}
              label={label}
              active={filterDanger === val}
              onPress={() => setFilterDanger(val)}
              activeColor={
                val === 'RED'
                  ? Colors.dangerRed
                  : val === 'YELLOW'
                  ? Colors.dangerYellow
                  : Colors.dangerGreen
              }
            />
          ))}
        </FilterRow>

        <FilterRow label="種類">
          {(
            [
              ['all', 'すべて'],
              ['野草', '野草'],
              ['スパイス・ハーブ', 'ハーブ'],
            ] as [FilterCategory, string][]
          ).map(([val, label]) => (
            <FilterChip
              key={val}
              label={label}
              active={filterCategory === val}
              onPress={() => setFilterCategory(val)}
              activeColor="#FF8F00"
            />
          ))}
        </FilterRow>

        <FilterRow label="季節">
          <FilterChip
            label="すべて"
            active={filterSeason === 'all'}
            onPress={() => setFilterSeason('all')}
            activeColor={Colors.primary}
          />
          <FilterChip
            label={`${currentSeason}の季節`}
            active={filterSeason === 'current'}
            onPress={() => setFilterSeason('current')}
            activeColor={seasonCfg.color}
          />
        </FilterRow>

        <FilterRow label="並び順">
          <FilterChip
            label="デフォルト"
            active={sortRarity === 'none'}
            onPress={() => setSortRarity('none')}
            activeColor={Colors.primaryDark}
          />
          <FilterChip
            label="★ 多い順"
            active={sortRarity === 'desc'}
            onPress={() => setSortRarity('desc')}
            activeColor="#FF8F00"
          />
          <FilterChip
            label="★ 少ない順"
            active={sortRarity === 'asc'}
            onPress={() => setSortRarity('asc')}
            activeColor={Colors.rarity1}
          />
        </FilterRow>

        <FilterRow label="レア度">
          {(
            [
              ['all',    'すべて'],
              ['3up',   '★3以上'],
              ['4up',   '★4以上'],
              ['5only', '★5のみ'],
            ] as [FilterRarity, string][]
          ).map(([val, label]) => (
            <FilterChip
              key={val}
              label={label}
              active={filterRarity === val}
              onPress={() => setFilterRarity(val)}
              activeColor={Colors.rarity5}
            />
          ))}
        </FilterRow>
          </>
        )}
      </View>

      {/* Count */}
      <Text style={styles.countText}>
        {filtered.length}種類を表示
      </Text>

      {/* Active effect filter chip */}
      {filterEffect && (
        <View style={styles.activeEffectRow}>
          <Ionicons name="medical-outline" size={14} color={Colors.primaryDark} />
          <Text style={styles.activeEffectLabel}>効果: </Text>
          <View style={styles.activeEffectChip}>
            <Text style={styles.activeEffectText}>{filterEffect}</Text>
            <Pressable
              onPress={() => {
                setFilterEffect(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={14} color={Colors.primaryDark} />
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
        <Pressable style={styles.hintOverlay} onPress={() => setHintPlant(null)}>
          {/* Inner card — stop propagation so tapping card doesn't close */}
          <Pressable style={styles.hintCard} onPress={() => {}}>
            {hintPlant && (
              <>
                <View style={styles.hintTitleRow}>
                  <Ionicons name="search-outline" size={16} color={Colors.text} />
                  <Text style={styles.hintTitle}>ミステリー植物のヒント</Text>
                </View>

                {/* Mystery silhouette */}
                <View style={styles.hintMystery}>
                  <Text style={styles.hintQuestion}>？</Text>
                </View>

                {/* Hint rows */}
                <View style={styles.hintRows}>
                  <HintRow icon="calendar-outline" label="旬の時期" value={hintPlant.season} />
                  <HintRow
                    icon="folder-outline"
                    label="カテゴリ"
                    value={hintPlant.category === '野草' ? '野草' : 'スパイス・ハーブ'}
                  />
                  <HintRow
                    icon="warning-outline"
                    label="危険度"
                    value={
                      hintPlant.danger === 'GREEN'
                        ? '一般に食用とされる'
                        : hintPlant.danger === 'YELLOW'
                        ? '要注意'
                        : '危険（有毒）'
                    }
                  />
                  <View style={styles.hintRowItem}>
                    <View style={styles.hintLabelRow}>
                      <Ionicons name="star-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.hintLabel}>レアリティ</Text>
                    </View>
                    <RarityStars rarity={hintPlant.rarity} size="sm" />
                  </View>
                </View>

                <View style={styles.hintFooterRow}>
                  <Ionicons name="camera-outline" size={13} color={Colors.primaryDark} />
                  <Text style={styles.hintFooter}>
                    スキャンして発見しよう！
                  </Text>
                </View>

                <Pressable
                  style={styles.hintCloseBtn}
                  onPress={() => setHintPlant(null)}
                >
                  <Text style={styles.hintCloseBtnText}>閉じる</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        windowSize={10}
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            discovered={discoveredPlantIds.includes(item.id)}
            imageUri={imageUriMap[item.id]}
            isFavorite={favoritePlantIds.includes(item.id)}
            hasNote={!!plantNotes[item.id]}
            onPress={() => {
              if (discoveredPlantIds.includes(item.id)) {
                router.push(`/plant/${item.id}`);
              } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHintPlant(item);
              }
            }}
            onFavorite={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              条件に一致する植物がありません
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerPad}>
            <DisclaimerBanner compact />
          </View>
        }
      />
    </View>
  );
}

function StatMini({ label, value, color, dotColor }: { label: string; value: string; color: string; dotColor?: string }) {
  return (
    <View style={[styles.statMiniCard, { borderTopColor: color }]}>
      {dotColor && <View style={[styles.statMiniDot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.statMiniValue, { color }]}>{value}</Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

function HintRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.hintRowItem}>
      <View style={styles.hintLabelRow}>
        <Ionicons name={icon} size={12} color={Colors.textSecondary} />
        <Text style={styles.hintLabel}>{label}</Text>
      </View>
      <Text style={styles.hintValue}>{value}</Text>
    </View>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}</Text>
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
  return (
    <Pressable
      style={[
        styles.chip,
        active && { backgroundColor: activeColor, borderColor: activeColor },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#A5D6A7', marginTop: 2, marginBottom: 12 },
  rarityRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  rarityItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  rarityStarsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  rarityMiniBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  rarityMiniFill: {
    height: '100%',
    borderRadius: 2,
  },
  rarityCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },

  filtersContainer: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  filterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  filterToggleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  filterBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  filterResetBtn: {
    backgroundColor: Colors.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
    width: 36,
  },
  filterChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },

  countText: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  activeEffectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  activeEffectLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  activeEffectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  activeEffectText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  grid: { paddingHorizontal: 12, paddingBottom: 16 },
  emptyContainer: { padding: 40, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  footerPad: { paddingTop: 16 },

  // Stats dashboard
  statsContainer: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  statsToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 6,
  },
  statMiniCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderTopWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    minWidth: 52,
  },
  statMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  statMiniValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  statMiniLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Hint Modal ───────────────────────────────────────────────────────────
  hintOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  hintCard: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  hintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  hintMystery: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#BDBDBD',
  },
  hintQuestion: {
    fontSize: 36,
    fontWeight: '900',
    color: '#9E9E9E',
  },
  hintRows: {
    backgroundColor: Colors.bg,
    borderRadius: 14,
    paddingVertical: 6,
    marginBottom: 18,
    overflow: 'hidden',
  },
  hintRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hintLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hintLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  hintValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  hintFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  hintFooter: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  hintCloseBtn: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  hintCloseBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});
