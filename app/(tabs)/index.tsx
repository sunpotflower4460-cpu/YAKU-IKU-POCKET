import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGameStore, XP_PER_LEVEL } from '../../src/store/useGameStore';
import { PLANTS, TOTAL_PLANTS } from '../../src/data/plants';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { OnboardingModal } from '../../src/components/OnboardingModal';
import { Colors } from '../../src/constants/colors';
import { getCurrentSeason, SEASON_CONFIG, getSeasonalPlants } from '../../src/utils/season';
import {
  getDailyChallenges,
  getChallengePct,
  SEASONAL_CHALLENGES,
  Challenge,
  ChallengeSnap,
} from '../../src/data/challenges';

// Milestones: [ threshold, emoji, title, desc ]
const MILESTONES: [number, string, string, string][] = [
  [1,  '🌱', '初めての発見！',   '図鑑の旅が始まりました！'],
  [10, '📚', '10種類発見！',    '図鑑収録が進んできました！'],
  [25, '🏅', '25種類発見！',    '半分制覇しました！'],
  [50, '🏆', '図鑑完成！',      '全50種類を発見しました！'],
];

export default function HomeScreen() {
  const router = useRouter();
  const {
    discoveredPlantIds, playerName, xp, getLevel, getXpForCurrentLevel,
    todayScanCount, todayNewCount, todayMaxRarity, todayDangers, todayCategories,
    claimedChallengeIds, claimChallenge,
    claimedSeasonalQuestIds, claimSeasonalChallenge,
    lastCelebrated, setLastCelebrated,
    hasOnboarded, setHasOnboarded,
  } = useGameStore();

  const level = getLevel();
  const xpCurrent = getXpForCurrentLevel();
  const xpProgress = xpCurrent / XP_PER_LEVEL;

  // Milestone detection
  const discoveredCount = discoveredPlantIds.length;
  const reachedMilestone = [...MILESTONES].reverse().find(([n]) => discoveredCount >= n);
  const pendingMilestone =
    reachedMilestone && reachedMilestone[0] > lastCelebrated ? reachedMilestone : null;

  const season = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[season];

  // Daily quest data
  const todayDateStr = new Date().toISOString().split('T')[0];
  const dailyChallenges = getDailyChallenges(todayDateStr);
  const dailySnap: ChallengeSnap = {
    todayScanCount, todayNewCount, todayMaxRarity, todayDangers, todayCategories,
  };
  const allQuestsClaimed =
    dailyChallenges.length > 0 &&
    dailyChallenges.every((c) => claimedChallengeIds.includes(c.id));

  // Seasonal spotlight plants
  const seasonalPlants = useMemo(() => getSeasonalPlants(season, PLANTS), [season]);
  // Sort: undiscovered first, then discovered; within each group keep rarity order
  const spotlightPlants = useMemo(() => [
    ...seasonalPlants.filter((p) => !discoveredPlantIds.includes(p.id)),
    ...seasonalPlants.filter((p) => discoveredPlantIds.includes(p.id)),
  ].slice(0, 8), [seasonalPlants, discoveredPlantIds]);

  // Seasonal quests progress
  const seasonalChallenges = SEASONAL_CHALLENGES[season];
  const seasonalDiscoveredCount = seasonalPlants.filter((p) =>
    discoveredPlantIds.includes(p.id)
  ).length;
  const seasonalSnap: ChallengeSnap = { ...dailySnap, seasonalDiscoveredCount };

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

  // Animated XP bar
  const xpAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(xpAnim, {
      toValue: xpProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [xpProgress]);
  const xpBarWidth = xpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

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
                <Animated.View
                  style={[styles.xpFill, { width: xpBarWidth }]}
                />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Milestone Banner */}
      {pendingMilestone && (
        <LinearGradient
          colors={['#E65100', '#FF8F00', '#FFB300']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.milestoneBanner}
        >
          <Text style={styles.milestoneEmoji}>{pendingMilestone[1]}</Text>
          <View style={styles.milestoneText}>
            <Text style={styles.milestoneTitle}>{pendingMilestone[2]}</Text>
            <Text style={styles.milestoneDesc}>{pendingMilestone[3]}</Text>
          </View>
          <Pressable
            style={styles.milestoneDismiss}
            onPress={() => setLastCelebrated(pendingMilestone[0])}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </Pressable>
        </LinearGradient>
      )}

      {/* Seasonal Banner */}
      <View style={[styles.seasonBanner, { backgroundColor: seasonCfg.bg }]}>
        <Text style={styles.seasonEmoji}>{seasonCfg.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.seasonTitle, { color: seasonCfg.color }]}>
            {season}の養生シーズン
          </Text>
          <Text style={styles.seasonDesc}>{seasonCfg.desc}</Text>
        </View>
        <View style={[styles.seasonBadge, { backgroundColor: seasonCfg.color }]}>
          <Text style={styles.seasonBadgeText}>出現UP</Text>
        </View>
      </View>

      {/* ── 今月の注目植物スライダー ── */}
      {spotlightPlants.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              {seasonCfg.emoji} 今の季節の注目植物
            </Text>
            <View style={[styles.sectionBadge, { backgroundColor: seasonCfg.color }]}>
              <Text style={styles.sectionBadgeText}>{seasonalDiscoveredCount}/{seasonalPlants.length}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {spotlightPlants.map((plant) => {
              const found = discoveredPlantIds.includes(plant.id);
              return (
                <Pressable
                  key={plant.id}
                  style={[
                    styles.spotlightCard,
                    found ? styles.spotlightCardFound : styles.spotlightCardUnfound,
                  ]}
                  onPress={() =>
                    found ? router.push(`/plant/${plant.id}`) : null
                  }
                >
                  {/* Rarity stars */}
                  <Text style={styles.spotlightStars}>
                    {'★'.repeat(plant.rarity)}{'☆'.repeat(5 - plant.rarity)}
                  </Text>
                  <Text style={[styles.spotlightEmoji, !found && styles.spotlightEmojiUnfound]}>
                    {found ? plant.emoji : '❓'}
                  </Text>
                  <Text
                    style={[styles.spotlightName, !found && styles.spotlightNameUnfound]}
                    numberOfLines={1}
                  >
                    {found ? plant.name : '???'}
                  </Text>
                  {found ? (
                    <View
                      style={[
                        styles.spotlightDangerBadge,
                        {
                          backgroundColor:
                            plant.danger === 'RED' ? '#FFCDD2' :
                            plant.danger === 'YELLOW' ? '#FFF9C4' : '#C8E6C9',
                        },
                      ]}
                    >
                      <Text style={styles.spotlightDangerText}>
                        {plant.danger === 'RED' ? '🔴 要注意' :
                         plant.danger === 'YELLOW' ? '🟡 注意' : '🟢 食用可'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.spotlightUnfoundBadge}>
                      <Text style={styles.spotlightUnfoundText}>未発見</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

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

      {/* Daily Quests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 今日のクエスト</Text>
        {dailyChallenges.map((challenge) => {
          const pct = getChallengePct(challenge, dailySnap);
          const claimed = claimedChallengeIds.includes(challenge.id);
          const done = pct >= 1;
          return (
            <QuestCard
              key={challenge.id}
              challenge={challenge}
              pct={pct}
              claimed={claimed}
              done={done}
              onClaim={() => claimChallenge(challenge.id, challenge.xpReward)}
            />
          );
        })}
        {allQuestsClaimed && (
          <View style={styles.questAllDone}>
            <Text style={styles.questAllDoneEmoji}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.questAllDoneTitle}>今日のクエスト達成！</Text>
              <Text style={styles.questAllDoneDesc}>
                明日また新しいクエストが届きます
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── 今月の季節クエスト ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{seasonCfg.emoji} 今月の季節クエスト</Text>
          <View style={[styles.sectionBadge, { backgroundColor: seasonCfg.color }]}>
            <Text style={styles.sectionBadgeText}>月次</Text>
          </View>
        </View>
        {seasonalChallenges.map((challenge) => {
          const pct = getChallengePct(challenge, seasonalSnap);
          const claimed = claimedSeasonalQuestIds.includes(challenge.id);
          const done = pct >= 1;
          return (
            <QuestCard
              key={challenge.id}
              challenge={challenge}
              pct={pct}
              claimed={claimed}
              done={done}
              onClaim={() =>
                claimSeasonalChallenge(challenge.id, challenge.xpReward)
              }
            />
          );
        })}
      </View>

      {/* Recent Discoveries */}
      {recentPlants.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 最近の発見</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentPlants.map((plant) => (
              <Pressable
                key={plant.id}
                style={[
                  styles.recentCard,
                  {
                    borderTopWidth: 3,
                    borderTopColor:
                      plant.danger === 'RED'
                        ? '#EF9A9A'
                        : plant.danger === 'YELLOW'
                        ? '#FFD54F'
                        : '#81C784',
                  },
                ]}
                onPress={() => router.push(`/plant/${plant.id}`)}
              >
                <Text style={styles.recentEmoji}>{plant.emoji}</Text>
                <Text style={styles.recentName} numberOfLines={1}>
                  {plant.name}
                </Text>
                <Text style={styles.recentDanger}>
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

    <OnboardingModal visible={!hasOnboarded} onComplete={setHasOnboarded} />
  );
}

function QuestCard({
  challenge,
  pct,
  claimed,
  done,
  onClaim,
}: {
  challenge: Challenge;
  pct: number;
  claimed: boolean;
  done: boolean;
  onClaim: () => void;
}) {
  return (
    <View style={[styles.questCard, claimed && styles.questCardClaimed]}>
      <View style={styles.questHeader}>
        <Text style={styles.questEmoji}>{claimed ? '✅' : challenge.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.questTitle, claimed && styles.questTextMuted]}>
            {challenge.title}
          </Text>
          <Text style={[styles.questDesc, claimed && styles.questTextMuted]}>
            {challenge.desc}
          </Text>
        </View>
        <View style={[styles.questXpBadge, claimed && { backgroundColor: '#E0E0E0' }]}>
          <Text style={[styles.questXpText, claimed && { color: '#9E9E9E' }]}>
            {claimed ? '受取済' : `+${challenge.xpReward}XP`}
          </Text>
        </View>
      </View>

      <View style={styles.questProgressRow}>
        <View style={styles.questBarBg}>
          <View
            style={[
              styles.questBarFill,
              { width: `${pct * 100}%` },
              claimed && { backgroundColor: '#9E9E9E' },
            ]}
          />
        </View>
        {done && !claimed ? (
          <Pressable
            style={styles.questClaimBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onClaim();
            }}
          >
            <Text style={styles.questClaimText}>受け取る</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
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

  // Milestone banner
  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  milestoneEmoji: { fontSize: 28 },
  milestoneText: { flex: 1 },
  milestoneTitle: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  milestoneDesc: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  milestoneDismiss: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Seasonal banner
  seasonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  seasonEmoji: { fontSize: 24 },
  seasonTitle: { fontSize: 13, fontWeight: '800' },
  seasonDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  seasonBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seasonBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
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
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 3, fontWeight: '600' },

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
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  sectionBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },

  // Spotlight cards
  spotlightCard: {
    borderRadius: 16,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 10,
    marginRight: 10,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  spotlightCardFound: {
    backgroundColor: Colors.bgCard,
  },
  spotlightCardUnfound: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BDBDBD',
  },
  spotlightStars: { fontSize: 8, color: '#FFC107', marginBottom: 4, letterSpacing: 1 },
  spotlightEmoji: { fontSize: 32, marginBottom: 5 },
  spotlightEmojiUnfound: { opacity: 0.4 },
  spotlightName: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 5 },
  spotlightNameUnfound: { color: '#9E9E9E' },
  spotlightDangerBadge: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  spotlightDangerText: { fontSize: 9, fontWeight: '700' },
  spotlightUnfoundBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#EEEEEE',
  },
  spotlightUnfoundText: { fontSize: 9, fontWeight: '700', color: '#9E9E9E' },

  recentCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    alignItems: 'center',
    width: 88,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  recentEmoji: { fontSize: 30, marginBottom: 5 },
  recentName: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  recentDanger: { fontSize: 13, marginTop: 5 },

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
    height: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  progressValue: { fontSize: 12, fontWeight: '700', color: Colors.text, width: 36, textAlign: 'right' },

  bottomPad: { height: 24 },

  // Quest card
  questCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  questCardClaimed: {
    backgroundColor: '#F5F5F5',
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  questEmoji: { fontSize: 24, lineHeight: 28 },
  questTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },
  questDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  questTextMuted: { color: Colors.textMuted },
  questXpBadge: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  questXpText: { fontSize: 11, fontWeight: '800', color: Colors.primaryDark },
  questProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  questBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  questClaimBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  questClaimText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  questAllDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  questAllDoneEmoji: { fontSize: 28 },
  questAllDoneTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  questAllDoneDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
