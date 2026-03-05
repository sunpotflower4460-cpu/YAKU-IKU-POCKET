import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { getPlantById } from '../../src/data/plants';
import { RarityStars } from '../../src/components/RarityStars';
import { DangerBadge } from '../../src/components/DangerBadge';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { Colors } from '../../src/constants/colors';
import { RARITY_XP } from '../../src/store/useGameStore';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  const plant = getPlantById(id ?? '');

  useLayoutEffect(() => {
    if (plant) {
      navigation.setOptions({ title: plant.name });
    }
  }, [plant, navigation]);

  if (!plant) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>植物が見つかりません</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient
        colors={
          plant.danger === 'RED'
            ? ['#3A0000', '#7B0000', '#C62828']
            : plant.danger === 'YELLOW'
            ? ['#5D1A00', '#E65100', '#F57F17']
            : ['#1B5E20', '#2E7D32', '#43A047']
        }
        style={styles.hero}
      >
        {/* Danger alert banner */}
        {plant.danger === 'RED' && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerText}>
              ☠️ 危険 — この植物は絶対に採取・摂取しないでください
            </Text>
          </View>
        )}
        {plant.danger === 'YELLOW' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningBannerText}>
              ⚠️ 注意が必要な植物です
            </Text>
          </View>
        )}

        {/* Emoji */}
        <View
          style={[
            styles.emojiCircle,
            plant.danger === 'RED' && { backgroundColor: 'rgba(255,0,0,0.2)' },
          ]}
        >
          <Text style={styles.emoji}>{plant.emoji}</Text>
        </View>

        {/* Names */}
        <Text style={styles.plantName}>{plant.name}</Text>
        <Text style={styles.plantNameEn}>{plant.nameEn}</Text>
        <Text style={styles.plantNameLatin}>{plant.nameLatin}</Text>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <RarityStars rarity={plant.rarity} size="lg" />
          <DangerBadge danger={plant.danger} />
        </View>

        {/* Category chip */}
        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>{plant.category}</Text>
        </View>
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        {/* Description */}
        <Section title="📖 説明">
          <Text style={styles.bodyText}>{plant.description}</Text>
        </Section>

        {/* Effects */}
        {plant.effects.length > 0 && (
          <Section title="💊 養生効果・期待される作用">
            <View style={styles.effectTags}>
              {plant.effects.map((effect) => (
                <View key={effect} style={styles.effectTag}>
                  <Text style={styles.effectText}>{effect}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Habitat & Season */}
        <Section title="🗺️ 自生環境・季節">
          <InfoRow icon="📍" label="生息地" value={plant.habitat} />
          <InfoRow icon="📅" label="旬の時期" value={plant.season} />
        </Section>

        {/* Rarity info */}
        <Section title="⭐ レアリティ">
          <View style={styles.rarityDetail}>
            <RarityStars rarity={plant.rarity} size="lg" />
            <Text style={styles.rarityLabel}>
              {
                ['', 'コモン', 'アンコモン', 'レア', 'スーパーレア', 'レジェンダリー'][
                  plant.rarity
                ]
              }
            </Text>
          </View>
          <Text style={styles.rarityXpHint}>
            初回発見 +{RARITY_XP[plant.rarity]}XP
          </Text>
        </Section>

        {/* Warning note */}
        {plant.warningNote && (
          <Section title={plant.danger === 'RED' ? '☠️ 危険情報' : '⚠️ 注意事項'}>
            <View
              style={[
                styles.warningNote,
                plant.danger === 'RED' && styles.warningNoteRed,
              ]}
            >
              <Text
                style={[
                  styles.warningNoteText,
                  plant.danger === 'RED' && styles.warningNoteTextRed,
                ]}
              >
                {plant.warningNote}
              </Text>
            </View>
          </Section>
        )}

        {/* Disclaimer */}
        <DisclaimerBanner />

        {/* Scan CTA */}
        <Pressable
          style={styles.scanCta}
          onPress={() => router.push('/(tabs)/scan')}
        >
          <Text style={styles.scanCtaText}>📷 スキャンを続ける</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontSize: 16, color: Colors.textMuted },

  hero: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  alertBanner: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    width: '100%',
  },
  alertBannerText: {
    color: '#FF8A80',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  warningBanner: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
    width: '100%',
  },
  warningBannerText: {
    color: '#FFE082',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  emojiCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emoji: { fontSize: 64 },
  plantName: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  plantNameEn: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
  plantNameLatin: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    marginTop: 3,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  categoryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  body: { padding: 16 },
  section: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  bodyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  effectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  effectTag: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  effectText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '700' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  infoIcon: { fontSize: 14, width: 20 },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 60,
  },
  infoValue: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 20 },

  rarityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rarityLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  rarityXpHint: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.rarity5,
    marginTop: 8,
  },
  scanCta: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  scanCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  warningNote: {
    backgroundColor: Colors.dangerYellowBg,
    borderColor: '#FFD54F',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  warningNoteRed: {
    backgroundColor: Colors.dangerRedBg,
    borderColor: '#EF9A9A',
  },
  warningNoteText: {
    fontSize: 13,
    color: Colors.dangerYellow,
    lineHeight: 20,
    fontWeight: '600',
  },
  warningNoteTextRed: {
    color: Colors.dangerRed,
    fontWeight: '800',
  },
});
