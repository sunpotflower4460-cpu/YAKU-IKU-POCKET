import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../src/utils/haptics';
import { useGameStore, XP_PER_LEVEL } from '../../src/store/useGameStore';
import { PLANTS, TOTAL_PLANTS } from '../../src/data/plants';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { OnboardingModal } from '../../src/components/OnboardingModal';
import { RarityStars } from '../../src/components/RarityStars';
import { DANGER_LABEL } from '../../src/components/DangerBadge';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useReduceMotion } from '../../src/utils/reduceMotion';
import { ResponsiveFrame } from '../../src/ui/ResponsiveFrame';
import { CONTENT_MAX_WIDTH } from '../../src/theme/layout';
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
  [1, 'leaf-outline', '初めての観察！', 'フィールドノートが始まりました'],
  [10, 'book-outline', '10種類を記録！', '観察の積み重ねが形になってきました'],
  [25, 'ribbon-outline', '25種類を記録！', '植物を見る目が育ってきました'],
  [TOTAL_PLANTS, 'book-outline', '観察図鑑の記録達成！', `全${TOTAL_PLANTS}種類との出会いを記録しました`],
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compactLayout = width < 360 || fontScale >= 1.3;
  const singleColumnStats = width < 340 || fontScale >= 1.6;
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
  const xpProgress = Math.min(xpCurrent / XP_PER_LEVEL, 1);

  // Milestone detection
  const discoveredCount = discoveredPlantIds.length;
  const reachedMilestone = [...MILESTONES].reverse().find(([n]) => discoveredCount >= n);
  const pendingMilestone =
    reachedMilestone && reachedMilestone[0] > lastCelebrated ? reachedMilestone : null;

  const season = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[season];
  const seasonAccent = theme.mode === 'dark' ? theme.colors.accentPrimary : seasonCfg.color;

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
  const spotlightLimit = width >= 768 && fontScale < 1.3 ? 6 : 4;
  const spotlightPlants = useMemo(() => [
    ...seasonalPlants.filter((p) => !discoveredPlantIds.includes(p.id)),
    ...seasonalPlants.filter((p) => discoveredPlantIds.includes(p.id)),
  ].slice(0, spotlightLimit), [seasonalPlants, discoveredPlantIds, spotlightLimit]);

  // Seasonal quests progress
  const seasonalChallenges = SEASONAL_CHALLENGES[season];
  const seasonalDiscoveredCount = seasonalPlants.filter((p) =>
    discoveredPlantIds.includes(p.id)
  ).length;
  const seasonalSnap: ChallengeSnap = { ...dailySnap, seasonalDiscoveredCount };

  const greenCount = PLANTS.filter(
    (p) => p.danger === 'GREEN' && discoveredPlantIds.includes(p.id)
  ).length;
  const uncommonPlants = PLANTS.filter(
    (p) => p.rarity >= 4 && discoveredPlantIds.includes(p.id)
  );

  const recentPlants = [...discoveredPlantIds]
    .reverse()
    .slice(0, 6)
    .map((id) => PLANTS.find((p) => p.id === id))
    .filter((p): p is (typeof PLANTS)[number] => p !== undefined);

  const learnCard = useMemo(
    () => getTodayLearnCard(todayDateStr, discoveredPlantIds),
    [todayDateStr, discoveredPlantIds]
  );

  const thisMonthCount = useMemo(() => {
    const thisMonth = todayDateStr.slice(0, 7);
    return scanHistory.filter((r) => localDayFromISO(r.scannedAt).slice(0, 7) === thisMonth).length;
  }, [scanHistory, todayDateStr]);

  // Animated XP bar. Respect Reduce Motion and cancel stale transitions when
  // XP changes quickly (e.g. claiming several completed quests in a row).
  const xpAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      xpAnim.setValue(xpProgress);
      return;
    }
    const animation = Animated.timing(xpAnim, {
      toValue: xpProgress,
      duration: theme.motion.celebration,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [xpProgress, reduceMotion, xpAnim, theme.motion.celebration]);
  const xpBarWidth = xpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  function statusColor(danger: 'GREEN' | 'YELLOW' | 'RED') {
    if (danger === 'RED') return theme.colors.statusDanger;
    if (danger === 'YELLOW') return theme.colors.statusCaution;
    return theme.colors.statusObserved;
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.canvas }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#123F24', '#1C542C', '#2B6638']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 18 }]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIdentity}>
              <Text style={styles.appEyebrow}>FIELD NOTE</Text>
              <Text style={styles.appTitle}>薬育ポケット</Text>
              <Text style={styles.playerName} numberOfLines={2}>{playerName}</Text>
            </View>
            <View style={styles.levelBadgeSmall} accessible accessibilityRole="text" accessibilityLabel={`レベル${level}`}>
              <Text style={styles.levelBadgeSmallText}>Lv.{level}</Text>
            </View>
          </View>

          <Text style={styles.heroHeadline} accessibilityRole="header">
            今日も、自然を観察しよう
          </Text>
          <Text style={styles.heroSubline}>見つける。見比べる。記録する。</Text>

          <View style={[styles.heroActionRow, compactLayout && styles.heroActionRowStacked]}>
            <Pressable
              style={({ pressed }) => [
                styles.heroPrimaryBtn,
                compactLayout && styles.heroActionButtonStacked,
                pressed && styles.heroPrimaryPressed,
              ]}
              onPress={() => router.push('/(tabs)/scan')}
              accessibilityRole="button"
              accessibilityLabel="観察を始める"
            >
              <Ionicons name="camera" size={20} color="#174F2A" />
              <Text style={styles.heroPrimaryBtnText}>観察を始める</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.heroSecondaryBtn,
                compactLayout && styles.heroActionButtonStacked,
                pressed && styles.heroSecondaryPressed,
              ]}
              onPress={() => router.push('/(tabs)/zukan')}
              accessibilityRole="button"
              accessibilityLabel="植物を探す"
            >
              <Ionicons name="search-outline" size={18} color="#FFFFFF" />
              <Text style={styles.heroSecondaryBtnText}>探す</Text>
            </Pressable>
          </View>

          <View
            style={[styles.heroFooterRow, compactLayout && styles.heroFooterRowCompact]}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`今月の観察${thisMonthCount}件。レベル内XP ${xpCurrent}/${XP_PER_LEVEL}`}
          >
            <Text style={styles.heroFooterText}>今月 {thisMonthCount}件</Text>
            <View style={styles.heroXpTrack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Animated.View style={[styles.heroXpFill, { width: xpBarWidth }]} />
            </View>
            <Text style={styles.heroFooterText}>XP {xpCurrent}/{XP_PER_LEVEL}</Text>
          </View>
        </LinearGradient>

        <ResponsiveFrame>
        {pendingMilestone && (
          <LinearGradient
            colors={['#8A430B', '#A95108', '#B05A08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.milestoneBanner}
          >
            <View style={styles.milestoneIconWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Ionicons name={pendingMilestone[1] as React.ComponentProps<typeof Ionicons>['name']} size={23} color="#FFFFFF" />
            </View>
            <View style={styles.milestoneText}>
              <Text style={styles.milestoneTitle}>{pendingMilestone[2]}</Text>
              <Text style={styles.milestoneDesc}>{pendingMilestone[3]}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.milestoneDismiss, pressed && styles.glassPressed]}
              onPress={() => setLastCelebrated(pendingMilestone[0])}
              accessibilityRole="button"
              accessibilityLabel="お知らせを閉じる"
            >
              <Ionicons name="close" size={19} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>
        )}

        {recentPlants.length > 0 && (
          <View style={styles.section}>
            <SectionTitle icon="time-outline" title="最近の観察" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {recentPlants.map((plant) => (
                <Pressable
                  key={plant.id}
                  style={({ pressed }) => [
                    styles.recentCard,
                    compactLayout && styles.recentCardCompact,
                    {
                      backgroundColor: theme.colors.surfacePrimary,
                      borderColor: theme.colors.borderSubtle,
                      borderTopColor: statusColor(plant.danger),
                      shadowColor: theme.colors.shadow,
                    },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => router.push(`/plant/${plant.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${plant.name}の詳細を見る。${DANGER_LABEL[plant.danger]}`}
                >
                  <Text style={styles.recentEmoji}>{plant.emoji}</Text>
                  <Text style={[styles.recentName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                    {plant.name}
                  </Text>
                  <View style={[styles.recentDangerDot, { backgroundColor: statusColor(plant.danger) }]} accessibilityElementsHidden />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View
          style={[
            styles.seasonBanner,
            compactLayout && styles.seasonBannerCompact,
            {
              backgroundColor: theme.mode === 'dark' ? theme.colors.surfaceSecondary : seasonCfg.bg,
              borderColor: theme.colors.borderSubtle,
            },
          ]}
        >
          <View style={[styles.seasonIconWrap, { backgroundColor: `${seasonAccent}18` }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Ionicons name={seasonCfg.icon as React.ComponentProps<typeof Ionicons>['name']} size={22} color={seasonAccent} />
          </View>
          <View style={styles.seasonTextBlock}>
            <Text style={[styles.seasonTitle, { color: theme.colors.textPrimary }]}>
              {season}の観察シーズン
            </Text>
            <Text style={[styles.seasonDesc, { color: theme.colors.textSecondary }]}>{seasonCfg.desc}</Text>
          </View>
          <View style={[styles.seasonBadge, { backgroundColor: `${seasonAccent}18` }]}>
            <Text style={[styles.seasonBadgeText, { color: seasonAccent }]}>季節</Text>
          </View>
        </View>

        {spotlightPlants.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionHeadingGrow}>
                <SectionTitle icon={seasonCfg.icon as React.ComponentProps<typeof Ionicons>['name']} title="今の季節の注目植物" iconColor={seasonAccent} />
              </View>
              <View style={styles.sectionActions}>
                <View style={[styles.sectionBadge, { backgroundColor: `${seasonAccent}18` }]}>
                  <Text style={[styles.sectionBadgeText, { color: seasonAccent }]}>{seasonalDiscoveredCount}/{seasonalPlants.length}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.sectionLink, pressed && styles.linkPressed]}
                  onPress={() => router.push('/(tabs)/zukan')}
                  accessibilityRole="button"
                  accessibilityLabel="季節の植物をすべて探す"
                >
                  <Text style={[styles.sectionLinkText, { color: theme.colors.accentPrimary }]}>すべて探す</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.accentPrimary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                </Pressable>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {spotlightPlants.map((plant) => {
                const found = discoveredPlantIds.includes(plant.id);
                return (
                  <Pressable
                    key={plant.id}
                    disabled={!found}
                    style={({ pressed }) => [
                      styles.spotlightCard,
                      compactLayout && styles.spotlightCardCompact,
                      {
                        backgroundColor: found ? theme.colors.surfacePrimary : theme.colors.surfaceSecondary,
                        borderColor: found ? theme.colors.borderSubtle : theme.colors.borderStrong,
                        shadowColor: theme.colors.shadow,
                      },
                      !found && styles.spotlightCardUnfound,
                      pressed && found && styles.cardPressed,
                    ]}
                    onPress={() => router.push(`/plant/${plant.id}`)}
                    accessibilityRole={found ? 'button' : 'text'}
                    accessibilityLabel={found ? `${plant.name}の詳細を見る。${DANGER_LABEL[plant.danger]}` : `未発見の植物。珍しさ5段階中${plant.rarity}`}
                    accessibilityState={{ disabled: !found }}
                  >
                    <RarityStars rarity={plant.rarity} size="sm" />
                    <Text style={[styles.spotlightEmoji, !found && styles.spotlightEmojiUnfound]}>
                      {found ? plant.emoji : '？'}
                    </Text>
                    <Text
                      style={[styles.spotlightName, { color: found ? theme.colors.textPrimary : theme.colors.textTertiary }]}
                      numberOfLines={2}
                    >
                      {found ? plant.name : '？？？'}
                    </Text>
                    {found ? (
                      <View style={[styles.spotlightDangerBadge, { backgroundColor: `${statusColor(plant.danger)}14` }]}>
                        <View style={[styles.spotlightDangerDot, { backgroundColor: statusColor(plant.danger) }]} accessibilityElementsHidden />
                        <Text
                          style={[styles.spotlightDangerText, { color: statusColor(plant.danger) }]}
                          numberOfLines={2}
                        >
                          {DANGER_LABEL[plant.danger]}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.spotlightUnfoundBadge, { backgroundColor: theme.colors.surfaceTertiary }]}>
                        <Text style={[styles.spotlightUnfoundText, { color: theme.colors.textTertiary }]}>未発見</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <SectionTitle icon="list-outline" title="今日の観察チャレンジ" />
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
                compact={compactLayout}
                onClaim={() => claimChallenge(challenge.id, challenge.xpReward)}
              />
            );
          })}
          {allQuestsClaimed && (
            <View
              style={[
                styles.questAllDone,
                compactLayout && styles.questAllDoneCompact,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.borderSubtle,
                },
              ]}
              accessible
              accessibilityRole="text"
              accessibilityLabel="今日のチャレンジ完了。明日また新しいテーマが届きます"
            >
              <View style={[styles.questAllDoneIcon, { backgroundColor: `${theme.colors.statusVerified}18` }]} accessibilityElementsHidden>
                <Ionicons name="checkmark-done" size={20} color={theme.colors.statusVerified} />
              </View>
              <View style={styles.questAllDoneText}>
                <Text style={[styles.questAllDoneTitle, { color: theme.colors.textPrimary }]}>今日のチャレンジ完了</Text>
                <Text style={[styles.questAllDoneDesc, { color: theme.colors.textSecondary }]}>
                  明日また新しいテーマが届きます
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionHeadingGrow}>
              <SectionTitle icon={seasonCfg.icon as React.ComponentProps<typeof Ionicons>['name']} title="今月の季節クエスト" iconColor={seasonAccent} />
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Text style={[styles.sectionBadgeText, { color: theme.colors.textSecondary }]}>月次</Text>
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
                compact={compactLayout}
                onClaim={() => claimSeasonalChallenge(challenge.id, challenge.xpReward)}
              />
            );
          })}
        </View>

        {learnCard && (
          <View style={styles.section}>
            <SectionTitle icon="bulb-outline" title="1分で学ぶ" />
            <Pressable
              style={({ pressed }) => [
                styles.learnCard,
                {
                  backgroundColor: learnCard.isSafetyTip
                    ? `${theme.colors.statusDanger}${theme.mode === 'dark' ? '12' : '0A'}`
                    : theme.colors.surfacePrimary,
                  borderColor: learnCard.isSafetyTip
                    ? `${theme.colors.statusDanger}55`
                    : theme.colors.borderSubtle,
                },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(`/plant/${learnCard.plant.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${learnCard.plant.name}について1分で学ぶ。${learnCard.tip}`}
            >
              <View style={[styles.learnCardHeader, compactLayout && styles.learnCardHeaderCompact]}>
                <View style={[styles.learnEmojiWrap, { backgroundColor: theme.colors.surfaceSecondary }]} accessibilityElementsHidden>
                  <Text style={styles.learnCardEmoji}>{learnCard.plant.emoji}</Text>
                </View>
                <View style={styles.learnCardTextBlock}>
                  <Text style={[styles.learnCardName, { color: theme.colors.textPrimary }]}>{learnCard.plant.name}</Text>
                  {learnCard.isSafetyTip && (
                    <View style={styles.learnCardBadge}>
                      <Ionicons name="shield-outline" size={12} color={theme.colors.statusDanger} />
                      <Text style={[styles.learnCardBadgeText, { color: theme.colors.statusDanger }]}>見分け方を学ぶ</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </View>
              <Text style={[styles.learnCardTip, { color: theme.colors.textSecondary }]}>
                {learnCard.tip}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <SectionTitle icon="stats-chart-outline" title="観察の積み重ね" />
          <View style={styles.statsRow}>
            <StatCard
              icon="book-outline"
              value={`${discoveredCount}/${TOTAL_PLANTS}`}
              label="記録した種類"
              color={theme.colors.accentPrimary}
              compact={compactLayout}
              singleColumn={singleColumnStats}
            />
            <StatCard
              icon="leaf-outline"
              value={String(greenCount)}
              label="一般食用区分"
              color={theme.colors.statusObserved}
              compact={compactLayout}
              singleColumn={singleColumnStats}
            />
            <StatCard
              icon="star-outline"
              value={String(uncommonPlants.length)}
              label="珍しい植物"
              color={theme.colors.rarityLegendary}
              compact={compactLayout}
              singleColumn={singleColumnStats}
            />
          </View>
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: theme.colors.borderSubtle,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <ProgressRow
              label="野草"
              discovered={PLANTS.filter((p) => p.category === '野草' && discoveredPlantIds.includes(p.id)).length}
              total={PLANTS.filter((p) => p.category === '野草').length}
              color={theme.colors.statusObserved}
              compact={compactLayout}
            />
            <ProgressRow
              label="スパイス・ハーブ"
              discovered={PLANTS.filter((p) => p.category === 'スパイス・ハーブ' && discoveredPlantIds.includes(p.id)).length}
              total={PLANTS.filter((p) => p.category === 'スパイス・ハーブ').length}
              color={theme.colors.rarityLegendary}
              compact={compactLayout}
            />
          </View>
        </View>

        <DisclaimerBanner />
        </ResponsiveFrame>
      </ScrollView>

      <OnboardingModal visible={hasHydrated && !hasOnboarded} onComplete={setHasOnboarded} />
    </>
  );
}

function SectionTitle({
  icon,
  title,
  iconColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  iconColor?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons
        name={icon}
        size={17}
        color={iconColor ?? theme.colors.textSecondary}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">{title}</Text>
    </View>
  );
}

function QuestCard({
  challenge,
  pct,
  claimed,
  done,
  compact,
  onClaim,
}: {
  challenge: Challenge;
  pct: number;
  claimed: boolean;
  done: boolean;
  compact: boolean;
  onClaim: () => void;
}) {
  const theme = useTheme();
  const safePct = Math.max(0, Math.min(pct, 1));
  const summary = `${challenge.title}。${challenge.desc}。進捗${Math.round(safePct * 100)}パーセント。${claimed ? '報酬受取済み' : done ? '報酬を受け取れます' : `報酬${challenge.xpReward}XP`}`;
  return (
    <View
      style={[
        styles.questCard,
        {
          backgroundColor: claimed ? theme.colors.surfaceSecondary : theme.colors.surfacePrimary,
          borderColor: theme.colors.borderSubtle,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View
        style={[styles.questHeader, compact && styles.questHeaderCompact]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={summary}
      >
        <View
          style={[
            styles.questIconWrap,
            { backgroundColor: claimed ? theme.colors.surfaceTertiary : theme.colors.surfaceSecondary },
          ]}
          accessibilityElementsHidden
        >
          <Ionicons
            name={claimed ? 'checkmark' : challenge.icon as React.ComponentProps<typeof Ionicons>['name']}
            size={19}
            color={claimed ? theme.colors.textTertiary : theme.colors.accentPrimary}
          />
        </View>
        <View style={styles.questTextBlock}>
          <Text style={[styles.questTitle, { color: claimed ? theme.colors.textTertiary : theme.colors.textPrimary }]}>
            {challenge.title}
          </Text>
          <Text style={[styles.questDesc, { color: claimed ? theme.colors.textTertiary : theme.colors.textSecondary }]}>
            {challenge.desc}
          </Text>
        </View>
        <View style={[styles.questXpBadge, compact && styles.questXpBadgeCompact, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <Text style={[styles.questXpText, { color: claimed ? theme.colors.textTertiary : theme.colors.accentPrimary }]}>
            {claimed ? '受取済' : `+${challenge.xpReward} XP`}
          </Text>
        </View>
      </View>

      <View style={[styles.questProgressRow, compact && styles.questProgressRowCompact]}>
        <View style={[styles.questBarBg, { backgroundColor: theme.colors.surfaceTertiary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View
            style={[
              styles.questBarFill,
              {
                width: `${safePct * 100}%`,
                backgroundColor: claimed ? theme.colors.textTertiary : theme.colors.accentPrimary,
              },
            ]}
          />
        </View>
        {done && !claimed ? (
          <Pressable
            style={({ pressed }) => [
              styles.questClaimBtn,
              compact && styles.questClaimBtnCompact,
              { backgroundColor: theme.colors.accentPrimary },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onClaim();
            }}
            accessibilityRole="button"
            accessibilityLabel={`${challenge.title}の報酬${challenge.xpReward}XPを受け取る`}
          >
            <Text style={[styles.questClaimText, { color: theme.colors.textOnAccent }]}>受け取る</Text>
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
  compact,
  singleColumn,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
  color: string;
  compact: boolean;
  singleColumn: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        compact && styles.statCardCompact,
        singleColumn && styles.statCardSingleColumn,
        {
          backgroundColor: theme.colors.surfacePrimary,
          borderColor: theme.colors.borderSubtle,
          shadowColor: theme.colors.shadow,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label} ${value}`}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${color}14` }]} accessibilityElementsHidden>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

function ProgressRow({
  label,
  discovered,
  total,
  color,
  compact,
}: {
  label: string;
  discovered: number;
  total: number;
  color: string;
  compact: boolean;
}) {
  const theme = useTheme();
  const pct = total > 0 ? Math.max(0, Math.min(discovered / total, 1)) : 0;
  return (
    <View
      style={[styles.progressRow, compact && styles.progressRowCompact]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label} ${discovered}/${total}`}
    >
      <Text style={[styles.progressLabel, compact && styles.progressLabelCompact, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.surfaceTertiary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.progressValue, { color: theme.colors.textPrimary }]}>
        {discovered}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 28 },

  hero: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  heroIdentity: { flex: 1, minWidth: 0 },
  appEyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '800', color: '#E5F1E6', letterSpacing: 1.8, marginBottom: 2 },
  appTitle: { fontSize: 20, lineHeight: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  playerName: { fontSize: 13, lineHeight: 18, color: '#E5F1E6', marginTop: 2 },
  levelBadgeSmall: {
    minHeight: 32,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 11,
    justifyContent: 'center',
  },
  levelBadgeSmallText: { fontSize: 12, lineHeight: 17, fontWeight: '800', color: '#FFFFFF' },
  heroHeadline: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 20, lineHeight: 31, letterSpacing: -0.3 },
  heroSubline: { fontSize: 13, lineHeight: 19, color: '#E5F1E6', marginTop: 3, marginBottom: 18 },
  heroActionRow: { flexDirection: 'row', gap: 10 },
  heroActionRowStacked: { flexDirection: 'column' },
  heroActionButtonStacked: { flex: 0, width: '100%' },
  heroPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  heroPrimaryPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  heroPrimaryBtnText: { fontSize: 16, lineHeight: 22, fontWeight: '800', color: '#174F2A', textAlign: 'center' },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroSecondaryPressed: { backgroundColor: 'rgba(255,255,255,0.18)' },
  heroSecondaryBtnText: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  heroFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  heroFooterRowCompact: { flexWrap: 'wrap' },
  heroFooterText: { fontSize: 11, lineHeight: 15, color: '#E1EFE2', fontWeight: '600' },
  heroXpTrack: { flex: 1, minWidth: 80, height: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 3, overflow: 'hidden' },
  heroXpFill: { height: '100%', backgroundColor: '#E9D96A', borderRadius: 3 },

  milestoneBanner: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8, paddingVertical: 10, gap: 11 },
  milestoneIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },
  milestoneText: { flex: 1, minWidth: 0 },
  milestoneTitle: { fontSize: 14, lineHeight: 19, fontWeight: '800', color: '#FFFFFF' },
  milestoneDesc: { fontSize: 12, lineHeight: 17, color: '#FFF5EC', marginTop: 1 },
  milestoneDismiss: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  glassPressed: { backgroundColor: 'rgba(255,255,255,0.22)' },

  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  sectionHeadingGrow: { flex: 1, minWidth: 190 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 11 },
  sectionTitle: { flexShrink: 1, fontSize: 16, lineHeight: 21, fontWeight: '800' },
  horizontalList: { paddingRight: 16 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sectionBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' },
  sectionLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 12, paddingHorizontal: 8 },
  sectionLinkText: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  sectionBadgeText: { fontSize: 11, lineHeight: 14, fontWeight: '800' },

  recentCard: {
    minHeight: 108,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 3,
    paddingTop: 13,
    paddingBottom: 11,
    paddingHorizontal: 9,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  recentCardCompact: { width: 124, minHeight: 126 },
  recentEmoji: { fontSize: 30, marginBottom: 5 },
  recentName: { fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center' },
  recentDangerDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },

  seasonBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 22, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth },
  seasonBannerCompact: { flexWrap: 'wrap', alignItems: 'flex-start' },
  seasonIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  seasonTextBlock: { flex: 1, minWidth: 170 },
  seasonTitle: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  seasonDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  seasonBadge: { minHeight: 30, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, justifyContent: 'center' },
  seasonBadgeText: { fontSize: 10, lineHeight: 13, fontWeight: '800' },

  spotlightCard: {
    minHeight: 150,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 13,
    paddingHorizontal: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 126,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  spotlightCardCompact: { width: 148, minHeight: 172 },
  spotlightCardUnfound: { borderStyle: 'dashed', shadowOpacity: 0, elevation: 0 },
  spotlightEmoji: { fontSize: 34, marginVertical: 6 },
  spotlightEmojiUnfound: { opacity: 0.42 },
  spotlightName: { fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginBottom: 7 },
  spotlightDangerBadge: { minHeight: 30, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, maxWidth: '100%' },
  spotlightDangerDot: { width: 6, height: 6, borderRadius: 3 },
  spotlightDangerText: { fontSize: 10, lineHeight: 14, fontWeight: '700', maxWidth: 96, textAlign: 'center' },
  spotlightUnfoundBadge: { minHeight: 30, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center' },
  spotlightUnfoundText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },

  learnCard: { borderRadius: 17, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  learnCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  learnCardHeaderCompact: { alignItems: 'flex-start' },
  learnEmojiWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  learnCardEmoji: { fontSize: 25 },
  learnCardTextBlock: { flex: 1, minWidth: 0 },
  learnCardName: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  learnCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' },
  learnCardBadgeText: { fontSize: 11, lineHeight: 15, fontWeight: '700', flexShrink: 1 },
  learnCardTip: { fontSize: 13, lineHeight: 20 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
  statCard: { flexGrow: 1, flexBasis: 100, minWidth: 100, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 13, paddingHorizontal: 7, alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 2 },
  statCardCompact: { flexBasis: '46%', minWidth: '46%' },
  statCardSingleColumn: { flexBasis: '100%', minWidth: '100%' },
  statIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  statValue: { fontSize: 20, fontWeight: '900', lineHeight: 25 },
  statLabel: { fontSize: 11, lineHeight: 15, marginTop: 2, fontWeight: '600', textAlign: 'center' },
  progressCard: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 15, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  progressRowCompact: { flexWrap: 'wrap' },
  progressLabel: { fontSize: 12, lineHeight: 17, flexBasis: 108, flexShrink: 1, fontWeight: '600' },
  progressLabelCompact: { flexBasis: '100%' },
  progressBarContainer: { flex: 1, minWidth: 90, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressValue: { fontSize: 12, lineHeight: 17, fontWeight: '700', minWidth: 44, textAlign: 'right' },

  questCard: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  questHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 11 },
  questHeaderCompact: { flexWrap: 'wrap' },
  questIconWrap: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  questTextBlock: { flex: 1, minWidth: 150 },
  questTitle: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  questDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  questXpBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, alignSelf: 'flex-start' },
  questXpBadgeCompact: { marginLeft: 44 },
  questXpText: { fontSize: 11, lineHeight: 14, fontWeight: '800' },
  questProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questProgressRowCompact: { flexDirection: 'column', alignItems: 'stretch' },
  questBarBg: { flex: 1, minHeight: 7, height: 7, borderRadius: 4, overflow: 'hidden' },
  questBarFill: { height: '100%', borderRadius: 4 },
  questClaimBtn: { minHeight: 44, minWidth: 86, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  questClaimBtnCompact: { width: '100%' },
  questClaimText: { fontSize: 13, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  questAllDone: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 17, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  questAllDoneCompact: { alignItems: 'flex-start' },
  questAllDoneIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  questAllDoneText: { flex: 1, minWidth: 0 },
  questAllDoneTitle: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  questAllDoneDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },

  cardPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  linkPressed: { opacity: 0.58 },
});
