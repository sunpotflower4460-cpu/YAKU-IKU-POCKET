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
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/colors';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { useGameStore } from '../../src/store/useGameStore';
import { getCurrentSeason, SEASON_CONFIG } from '../../src/utils/season';

interface FeatureCard {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  route: string;
  gradient: [string, string];
  iconName: keyof typeof Ionicons.glyphMap;
}

const FEATURES: FeatureCard[] = [
  {
    id: 'ai-chat',
    title: '健康相談AI',
    subtitle: 'あなたのコレクションをもとに\nパーソナライズ養生アドバイス',
    emoji: '🤖',
    route: '/ai-chat',
    gradient: ['#2E7D32', '#1B5E20'],
    iconName: 'chatbubble-ellipses',
  },
  {
    id: 'symptom',
    title: '症状から探す',
    subtitle: '気になる症状から\n対応する薬草・ハーブを検索',
    emoji: '🔍',
    route: '/symptom-search',
    gradient: ['#1565C0', '#0D47A1'],
    iconName: 'search',
  },
  {
    id: 'recipe',
    title: 'レシピ提案',
    subtitle: '手持ちの材料から\n養生レシピをAIが提案',
    emoji: '🍵',
    route: '/recipe-suggest',
    gradient: ['#E65100', '#BF360C'],
    iconName: 'restaurant',
  },
  {
    id: 'meditation',
    title: '瞑想タイマー',
    subtitle: '心を整えるガイド付き\n瞑想セッション',
    emoji: '🧘',
    route: '/meditation',
    gradient: ['#6A1B9A', '#4A148C'],
    iconName: 'moon',
  },
  {
    id: 'quiz',
    title: '薬草クイズ',
    subtitle: '植物の知識を深める\n楽しいクイズに挑戦',
    emoji: '🎯',
    route: '/quiz',
    gradient: ['#F57F17', '#E65100'],
    iconName: 'help-circle',
  },
];

// Today's health advice based on season
const SEASONAL_ADVICE: Record<string, { title: string; body: string; emoji: string }> = {
  春: {
    emoji: '🌸',
    title: '春の養生ポイント',
    body: '春は肝（かん）の季節。デトックスと血液の浄化を意識しましょう。タンポポやドクダミのお茶がおすすめです。また、春は気の巡りが活発になるため、深呼吸と軽い運動を心がけて。',
  },
  夏: {
    emoji: '☀️',
    title: '夏の養生ポイント',
    body: '夏は心（しん）の季節。熱を冷まし、水分補給を意識しましょう。ミントやドクダミの冷茶が体の余分な熱を取ります。睡眠不足と冷房のかけすぎに注意して。',
  },
  秋: {
    emoji: '🍂',
    title: '秋の養生ポイント',
    body: '秋は肺（はい）の季節。乾燥から体を守りましょう。ペパーミントティーや梨・れんこんで肺を潤すことが大切。空咳や皮膚の乾燥が気になり始めたら、加湿と水分補給を。',
  },
  冬: {
    emoji: '❄️',
    title: '冬の養生ポイント',
    body: '冬は腎（じん）の季節。体を温め、エネルギーを蓄える時期です。生姜・ヨモギで体の芯を温めましょう。早寝早起きを心がけ、腎を消耗しないように。',
  },
};

export default function HealthScreen() {
  const router = useRouter();
  const { discoveredPlantIds, meditationSessions, quizHighScore } = useGameStore();
  const season = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[season];
  const advice = SEASONAL_ADVICE[season];

  const handleFeaturePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as never);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <DisclaimerBanner />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🌿</Text>
        <Text style={styles.headerTitle}>養生メニュー</Text>
        <Text style={styles.headerSubtitle}>
          あなたの健康をサポートする機能
        </Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{discoveredPlantIds.length}</Text>
            <Text style={styles.statLabel}>収集植物</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{meditationSessions}</Text>
            <Text style={styles.statLabel}>瞑想回数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{quizHighScore}</Text>
            <Text style={styles.statLabel}>クイズ最高点</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Today's Seasonal Advice */}
      <View style={styles.section}>
        <View style={[styles.adviceCard, { borderLeftColor: seasonCfg.color }]}>
          <View style={styles.adviceHeader}>
            <Text style={styles.adviceEmoji}>{advice.emoji}</Text>
            <Text style={[styles.adviceTitle, { color: seasonCfg.color }]}>
              {advice.title}
            </Text>
          </View>
          <Text style={styles.adviceBody}>{advice.body}</Text>
        </View>
      </View>

      {/* Feature Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>機能一覧</Text>
        {FEATURES.map((feature) => (
          <Pressable
            key={feature.id}
            onPress={() => handleFeaturePress(feature.route)}
            style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
          >
            <LinearGradient
              colors={feature.gradient}
              style={styles.featureGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </Pressable>
        ))}
      </View>

      {/* Eastern Medicine Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>養生の柱</Text>
        <View style={styles.pillarsRow}>
          {[
            { emoji: '🀄', label: '東洋医学' },
            { emoji: '🍲', label: '薬膳' },
            { emoji: '🌺', label: 'アーユルヴェーダ' },
            { emoji: '🌿', label: '西洋ハーブ' },
          ].map((item) => (
            <View key={item.label} style={styles.pillarItem}>
              <Text style={styles.pillarEmoji}>{item.emoji}</Text>
              <Text style={styles.pillarLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.pillarsNote}>
          複数の伝統医学の視点から、あなたに合った養生法をご提案します。
        </Text>
      </View>

      <View style={{ height: 32 }} />
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
    padding: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textWhite,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adviceCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  adviceEmoji: {
    fontSize: 22,
  },
  adviceTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  adviceBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  featureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  featureCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  featureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 26,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textWhite,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
  },
  pillarsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pillarItem: {
    alignItems: 'center',
    gap: 6,
  },
  pillarEmoji: {
    fontSize: 28,
  },
  pillarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pillarsNote: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
