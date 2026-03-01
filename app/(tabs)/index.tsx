import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../../src/store/useGameStore';
import { PLANTS, TOTAL_PLANTS } from '../../src/data/plants';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { Colors } from '../../src/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { discoveredPlantIds, playerName, xp, getLevel, getXpForCurrentLevel } =
    useGameStore();

  const level = getLevel();
  const xpCurrent = getXpForCurrentLevel();
  const XP_PER_LEVEL = 500;
  const xpProgress = xpCurrent / XP_PER_LEVEL;

  const discoveredCount = discoveredPlantIds.length;
  const greenCount = PLANTS.filter(
    (p) => p.danger === 'GREEN' && discoveredPlantIds.includes(p.id)
  ).length;
  const rarePlants = PLANTS.filter(
    (p) => p.rarity >= 4 && discoveredPlantIds.includes(p.id)
  );

  const recentPlants = [...discoveredPlantIds]
    .reverse()
    .slice(0, 6)
    .map((id) => PLANTS.find((p) => p.id === id))
    .filter((p): p is (typeof PLANTS)[number] => p !== undefined);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C']}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <Text style={styles.appTitle}>🌿 薬育ポケット</Text>
          <Text style={styles.playerName}>{playerName}</Text>

          {/* Level & XP */}
          <View style={styles.levelContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelLabel}>Lv</Text>
              <Text style={styles.levelNum}>{level}</Text>
            </View>
            <View style={styles.xpSection}>
              <Text style={styles.xpText}>
                XP {xpCurrent} / {XP_PER_LEVEL}
              </Text>
              <View style={styles.xpBar}>
                <View
                  style={[styles.xpFill, { width: `${xpProgress * 100}%` }]}
                />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="📚"
          value={`${discoveredCount}/${TOTAL_PLANTS}`}
          label="図鑑収録"
          color="#4CAF50"
        />
        <StatCard
          icon="🟢"
          value={String(greenCount)}
          label="食用植物"
          color="#2E7D32"
        />
        <StatCard
          icon="⭐"
          value={String(rarePlants.length)}
          label="レア発見"
          color={Colors.rarity5}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => router.push('/(tabs)/scan')}
        >
          <Ionicons name="camera" size={24} color="#FFFFFF" />
          <Text style={styles.actionBtnTextPrimary}>植物をスキャン</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => router.push('/(tabs)/zukan')}
        >
          <Ionicons name="book" size={24} color={Colors.primaryDark} />
          <Text style={styles.actionBtnTextSecondary}>図鑑を見る</Text>
        </Pressable>
      </View>

      {/* Recent Discoveries */}
      {recentPlants.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 最近の発見</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentPlants.map((plant) => (
              <Pressable
                key={plant.id}
                style={styles.recentCard}
                onPress={() => router.push(`/plant/${plant.id}`)}
              >
                <Text style={styles.recentEmoji}>{plant.emoji}</Text>
                <Text style={styles.recentName} numberOfLines={1}>
                  {plant.name}
                </Text>
                <Text
                  style={[
                    styles.recentDanger,
                    plant.danger === 'RED' && styles.dangerRed,
                    plant.danger === 'YELLOW' && styles.dangerYellow,
                    plant.danger === 'GREEN' && styles.dangerGreen,
                  ]}
                >
                  {plant.danger === 'GREEN'
                    ? '🟢'
                    : plant.danger === 'YELLOW'
                    ? '🟡'
                    : '🔴'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 コレクション進捗</Text>
        <View style={styles.progressCard}>
          <ProgressRow
            label="野草"
            discovered={
              PLANTS.filter(
                (p) => p.category === '野草' && discoveredPlantIds.includes(p.id)
              ).length
            }
            total={PLANTS.filter((p) => p.category === '野草').length}
            color="#4CAF50"
          />
          <ProgressRow
            label="スパイス・ハーブ"
            discovered={
              PLANTS.filter(
                (p) =>
                  p.category === 'スパイス・ハーブ' &&
                  discoveredPlantIds.includes(p.id)
              ).length
            }
            total={PLANTS.filter((p) => p.category === 'スパイス・ハーブ').length}
            color="#FF8F00"
          />
        </View>
      </View>

      {/* Disclaimer */}
      <DisclaimerBanner />
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProgressRow({
  label,
  discovered,
  total,
  color,
}: {
  label: string;
  discovered: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? discovered / total : 0;
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]}
        />
      </View>
      <Text style={styles.progressValue}>
        {discovered}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  heroContent: {},
  appTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  playerName: { fontSize: 14, color: '#A5D6A7', marginTop: 2, marginBottom: 16 },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  levelLabel: { fontSize: 10, color: '#A5D6A7', fontWeight: '700' },
  levelNum: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  xpSection: { flex: 1 },
  xpText: { fontSize: 11, color: '#C8E6C9', marginBottom: 4 },
  xpBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: '#FFEB3B', borderRadius: 5 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionBtnPrimary: { backgroundColor: Colors.primary },
  actionBtnSecondary: {
    backgroundColor: Colors.primaryPale,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  actionBtnTextPrimary: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  actionBtnTextSecondary: { color: Colors.primaryDark, fontWeight: '800', fontSize: 15 },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },

  recentCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  recentEmoji: { fontSize: 28, marginBottom: 4 },
  recentName: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  recentDanger: { fontSize: 14, marginTop: 4 },
  dangerRed: {},
  dangerYellow: {},
  dangerGreen: {},

  progressCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressLabel: { fontSize: 12, color: Colors.textSecondary, width: 110, fontWeight: '600' },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  progressValue: { fontSize: 12, fontWeight: '700', color: Colors.text, width: 36, textAlign: 'right' },

  bottomPad: { height: 24 },
});
