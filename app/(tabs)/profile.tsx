import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PLANTS } from '../../src/data/plants';
import { useGameStore } from '../../src/store/useGameStore';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { Colors } from '../../src/constants/colors';

const TITLES = [
  { minLevel: 1, label: '見習いハーバリスト 🌱' },
  { minLevel: 3, label: 'ハーブ採取師 🌿' },
  { minLevel: 5, label: '野草マスター 🍃' },
  { minLevel: 8, label: '薬草鑑定士 🔬' },
  { minLevel: 12, label: '養生の達人 🏆' },
  { minLevel: 20, label: '伝説の薬育師 ⭐' },
];

function getTitle(level: number): string {
  let title = TITLES[0].label;
  for (const t of TITLES) {
    if (level >= t.minLevel) title = t.label;
  }
  return title;
}

interface AchievementDef {
  id: string;
  icon: string;
  label: string;
  desc: string;
  check: (ids: string[]) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_discovery',
    icon: '🌱',
    label: '初めての発見',
    desc: '初めて植物を発見した',
    check: (ids) => ids.length >= 1,
  },
  {
    id: 'ten_plants',
    icon: '📚',
    label: '図鑑の始まり',
    desc: '10種類の植物を発見した',
    check: (ids) => ids.length >= 10,
  },
  {
    id: 'twenty_five',
    icon: '🏅',
    label: '半分制覇',
    desc: '25種類の植物を発見した',
    check: (ids) => ids.length >= 25,
  },
  {
    id: 'all_fifty',
    icon: '🏆',
    label: '図鑑完成',
    desc: '全50種類の植物を発見した',
    check: (ids) => ids.length >= 50,
  },
  {
    id: 'danger_master',
    icon: '💀',
    label: '毒草の知識',
    desc: '危険（RED）植物を発見した',
    check: (ids) =>
      PLANTS.filter((p) => p.danger === 'RED').some((p) => ids.includes(p.id)),
  },
  {
    id: 'herb_collector',
    icon: '🌿',
    label: 'ハーブ愛好家',
    desc: 'ハーブを10種類発見した',
    check: (ids) =>
      PLANTS.filter((p) => p.category === 'スパイス・ハーブ' && ids.includes(p.id))
        .length >= 10,
  },
  {
    id: 'wild_hunter',
    icon: '🏔️',
    label: '野草ハンター',
    desc: '野草を10種類発見した',
    check: (ids) =>
      PLANTS.filter((p) => p.category === '野草' && ids.includes(p.id)).length >= 10,
  },
  {
    id: 'rare_finder',
    icon: '⭐',
    label: 'レアハンター',
    desc: '★5レアを発見した',
    check: (ids) =>
      PLANTS.filter((p) => p.rarity === 5).some((p) => ids.includes(p.id)),
  },
];

