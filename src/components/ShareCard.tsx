import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

interface Achievement {
  icon: string;
  label: string;
}

interface ShareCardProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  title: string;
  level: number;
  xp: number;
  discoveredCount: number;
  totalCount: number;
  streak: number;
  unlockedAchievements: Achievement[];
  season: string;
  seasonIcon: string;
}

function buildShareText(props: Omit<ShareCardProps, 'visible' | 'onClose'>): string {
  const {
    playerName,
    title,
    level,
    xp,
    discoveredCount,
    totalCount,
    streak,
    unlockedAchievements,
    season,
  } = props;
  const pct = totalCount > 0 ? Math.round(Math.min(discoveredCount / totalCount, 1) * 100) : 0;
  const achievements = unlockedAchievements.slice(0, 3).map((achievement) => achievement.label);

  return [
    '薬育ポケット｜観察サマリー',
    '',
    `${playerName} — ${title}`,
    `🌿 植物の記録 ${discoveredCount}/${totalCount}種（${pct}%）`,
    `📓 Level ${level} · ${xp.toLocaleString()} XP`,
    `🍃 ${season}のフィールドノート`,
    ...(streak >= 2 ? [`🗓️ ${streak}日連続で継続中`] : []),
    ...(achievements.length > 0 ? [`🏷️ ${achievements.join(' / ')}`] : []),
    '',
    '#薬育ポケット #植物観察 #フィールドノート',
  ].join('\n');
}

