import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/colors';
import { DisclaimerBanner } from '../src/components/DisclaimerBanner';
import { SYMPTOMS, SYMPTOM_CATEGORIES, SymptomCategory, SymptomEntry } from '../src/data/symptoms';
import { useGameStore } from '../src/store/useGameStore';

const CATEGORY_COLORS: Record<SymptomCategory, string> = {
  '消化・胃腸': '#E65100',
  '呼吸・風邪': '#1565C0',
  '皮膚・外用': '#880E4F',
  '疲労・回復': '#1B5E20',
  '精神・ストレス': '#4A148C',
  '冷え・血行': '#01579B',
  '解毒・デトックス': '#33691E',
  '女性の悩み': '#880E4F',
  '免疫・抗炎症': '#BF360C',
};

const CATEGORY_EMOJIS: Record<SymptomCategory, string> = {
  '消化・胃腸': '🍃',
  '呼吸・風邪': '💨',
  '皮膚・外用': '✨',
  '疲労・回復': '⚡',
  '精神・ストレス': '🧠',
  '冷え・血行': '🔥',
  '解毒・デトックス': '🌊',
  '女性の悩み': '🌸',
  '免疫・抗炎症': '🛡️',
};

export default function SymptomSearchScreen() {
  const router = useRouter();
  const { discoveredPlantIds } = useGameStore();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SYMPTOMS.filter((s) => {
      const matchCat = !selectedCategory || s.category === selectedCategory;
      const matchSearch =
        !searchText.trim() ||
        s.symptom.includes(searchText) ||
        s.remedies.some((r) => r.plantName.includes(searchText));
      return matchCat && matchSearch;
    });
  }, [searchText, selectedCategory]);

  const toggleExpand = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const isCollected = (plantId: string) => discoveredPlantIds.includes(plantId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <DisclaimerBanner />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textWhite} />
        </Pressable>
        <Text style={styles.headerTitle}>症状から探す</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="症状・植物名で検索..."
          placeholderTextColor={Colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <Pressable
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => { setSelectedCategory(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            すべて
          </Text>
        </Pressable>
        {SYMPTOM_CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] },
            ]}
            onPress={() => {
              setSelectedCategory((prev) => (prev === cat ? null : cat));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat && styles.categoryChipTextActive,
            ]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultCount}>{filtered.length}件の症状</Text>

      {/* Symptom Cards */}
      {filtered.map((entry) => (
        <SymptomCard
          key={entry.id}
          entry={entry}
          expanded={expandedId === entry.id}
          onToggle={() => toggleExpand(entry.id)}
          isCollected={isCollected}
          categoryColor={CATEGORY_COLORS[entry.category]}
          categoryEmoji={CATEGORY_EMOJIS[entry.category]}
        />
      ))}

      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌿</Text>
          <Text style={styles.emptyText}>該当する症状が見つかりません</Text>
          <Text style={styles.emptySubtext}>別のキーワードで検索してみてください</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function SymptomCard({
  entry,
  expanded,
  onToggle,
  isCollected,
  categoryColor,
  categoryEmoji,
}: {
  entry: SymptomEntry;
  expanded: boolean;
  onToggle: () => void;
  isCollected: (id: string) => boolean;
  categoryColor: string;
  categoryEmoji: string;
}) {
  return (
    <View style={[styles.card, { borderLeftColor: categoryColor }]}>
      <Pressable onPress={onToggle} style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.symptomEmoji}>{entry.emoji}</Text>
          <View>
            <Text style={styles.symptomName}>{entry.symptom}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagEmoji}>{categoryEmoji}</Text>
              <Text style={[styles.categoryTagText, { color: categoryColor }]}>
                {entry.category}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textMuted}
        />
      </Pressable>

      {expanded && (
        <View style={styles.cardBody}>
          <Text style={styles.remediesTitle}>おすすめの薬草・ハーブ</Text>
          {entry.remedies.map((remedy) => (
            <View
              key={remedy.plantId}
              style={[styles.remedyItem, isCollected(remedy.plantId) && styles.remedyItemCollected]}
            >
              <View style={styles.remedyHeader}>
                <Text style={styles.remedyEmoji}>{remedy.emoji}</Text>
                <Text style={styles.remedyName}>{remedy.plantName}</Text>
                {isCollected(remedy.plantId) && (
                  <View style={styles.collectedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                    <Text style={styles.collectedText}>収集済み</Text>
                  </View>
                )}
              </View>
              <View style={styles.methodTag}>
                <Ionicons name="flask" size={12} color={Colors.textMuted} />
                <Text style={styles.methodText}>{remedy.method}</Text>
              </View>
              <Text style={styles.remedyDesc}>{remedy.description}</Text>
            </View>
          ))}

          <View style={styles.adviceBox}>
            <Ionicons name="bulb" size={16} color="#F57F17" />
            <Text style={styles.adviceText}>{entry.advice}</Text>
          </View>

          {entry.warningNote && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={Colors.dangerRed} />
              <Text style={styles.warningText}>{entry.warningNote}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  categoryEmoji: {
    fontSize: 13,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.textWhite,
  },
  resultCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  symptomEmoji: {
    fontSize: 28,
  },
  symptomName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryTagEmoji: {
    fontSize: 11,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  remediesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remedyItem: {
    backgroundColor: Colors.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  remedyItemCollected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  remedyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  remedyEmoji: {
    fontSize: 20,
  },
  remedyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  collectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  collectedText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  methodText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  remedyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  adviceBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFF9C4',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  adviceText: {
    flex: 1,
    fontSize: 12,
    color: '#5D4037',
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: Colors.dangerRed,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
