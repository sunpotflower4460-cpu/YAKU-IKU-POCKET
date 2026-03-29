import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/colors';
import { DisclaimerBanner } from '../src/components/DisclaimerBanner';
import { PLANTS } from '../src/data/plants';
import { useGameStore } from '../src/store/useGameStore';
import { suggestRecipe } from '../src/utils/claudeChat';

const RECIPE_GOALS = [
  { label: '疲労回復', emoji: '⚡' },
  { label: '消化改善', emoji: '🍃' },
  { label: 'リラックス', emoji: '🌸' },
  { label: '免疫アップ', emoji: '🛡️' },
  { label: '冷え対策', emoji: '🔥' },
  { label: 'デトックス', emoji: '🌊' },
  { label: '美肌ケア', emoji: '✨' },
  { label: '安眠サポート', emoji: '🌙' },
];

export default function RecipeSuggestScreen() {
  const router = useRouter();
  const { discoveredPlantIds } = useGameStore();

  // All discovered plants available as ingredients
  const discoveredPlants = PLANTS.filter((p) => discoveredPlantIds.includes(p.id));

  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [customIngredients, setCustomIngredients] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePlant = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const addCustomIngredient = () => {
    const trimmed = customIngredient.trim();
    if (trimmed && !customIngredients.includes(trimmed)) {
      setCustomIngredients((prev) => [...prev, trimmed]);
      setCustomIngredient('');
    }
  };

  const removeCustom = (item: string) => {
    setCustomIngredients((prev) => prev.filter((i) => i !== item));
  };

  const allIngredients = [
    ...selectedPlantIds.map((id) => PLANTS.find((p) => p.id === id)?.name ?? ''),
    ...customIngredients,
  ].filter(Boolean);

  const handleGenerate = async () => {
    if (allIngredients.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const recipe = await suggestRecipe(allIngredients, selectedGoal);
      setResult(recipe);
    } catch (e) {
      setError('レシピの生成中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <DisclaimerBanner />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textWhite} />
        </Pressable>
        <Text style={styles.headerTitle}>レシピ提案</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>収集した薬草・ハーブを選ぶ</Text>
        {discoveredPlants.length === 0 ? (
          <View style={styles.emptyPlants}>
            <Text style={styles.emptyPlantsText}>
              まだ植物を収集していません。スキャンして集めましょう！
            </Text>
          </View>
        ) : (
          <View style={styles.plantGrid}>
            {discoveredPlants.map((plant) => {
              const selected = selectedPlantIds.includes(plant.id);
              return (
                <Pressable
                  key={plant.id}
                  style={[styles.plantChip, selected && styles.plantChipSelected]}
                  onPress={() => togglePlant(plant.id)}
                >
                  <Text style={styles.plantChipEmoji}>{plant.emoji}</Text>
                  <Text style={[styles.plantChipText, selected && styles.plantChipTextSelected]}>
                    {plant.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={14} color={Colors.textWhite} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Custom ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>材料を追加（自由入力）</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="例: 生姜、にんじん、はちみつ..."
            placeholderTextColor={Colors.textMuted}
            value={customIngredient}
            onChangeText={setCustomIngredient}
            onSubmitEditing={addCustomIngredient}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.addButton, !customIngredient.trim() && styles.addButtonDisabled]}
            onPress={addCustomIngredient}
            disabled={!customIngredient.trim()}
          >
            <Ionicons name="add" size={20} color={Colors.textWhite} />
          </Pressable>
        </View>
        {customIngredients.length > 0 && (
          <View style={styles.customChips}>
            {customIngredients.map((item) => (
              <View key={item} style={styles.customChip}>
                <Text style={styles.customChipText}>{item}</Text>
                <Pressable onPress={() => removeCustom(item)}>
                  <Ionicons name="close" size={14} color={Colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Goal selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>目的・希望（任意）</Text>
        <View style={styles.goalGrid}>
          {RECIPE_GOALS.map((goal) => (
            <Pressable
              key={goal.label}
              style={[styles.goalChip, selectedGoal === goal.label && styles.goalChipSelected]}
              onPress={() => {
                setSelectedGoal((prev) => (prev === goal.label ? '' : goal.label));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <Text style={[styles.goalText, selectedGoal === goal.label && styles.goalTextSelected]}>
                {goal.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Selected summary */}
      {allIngredients.length > 0 && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>使用する材料 ({allIngredients.length}種)</Text>
          <Text style={styles.summaryText}>{allIngredients.join('、')}</Text>
        </View>
      )}

      {/* Generate button */}
      <Pressable
        style={[styles.generateButton, (allIngredients.length === 0 || loading) && styles.generateButtonDisabled]}
        onPress={handleGenerate}
        disabled={allIngredients.length === 0 || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textWhite} size="small" />
        ) : (
          <>
            <Ionicons name="restaurant" size={20} color={Colors.textWhite} />
            <Text style={styles.generateButtonText}>レシピを生成する</Text>
          </>
        )}
      </Pressable>

      {/* Result */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultHeaderText}>🍽️ 提案レシピ</Text>
            <Pressable
              onPress={() => { setResult(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Ionicons name="refresh" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.resultText}>{result}</Text>
          <View style={styles.resultNote}>
            <Ionicons name="information-circle" size={14} color={Colors.textMuted} />
            <Text style={styles.resultNoteText}>
              植物・ハーブの摂取は適量を守り、アレルギーにご注意ください。
            </Text>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={Colors.dangerRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
    backgroundColor: '#E65100',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyPlants: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyPlantsText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  plantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  plantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  plantChipSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  plantChipEmoji: {
    fontSize: 14,
  },
  plantChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  plantChipTextSelected: {
    color: Colors.textWhite,
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  customChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customChipText: {
    fontSize: 13,
    color: Colors.text,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  goalChipSelected: {
    backgroundColor: '#E65100',
    borderColor: '#E65100',
  },
  goalEmoji: { fontSize: 14 },
  goalText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  goalTextSelected: {
    color: Colors.textWhite,
  },
  summaryBox: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#E65100',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonDisabled: {
    opacity: 0.45,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  resultCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  resultText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  resultNote: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    padding: 10,
    backgroundColor: Colors.bg,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  resultNoteText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dangerRed,
  },
});