export default function ProfileScreen() {
  const { playerName, xp, discoveredPlantIds, setPlayerName, streak } = useGameStore();
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const level = Math.floor(xp / 500) + 1;
  const xpCurrent = xp % 500;
  const XP_PER_LEVEL = 500;
  const title = getTitle(level);

  const discoveredCount = discoveredPlantIds.length;
  const totalPlants = PLANTS.length;

  async function handleShare() {
    const streakLine = streak > 1 ? `🔥 ${streak}日連続ログイン中！\n` : '';
    const msg =
      `🌿 薬育ポケット コレクション報告\n\n` +
      `プレイヤー: ${playerName}\n` +
      `称号: ${title}\n` +
      `レベル: ${level}  総XP: ${xp}\n` +
      `図鑑: ${discoveredCount}/${totalPlants}種類発見\n` +
      `${streakLine}\n` +
      `#薬育ポケット #野草図鑑 #養生ライフ`;
    try {
      await Share.share({ message: msg });
    } catch {
      Alert.alert('シェアできませんでした');
    }
  }
  const greenCount = PLANTS.filter(
    (p) => p.danger === 'GREEN' && discoveredPlantIds.includes(p.id)
  ).length;
  const yellowCount = PLANTS.filter(
    (p) => p.danger === 'YELLOW' && discoveredPlantIds.includes(p.id)
  ).length;
  const redCount = PLANTS.filter(
    (p) => p.danger === 'RED' && discoveredPlantIds.includes(p.id)
  ).length;
  const rarity5Count = PLANTS.filter(
    (p) => p.rarity === 5 && discoveredPlantIds.includes(p.id)
  ).length;

  function handleSaveName() {
    if (tempName.trim().length > 0) {
      setPlayerName(tempName.trim());
    }
    setEditNameVisible(false);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Hero */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        style={styles.hero}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🧑‍🌾</Text>
        </View>

        {/* Name */}
        <Text style={styles.playerName}>{playerName}</Text>
        <Text style={styles.titleText}>{title}</Text>

        {/* Edit name button */}
        <Pressable
          style={styles.editNameBtn}
          onPress={() => {
            setTempName(playerName);
            setEditNameVisible(true);
          }}
        >
          <Text style={styles.editNameText}>✏️ 名前を変更</Text>
        </Pressable>

        {/* Level */}
        <View style={styles.levelBox}>
          <Text style={styles.levelLabel}>Level {level}</Text>
          <View style={styles.xpBarOuter}>
            <View
              style={[
                styles.xpBarInner,
                { width: `${(xpCurrent / XP_PER_LEVEL) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.xpLabel}>
            {xpCurrent} / {XP_PER_LEVEL} XP（次のレベルまで{XP_PER_LEVEL - xpCurrent}XP）
          </Text>
        </View>

        {/* Streak + Share */}
        <View style={styles.heroBottomRow}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>
              {streak > 0 ? `${streak}日連続` : '今日から開始'}
            </Text>
          </View>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤 シェア</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 コレクション統計</Text>
        <View style={styles.statsGrid}>
          <StatBox label="発見数" value={`${discoveredCount}`} unit={`/ ${PLANTS.length}`} color={Colors.primary} />
          <StatBox label="合計XP" value={String(xp)} unit="XP" color={Colors.rarity5} />
          <StatBox label="食用可能" value={String(greenCount)} unit="種" color={Colors.dangerGreen} />
          <StatBox label="要注意" value={String(yellowCount)} unit="種" color={Colors.dangerYellow} />
          <StatBox label="危険植物" value={String(redCount)} unit="種" color={Colors.dangerRed} />
          <StatBox label="★5レア" value={String(rarity5Count)} unit="種" color={Colors.rarity5} />
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏅 実績バッジ</Text>
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = ach.check(discoveredPlantIds);
            return (
              <View
                key={ach.id}
                style={[styles.achCard, !unlocked && styles.achCardLocked]}
              >
                <Text style={[styles.achIcon, !unlocked && styles.achIconLocked]}>
                  {unlocked ? ach.icon : '🔒'}
                </Text>
                <Text
                  style={[styles.achLabel, !unlocked && styles.achTextLocked]}
                  numberOfLines={2}
                >
                  {ach.label}
                </Text>
                <Text style={styles.achDesc} numberOfLines={2}>
                  {ach.desc}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.section}>
        <DisclaimerBanner />
      </View>

      <View style={{ height: 32 }} />

      {/* Edit Name Modal */}
      <Modal
        visible={editNameVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNameVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditNameVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>名前を変更</Text>
            <TextInput
              style={styles.nameInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="名前を入力..."
              maxLength={20}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setEditNameVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveName}
              >
                <Text style={styles.modalBtnSaveText}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={[styles.statBox, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 48 },
  playerName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  titleText: { fontSize: 13, color: '#C8E6C9', marginTop: 4, marginBottom: 10 },
  editNameBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  editNameText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  levelBox: { width: '100%', gap: 6 },
  levelLabel: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  xpBarOuter: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarInner: { height: '100%', backgroundColor: '#FFEB3B', borderRadius: 6 },
  xpLabel: { fontSize: 11, color: '#C8E6C9', textAlign: 'center' },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },

  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  streakEmoji: { fontSize: 18 },
  streakText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  statValue: { fontSize: 24, fontWeight: '900', lineHeight: 28 },
  statUnit: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 3, textAlign: 'center', fontWeight: '600' },

  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '31%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  achCardLocked: {
    backgroundColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  achIcon: { fontSize: 30, marginBottom: 6 },
  achIconLocked: { opacity: 0.35 },
  achLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'center',
    lineHeight: 14,
  },
  achTextLocked: { color: Colors.textMuted, fontWeight: '600' },
  achDesc: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: Colors.bg },
  modalBtnSave: { backgroundColor: Colors.primary },
  modalBtnCancelText: { color: Colors.textSecondary, fontWeight: '700' },
  modalBtnSaveText: { color: '#FFFFFF', fontWeight: '800' },
});
