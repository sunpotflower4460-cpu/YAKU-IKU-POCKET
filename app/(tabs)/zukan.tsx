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

type FilterDiscovered = 'all' | 'discovered' | 'undiscovered';
type FilterDanger = 'all' | DangerLevel;
type FilterCategory = 'all' | PlantCategory;

export default function ZukanScreen() {
  const router = useRouter();
  const { discoveredPlantIds } = useGameStore();

  const [search, setSearch] = useState('');
  const [filterDiscovered, setFilterDiscovered] =
    useState<FilterDiscovered>('all');
  const [filterDanger, setFilterDanger] = useState<FilterDanger>('all');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');

  const filtered = useMemo(() => {
    return PLANTS.filter((plant) => {
      const isDiscovered = discoveredPlantIds.includes(plant.id);

      if (filterDiscovered === 'discovered' && !isDiscovered) return false;
      if (filterDiscovered === 'undiscovered' && isDiscovered) return false;
      if (filterDanger !== 'all' && plant.danger !== filterDanger) return false;
      if (filterCategory !== 'all' && plant.category !== filterCategory)
        return false;

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
  }, [discoveredPlantIds, filterDiscovered, filterDanger, filterCategory, search]);

  const discoveredCount = discoveredPlantIds.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌿 薬草図鑑</Text>
        <Text style={styles.headerSub}>
          {discoveredCount}/{PLANTS.length} 種類発見
        </Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="名前で検索..."
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
