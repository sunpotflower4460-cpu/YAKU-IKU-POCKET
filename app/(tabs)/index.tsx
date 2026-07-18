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
import * as Haptics from '../../src/utils/haptics';
import { useGameStore, XP_PER_LEVEL } from '../../src/store/useGameStore';
import { PLANTS, TOTAL_PLANTS } from '../../src/data/plants';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { OnboardingModal } from '../../src/components/OnboardingModal';
import { Colors } from '../../src/constants/colors';
import { getCurrentSeason, SEASON_CONFIG, getSeasonalPlants } from '../../src/utils/season';
import { todayLocalStr, localDayFromISO } from '../../src/utils/date';
import { getTodayLearnCard } from '../../src/utils/learnCard';
import {
  getDailyChallenges,
  getChallengePct,
  SEASONAL_CHALLENGES,
  Challenge,
  ChallengeSnap,
} from '../../src/data/challenges';

// Milestones: [ threshold, iconName, title, desc ]. The final milestone
// always tracks TOTAL_PLANTS so it doesn't go stale as the catalog grows.
const MILESTONES: [number, string, string, string][] = [
  [1,  'leaf-outline',   '初めての発見！',   '図鑑の旅が始まりました！'],
  [10, 'book-outline',   '10種類発見！',    '図鑑収録が進んできました！'],
  [25, 'ribbon-outline', '25種類発見！',    '折り返し地点です！'],
  [TOTAL_PLANTS, 'trophy-outline', '図鑑完成！', `全${TOTAL_PLANTS}種類を発見しました！`],
];

