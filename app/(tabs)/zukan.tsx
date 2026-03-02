import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PLANTS } from '../../src/data/plants';
import { useGameStore } from '../../src/store/useGameStore';
import { PlantCard } from '../../src/components/PlantCard';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { Colors } from '../../src/constants/colors';
import { DangerLevel, PlantCategory } from '../../src/types';
import { getCurrentSeason, SEASON_CONFIG, isPlantInSeason } from '../../src/utils/season';

type FilterDiscovered = 'all' | 'discovered' | 'undiscovered';
type FilterDanger = 'all' | DangerLevel;
type FilterCategory = 'all' | PlantCategory;
type FilterSeason = 'all' | 'current';
type SortRarity = 'none' | 'desc' | 'asc';

export default function ZukanScreen() {
  const router = useRouter();
  const { discoveredPlantIds } = useGameStore();

  const [search, setSearch] = useState('');
  const [filterDiscovered, setFilterDiscovered] =
    useState<FilterDiscovered>('all');
  const [filterDanger, setFilterDanger] = useState<FilterDanger>('all');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterSeason, setFilterSeason] = useState<FilterSeason>('all');
  const [sortRarity, setSortRarity] = useState<SortRarity>('none');

  const currentSeason = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[currentSeason];

  const filtered = useMemo(() => {
    let result = PLANTS.filter((plant) => {
      const isDiscovered = discoveredPlantIds.includes(plant.id);

      if (filterDiscovered === 'discovered' && !isDiscovered) return false;
      if (filterDiscovered === 'undiscovered' && isDiscovered) return false;
      if (filterDanger !== 'all' && plant.danger !== filterDanger) return false;
      if (filterCategory !== 'all' && plant.category !== filterCategory)
        return false;
      if (filterSeason === 'current' && !isPlantInSeason(plant.season, currentSeason))
        return false;

      // Search applies only to discovered plants (undiscovered names are hidden)
      if (search && isDiscovered) {
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
  }, [discoveredPlantIds, filterDiscovered, filterDanger, filterCategory, filterSeason, sortRarity, search, currentSeason]);

  const discoveredCount = discoveredPlantIds.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌿 薬草図鑑</Text>
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
                <Text style={[styles.rarityStar, { color: rarityColor }]}>
                  {'★'.repeat(rarity)}
                </Text>
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
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="発見済みの植物を検索..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Discovery filter */}
        <FilterRow label="状態">
          {(
            [
              ['all', 'すべて'],
              ['discovered', '発見済み'],
              ['undiscovered', '未発見'],
            ] as [FilterDiscovered, string][]
          ).map(([val, label]) => (
            <FilterChip
              key={val}
              label={label}
              active={filterDiscovered === val}
              onPress={() => setFilterDiscovered(val)}
              activeColor={Colors.primary}
            />
          ))}
        </FilterRow>

        <FilterRow label="危険度">
          {(
            [
              ['all', 'すべて'],
              ['GREEN', '🟢安全'],
              ['YELLOW', '🟡注意'],
              ['RED', '🔴危険'],
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
            label={`${seasonCfg.emoji} 今の季節`}
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
      </View>

      {/* Count */}
      <Text style={styles.countText}>
        {filtered.length}種類を表示
      </Text>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            discovered={discoveredPlantIds.includes(item.id)}
            onPress={() => {
              if (discoveredPlantIds.includes(item.id)) {
                router.push(`/plant/${item.id}`);
              }
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌱</Text>
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
      onPress={onPress}
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
  rarityStar: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: -1,
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
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)',
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
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },

  filtersContainer: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  chipText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },

  countText: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  grid: { paddingHorizontal: 12, paddingBottom: 16 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  footerPad: { paddingTop: 16 },
});