export function ShareCard(props: ShareCardProps) {
  const { visible, onClose, unlockedAchievements, ...rest } = props;
  const {
    playerName,
    title,
    level,
    xp,
    discoveredCount,
    totalCount,
    streak,
    season,
    seasonIcon,
  } = rest;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pct = totalCount > 0 ? Math.min(discoveredCount / totalCount, 1) : 0;

  async function handleShare() {
    const message = buildShareText({ ...rest, unlockedAchievements });
    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('共有できませんでした', 'もう一度お試しください。');
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.canvasElevated,
              borderColor: theme.colors.borderSubtle,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              shadowColor: theme.colors.shadow,
            },
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.borderStrong }]} accessibilityElementsHidden />

          <View style={styles.sheetTitleRow}>
            <View style={[styles.sheetTitleIcon, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Ionicons name="leaf-outline" size={20} color={theme.colors.accentPrimary} />
            </View>
            <View style={styles.sheetTitleText}>
              <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">
                観察サマリー
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.colors.textTertiary }]}>
                今までの記録を、ひとつのカードに
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.iconClose, pressed && styles.pressed]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="観察サマリーを閉じる"
            >
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <LinearGradient
              colors={theme.mode === 'dark'
                ? ['#0D2A19', '#17442A', '#225B36']
                : ['#174F2A', '#246B37', '#39844A']}
              style={styles.card}
              accessible
              accessibilityRole="summary"
              accessibilityLabel={`${playerName}の観察サマリー。${discoveredCount}種類を記録。レベル${level}。`}
            >
              <View style={styles.cardBrandRow}>
                <View style={styles.brandMark}>
                  <Ionicons name="leaf" size={16} color="#E4F4E6" />
                </View>
                <Text style={styles.cardAppName}>薬育ポケット</Text>
                <Text style={styles.cardEyebrow}>FIELD NOTE</Text>
              </View>

              <View style={styles.cardIdentity}>
                <Text style={styles.cardPlayerName} numberOfLines={1}>{playerName}</Text>
                <Text style={styles.cardTitle}>{title}</Text>
              </View>

              <View style={styles.cardStatRow}>
                <CardStat value={`${discoveredCount}/${totalCount}`} label="植物の記録" />
                <View style={styles.cardStatDivider} />
                <CardStat value={`Lv.${level}`} label="レベル" />
                <View style={styles.cardStatDivider} />
                <CardStat value={xp.toLocaleString()} label="XP" />
              </View>

              <View style={styles.progressBlock}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>図鑑の記録</Text>
                  <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
                </View>
              </View>

              <View style={styles.seasonRow}>
                <Ionicons
                  name={seasonIcon as React.ComponentProps<typeof Ionicons>['name']}
                  size={17}
                  color="#CBE7CF"
                />
                <Text style={styles.seasonText}>{season}のフィールドノート</Text>
                {streak >= 2 && (
                  <View style={styles.streakPill}>
                    <Ionicons name="calendar-outline" size={13} color="#E8F3E9" />
                    <Text style={styles.streakText}>{streak}日継続</Text>
                  </View>
                )}
              </View>

              {unlockedAchievements.length > 0 && (
                <View style={styles.achievementBlock}>
                  <Text style={styles.achievementTitle}>これまでの記録</Text>
                  <View style={styles.achievementRow}>
                    {unlockedAchievements.slice(0, 4).map((achievement) => (
                      <View key={achievement.label} style={styles.achievementPill}>
                        <Ionicons
                          name={achievement.icon as React.ComponentProps<typeof Ionicons>['name']}
                          size={14}
                          color="#D4EBD7"
                        />
                        <Text style={styles.achievementLabel} numberOfLines={1}>{achievement.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.cardFooterLine} />
                <Text style={styles.cardFooterText}>自然を見るほど、世界は少し深くなる。</Text>
              </View>
            </LinearGradient>

            <View style={[styles.shareNote, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Ionicons name="information-circle-outline" size={17} color={theme.colors.textTertiary} />
              <Text style={[styles.shareNoteText, { color: theme.colors.textSecondary }]}>
                共有ボタンでは、読みやすいテキスト版の観察サマリーを送れます。カード画像として残したい場合はスクリーンショットも使えます。
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.shareBtn, { backgroundColor: theme.colors.accentPrimary }, pressed && styles.pressed]}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="観察サマリーを共有"
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.textOnAccent} />
              <Text style={[styles.shareBtnText, { color: theme.colors.textOnAccent }]}>観察サマリーを共有</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.closeBtn, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderSubtle }, pressed && styles.pressed]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="閉じる"
            >
              <Text style={[styles.closeBtnText, { color: theme.colors.textSecondary }]}>閉じる</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CardStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.cardStat}>
      <Text style={styles.cardStatValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.cardStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '94%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 20,
  },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 13 },
  sheetTitleRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sheetTitleIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sheetTitleText: { flex: 1 },
  sheetTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  sheetSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 1 },
  iconClose: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 4 },
  card: { borderRadius: 22, padding: 18, overflow: 'hidden' },
  cardBrandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.11)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  cardAppName: { fontSize: 14, lineHeight: 20, fontWeight: '800', color: '#FFFFFF' },
  cardEyebrow: { marginLeft: 'auto', fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.6, color: 'rgba(230,247,232,0.58)' },
  cardIdentity: { paddingVertical: 22, alignItems: 'center' },
  cardPlayerName: { maxWidth: '100%', fontSize: 24, lineHeight: 31, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  cardTitle: { fontSize: 13, lineHeight: 19, fontWeight: '700', color: '#CBE7CF', textAlign: 'center', marginTop: 4 },
  cardStatRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  cardStat: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 3 },
  cardStatValue: { maxWidth: '100%', fontSize: 17, lineHeight: 23, fontWeight: '900', color: '#FFFFFF' },
  cardStatLabel: { fontSize: 10, lineHeight: 14, fontWeight: '600', color: '#B8D9BD', marginTop: 2 },
  cardStatDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: 'rgba(255,255,255,0.14)' },
  progressBlock: { marginTop: 17 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { fontSize: 12, lineHeight: 17, fontWeight: '700', color: '#CBE7CF' },
  progressPct: { fontSize: 12, lineHeight: 17, fontWeight: '800', color: '#FFFFFF' },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.14)' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#D9DD73' },
  seasonRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13 },
  seasonText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '700', color: '#CBE7CF' },
  streakPill: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 9 },
  streakText: { fontSize: 10, lineHeight: 14, fontWeight: '700', color: '#E8F3E9' },
  achievementBlock: { marginTop: 12 },
  achievementTitle: { fontSize: 11, lineHeight: 16, fontWeight: '800', color: '#CBE7CF', marginBottom: 8 },
  achievementRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  achievementPill: { maxWidth: '100%', minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.09)', paddingHorizontal: 9 },
  achievementLabel: { flexShrink: 1, fontSize: 10, lineHeight: 14, fontWeight: '700', color: '#E5F2E7' },
  cardFooter: { marginTop: 17 },
  cardFooterLine: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.14)', marginBottom: 12 },
  cardFooterText: { fontSize: 11, lineHeight: 17, color: 'rgba(232,246,234,0.68)', textAlign: 'center' },
  shareNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 14, padding: 12, marginTop: 12, marginBottom: 12 },
  shareNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  shareBtn: { minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  shareBtnText: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  closeBtn: { minHeight: 48, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  closeBtnText: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
