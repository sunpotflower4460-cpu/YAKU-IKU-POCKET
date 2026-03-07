/**
 * ShareCard.tsx
 *
 * A visually rich achievement card that is rendered inside a Modal.
 * The user can preview it and then share a formatted text card via
 * the native Share sheet (no native image-capture modules required).
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Achievement {
  icon: string;
  label: string;
}

interface ShareCardProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  title: string;       // player title / 称号
  level: number;
  xp: number;
  discoveredCount: number;
  totalCount: number;
  streak: number;
  unlockedAchievements: Achievement[];
  season: string;
  seasonEmoji: string;
}

/** Build the ASCII-art style text card that gets shared. */
function buildShareText(props: Omit<ShareCardProps, 'visible' | 'onClose'>): string {
  const {
    playerName, title, level, xp,
    discoveredCount, totalCount, streak,
    unlockedAchievements, season, seasonEmoji,
  } = props;

  const pct = Math.round((discoveredCount / totalCount) * 100);
  const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));

  const achieveLines = unlockedAchievements
    .slice(0, 5)
    .map((a) => `  ${a.icon} ${a.label}`)
    .join('\n');

  const streakLine = streak >= 2 ? `🔥 ${streak}日連続ログイン！\n` : '';

  return (
    `╔══════════════════════════╗\n` +
    `║  🌿 薬育ポケット 実績カード  ║\n` +
    `╠══════════════════════════╣\n` +
    `║ プレイヤー: ${playerName}\n` +
    `║ 称号: ${title}\n` +
    `║ Lv.${level}  総XP: ${xp}\n` +
    `╠══════════════════════════╣\n` +
    `║ 📚 図鑑: ${discoveredCount}/${totalCount}種 (${pct}%)\n` +
    `║ [${bar}]\n` +
    `║ ${seasonEmoji} 現在のシーズン: ${season}\n` +
    (streakLine ? `║ ${streakLine}` : '') +
    `╠══════════════════════════╣\n` +
    (achieveLines ? `║ 解放済み実績:\n${achieveLines}\n` : '') +
    `╚══════════════════════════╝\n` +
    `\n#薬育ポケット #野草図鑑 #養生ライフ`
  );
}

export function ShareCard(props: ShareCardProps) {
  const { visible, onClose, unlockedAchievements, ...rest } = props;
  const {
    playerName, title, level, xp,
    discoveredCount, totalCount, streak,
    season, seasonEmoji,
  } = rest;

  const pct = totalCount > 0 ? discoveredCount / totalCount : 0;
  const barFilled = Math.round(pct * 10);

  async function handleShare() {
    const msg = buildShareText({ ...rest, unlockedAchievements });
    try {
      await Share.share({ message: msg });
    } catch {
      Alert.alert('シェアできませんでした');
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* ── Card preview ── */}
            <LinearGradient
              colors={['#1B5E20', '#2E7D32', '#43A047']}
              style={styles.card}
            >
              {/* Header */}
              <Text style={styles.cardAppName}>🌿 薬育ポケット</Text>
              <Text style={styles.cardSubtitle}>実績カード</Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Player info */}
              <Text style={styles.cardPlayerName}>{playerName}</Text>
              <Text style={styles.cardTitle}>{title}</Text>

              <View style={styles.cardRow}>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatValue}>Lv.{level}</Text>
                  <Text style={styles.cardStatLabel}>レベル</Text>
                </View>
                <View style={styles.cardStatDivider} />
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatValue}>{xp.toLocaleString()}</Text>
                  <Text style={styles.cardStatLabel}>総XP</Text>
                </View>
                <View style={styles.cardStatDivider} />
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatValue}>{streak}</Text>
                  <Text style={styles.cardStatLabel}>連続日数</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Collection progress */}
              <View style={styles.cardProgSection}>
                <Text style={styles.cardProgLabel}>
                  📚 図鑑コレクション
                </Text>
                <Text style={styles.cardProgCount}>
                  {discoveredCount} / {totalCount} 種
                </Text>
              </View>
              <View style={styles.cardBarBg}>
                <View style={[styles.cardBarFill, { width: `${pct * 100}%` }]} />
              </View>
              <Text style={styles.cardBarPct}>{Math.round(pct * 100)}% 達成</Text>

              {/* Season */}
              <View style={styles.cardSeasonRow}>
                <Text style={styles.cardSeasonText}>
                  {seasonEmoji} {season}の養生シーズン
                </Text>
              </View>

              {/* Achievements */}
              {unlockedAchievements.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.cardAchieveTitle}>解放済み実績</Text>
                  <View style={styles.cardAchieveRow}>
                    {unlockedAchievements.slice(0, 6).map((a) => (
                      <View key={a.label} style={styles.cardAchieveBadge}>
                        <Text style={styles.cardAchieveIcon}>{a.icon}</Text>
                        <Text style={styles.cardAchieveLabel} numberOfLines={1}>
                          {a.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Bar codes style dots */}
              <View style={styles.divider} />
              <Text style={styles.cardHashtags}>
                #薬育ポケット  #野草図鑑  #養生ライフ
              </Text>
            </LinearGradient>

            {/* Hint */}
            <Text style={styles.hint}>
              📸 スクリーンショットして投稿 / テキストでシェア
            </Text>

            {/* Buttons */}
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>テキストでシェア</Text>
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>閉じる</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#BDBDBD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },

  // Card
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  cardAppName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#A5D6A7',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 14,
  },
  cardPlayerName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 13,
    color: '#FFD54F',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cardStat: { alignItems: 'center' },
  cardStatValue: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  cardStatLabel: { fontSize: 10, color: '#A5D6A7', marginTop: 2, fontWeight: '600' },
  cardStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Progress
  cardProgSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardProgLabel: { fontSize: 12, color: '#C8E6C9', fontWeight: '700' },
  cardProgCount: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  cardBarBg: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 5,
  },
  cardBarFill: {
    height: '100%',
    backgroundColor: '#FFEB3B',
    borderRadius: 6,
  },
  cardBarPct: {
    fontSize: 11,
    color: '#A5D6A7',
    textAlign: 'right',
    fontWeight: '700',
  },

  // Season
  cardSeasonRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  cardSeasonText: {
    fontSize: 12,
    color: '#C8E6C9',
    fontWeight: '700',
  },

  // Achievements
  cardAchieveTitle: {
    fontSize: 11,
    color: '#A5D6A7',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  cardAchieveRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardAchieveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cardAchieveIcon: { fontSize: 14 },
  cardAchieveLabel: {
    fontSize: 10,
    color: '#E8F5E9',
    fontWeight: '700',
    maxWidth: 80,
  },

  cardHashtags: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Bottom UI
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  shareBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  shareBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
  },
  closeBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
});