export default function HomeScreen() {
  const router = useRouter();
  const {
    discoveredPlantIds, scanHistory, playerName, getLevel, getXpForCurrentLevel,
    todayScanCount, todayNewCount, todayMaxRarity, todayDangers, todayCategories,
    claimedChallengeIds, claimChallenge,
    claimedSeasonalQuestIds, claimSeasonalChallenge,
    lastCelebrated, setLastCelebrated,
    hasOnboarded, setHasOnboarded,
    _hasHydrated: hasHydrated,
  } = useGameStore();

  const level = getLevel();
  const xpCurrent = getXpForCurrentLevel();
  const xpProgress = Math.min(xpCurrent / XP_PER_LEVEL, 1); // cap at 1.0 to prevent overflow

  // Milestone detection
  const discoveredCount = discoveredPlantIds.length;
  const reachedMilestone = [...MILESTONES].reverse().find(([n]) => discoveredCount >= n);
  const pendingMilestone =
    reachedMilestone && reachedMilestone[0] > lastCelebrated ? reachedMilestone : null;

  const season = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[season];

  // Daily quest data (local date, aligned with the store's day boundary)
  const todayDateStr = todayLocalStr();
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

  // "1分で学ぶ" — one bite-sized learning card per day, prioritising
  // dangerous-lookalike awareness (the brand's core safety value, §7.3).
  const learnCard = useMemo(
    () => getTodayLearnCard(todayDateStr, discoveredPlantIds),
    [todayDateStr, discoveredPlantIds]
  );

  // This month's observation count, shown as a small supporting stat on the Hero.
  const thisMonthCount = useMemo(() => {
    const thisMonth = todayDateStr.slice(0, 7); // YYYY-MM (local)
    return scanHistory.filter((r) => localDayFromISO(r.scannedAt).slice(0, 7) === thisMonth).length;
  }, [scanHistory, todayDateStr]);

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
    <>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 今日のHero — 主役は「観察を始める」の1つ。レベル/XPは補助表示 (§7.3) */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C']}
        style={styles.hero}
      >
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.appTitle}>薬育ポケット</Text>
            <Text style={styles.playerName}>{playerName}</Text>
          </View>
          <View style={styles.levelBadgeSmall}>
            <Text style={styles.levelBadgeSmallText}>Lv.{level}</Text>
          </View>
        </View>

        <Text style={styles.heroHeadline}>
          {learnCard ? '今日も、自然を観察しよう' : '自然の観察をはじめよう'}
        </Text>

        <View style={styles.heroActionRow}>
          <Pressable
            style={styles.heroPrimaryBtn}
            onPress={() => router.push('/(tabs)/scan')}
            accessibilityRole="button"
            accessibilityLabel="観察を始める"
          >
            <Ionicons name="camera" size={20} color={Colors.primaryDark} />
            <Text style={styles.heroPrimaryBtnText}>観察を始める</Text>
          </Pressable>
          <Pressable
            style={styles.heroSecondaryBtn}
            onPress={() => router.push('/(tabs)/zukan')}
            accessibilityRole="button"
            accessibilityLabel="植物を探す"
          >
            <Ionicons name="search-outline" size={18} color="#FFFFFF" />
            <Text style={styles.heroSecondaryBtnText}>探す</Text>
          </Pressable>
        </View>

        <View style={styles.heroFooterRow}>
          <Text style={styles.heroFooterText}>今月の観察 {thisMonthCount}件</Text>
          <View style={styles.heroXpTrack}>
            <Animated.View style={[styles.heroXpFill, { width: xpBarWidth }]} />
          </View>
          <Text style={styles.heroFooterText}>
            XP {xpCurrent}/{XP_PER_LEVEL}
          </Text>
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
          <Ionicons name={pendingMilestone[1] as React.ComponentProps<typeof Ionicons>['name']} size={28} color="#FFFFFF" />
          <View style={styles.milestoneText}>
            <Text style={styles.milestoneTitle}>{pendingMilestone[2]}</Text>
            <Text style={styles.milestoneDesc}>{pendingMilestone[3]}</Text>
          </View>
          <Pressable
            style={styles.milestoneDismiss}
            onPress={() => setLastCelebrated(pendingMilestone[0])}
            accessibilityRole="button"
            accessibilityLabel="お知らせを閉じる"
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </Pressable>
        </LinearGradient>
      )}

      {/* 最近の観察 — Heroの直後（§7.3の情報階層順） */}
      {recentPlants.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="time-outline" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>最近の観察</Text>
          </View>
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
                <View
                  style={[
                    styles.recentDangerDot,
                    {
                      backgroundColor:
                        plant.danger === 'GREEN' ? '#43A047' :
                        plant.danger === 'YELLOW' ? '#F9A825' : '#E53935',
                    },
                  ]}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 今の季節 */}
      <View style={[styles.seasonBanner, { backgroundColor: seasonCfg.bg }]}>
        <Ionicons name={seasonCfg.icon as React.ComponentProps<typeof Ionicons>['name']} size={24} color={seasonCfg.color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.seasonTitle, { color: seasonCfg.color }]}>
            {season}の養生シーズン
          </Text>
          <Text style={styles.seasonDesc}>{seasonCfg.desc}</Text>
        </View>
        <View style={[styles.seasonBadge, { backgroundColor: seasonCfg.color }]}>
          <Text style={styles.seasonBadgeText}>観察しやすい</Text>
        </View>
      </View>

      {/* ── 今の季節の注目植物スライダー ── */}
      {spotlightPlants.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name={seasonCfg.icon as React.ComponentProps<typeof Ionicons>['name']} size={16} color={seasonCfg.color} />
              <Text style={styles.sectionTitle}>
                今の季節の注目植物
              </Text>
            </View>
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
                  <View style={styles.spotlightStarsRow}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Ionicons
                        key={i}
                        name={i < plant.rarity ? 'star' : 'star-outline'}
                        size={10}
                        color={i < plant.rarity ? '#FFC107' : '#BDBDBD'}
                      />
                    ))}
                  </View>
                  <Text style={[styles.spotlightEmoji, !found && styles.spotlightEmojiUnfound]}>
                    {found ? plant.emoji : '?'}
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
                      <View
                        style={[
                          styles.spotlightDangerDot,
                          {
                            backgroundColor:
                              plant.danger === 'RED' ? '#E53935' :
                              plant.danger === 'YELLOW' ? '#F9A825' : '#43A047',
                          },
                        ]}
                      />
                      <Text style={styles.spotlightDangerText}>
                        {plant.danger === 'RED' ? '要注意' :
                         plant.danger === 'YELLOW' ? '注意' : '一般食用'}
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

      {/* 今日の観察チャレンジ */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="list-outline" size={16} color={Colors.text} />
          <Text style={styles.sectionTitle}>今日の観察チャレンジ</Text>
        </View>
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
            <Ionicons name="checkmark-done-circle" size={28} color="#4CAF50" />
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
          <View style={styles.sectionTitleRow}>
            <Ionicons name={seasonCfg.icon as React.ComponentProps<typeof Ionicons>['name']} size={16} color={seasonCfg.color} />
            <Text style={styles.sectionTitle}>今月の季節クエスト</Text>
          </View>
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

      {/* 1分で学ぶ — 日替わりの学びカード（毒草の見分け方を優先） */}
      {learnCard && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bulb-outline" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>1分で学ぶ</Text>
          </View>
          <Pressable
            style={[styles.learnCard, learnCard.isSafetyTip && styles.learnCardSafety]}
            onPress={() => router.push(`/plant/${learnCard.plant.id}`)}
          >
            <View style={styles.learnCardHeader}>
              <Text style={styles.learnCardEmoji}>{learnCard.plant.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.learnCardName}>{learnCard.plant.name}</Text>
                {learnCard.isSafetyTip && (
                  <View style={styles.learnCardBadge}>
                    <Ionicons name="warning-outline" size={11} color={Colors.dangerRed} />
                    <Text style={styles.learnCardBadgeText}>見分け方を学ぶ</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.learnCardTip} numberOfLines={3}>
              {learnCard.tip}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Progress（発見数・レア発見などの統計もここに集約） */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="stats-chart-outline" size={16} color={Colors.text} />
          <Text style={styles.sectionTitle}>コレクション進捗</Text>
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="book-outline"
            value={`${discoveredCount}/${TOTAL_PLANTS}`}
            label="図鑑収録"
            color="#4CAF50"
          />
          <StatCard
            icon="leaf-outline"
            value={String(greenCount)}
            label="一般食用"
            color="#2E7D32"
          />
          <StatCard
            icon="star-outline"
            value={String(rarePlants.length)}
            label="レア発見"
            color={Colors.rarity5}
          />
        </View>
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

    <OnboardingModal visible={hasHydrated && !hasOnboarded} onComplete={setHasOnboarded} />
    </>
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
        {claimed ? (
          <Ionicons name="checkmark-circle" size={22} color="#9E9E9E" style={styles.questIcon} />
        ) : (
          <Ionicons name={challenge.icon as React.ComponentProps<typeof Ionicons>['name']} size={22} color={Colors.primary} style={styles.questIcon} />
        )}
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
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Ionicons name={icon} size={22} color={color} style={styles.statIconItem} />
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
  seasonTitle: { fontSize: 13, fontWeight: '800' },
  seasonDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  seasonBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seasonBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  hero: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  appTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  playerName: { fontSize: 13, color: '#A5D6A7', marginTop: 2 },
  levelBadgeSmall: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelBadgeSmallText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 18,
    marginBottom: 16,
    lineHeight: 28,
  },
  heroActionRow: { flexDirection: 'row', gap: 10 },
  heroPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
  },
  heroPrimaryBtnText: { fontSize: 16, fontWeight: '800', color: Colors.primaryDark },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroSecondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  heroFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  heroFooterText: { fontSize: 11, color: '#C8E6C9', fontWeight: '600' },
  heroXpTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroXpFill: { height: '100%', backgroundColor: '#FFEB3B', borderRadius: 3 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
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
  statIconItem: { marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3, fontWeight: '600' },

  learnCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  learnCardSafety: {
    backgroundColor: Colors.dangerRedBg,
    borderColor: '#EF9A9A',
  },
  learnCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  learnCardEmoji: { fontSize: 28 },
  learnCardName: { fontSize: 14, fontWeight: '800', color: Colors.text },
  learnCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  learnCardBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.dangerRed },
  learnCardTip: { fontSize: 12, lineHeight: 18, color: Colors.textSecondary },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
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
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 12,
    marginRight: 10,
    alignItems: 'center',
    width: 116,
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
  spotlightStarsRow: { flexDirection: 'row', gap: 1, marginBottom: 4 },
  spotlightEmoji: { fontSize: 34, marginBottom: 6 },
  spotlightEmojiUnfound: { opacity: 0.4 },
  spotlightName: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 6 },
  spotlightNameUnfound: { color: '#9E9E9E' },
  spotlightDangerBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 },
  spotlightDangerDot: { width: 6, height: 6, borderRadius: 3 },
  spotlightDangerText: { fontSize: 11, fontWeight: '700' },
  spotlightUnfoundBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: '#EEEEEE',
  },
  spotlightUnfoundText: { fontSize: 11, fontWeight: '700', color: '#9E9E9E' },

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
  recentDangerDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },

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
  questIcon: {},
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
