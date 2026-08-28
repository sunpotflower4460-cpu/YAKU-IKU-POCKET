import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LookalikeRisk } from '../data/safety';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  warnings: LookalikeRisk[];
}

/**
 * Surfaces dangerous look-alike warnings. Never relies on colour alone — it
 * pairs an icon, a heading and explicit text (accessibility + safety). Shown on
 * scan results and plant detail whenever a plant can be confused with a toxic
 * species, so a (mis)identification is never read as "safe to eat".
 */
export function SafetyBanner({ warnings }: Props) {
  const theme = useTheme();
  if (warnings.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${theme.colors.statusDanger}${theme.mode === 'dark' ? '16' : '0D'}`,
          borderColor: `${theme.colors.statusDanger}66`,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={
        '危険情報。有毒の類似種があります。' +
        warnings.map((w) => w.name).join('、') +
        '。採取・摂取の判断には使用しないでください。'
      }
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.statusDanger}18` }]}>
          <Ionicons name="warning" size={18} color={theme.colors.statusDanger} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.eyebrow, { color: theme.colors.statusDanger }]}>LOOK-ALIKE RISK</Text>
          <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>有毒の類似種に注意</Text>
        </View>
      </View>

      <Text style={[styles.lead, { color: theme.colors.textSecondary }]}>
        見た目が似ていても、安全性は同じとは限りません。次の候補を必ず見比べてください。
      </Text>

      <View style={styles.list}>
        {warnings.map((w) => (
          <View
            key={w.name}
            style={[
              styles.item,
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.itemTitleRow}>
              <Ionicons
                name={w.severity === 'high_risk' ? 'alert-circle' : 'information-circle-outline'}
                size={16}
                color={theme.colors.statusDanger}
              />
              <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                {w.name}
              </Text>
              <View style={[styles.severityChip, { borderColor: `${theme.colors.statusDanger}55` }]}>
                <Text style={[styles.severityText, { color: theme.colors.statusDanger }]}>
                  {w.severity === 'high_risk' ? '重大な危険' : '注意'}
                </Text>
              </View>
            </View>
            <Text style={[styles.itemNote, { color: theme.colors.textSecondary }]}>{w.note}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.borderSubtle }]}>
        <Ionicons name="shield-outline" size={16} color={theme.colors.statusDanger} />
        <Text style={[styles.footerText, { color: theme.colors.statusDanger }]}>
          この観察結果を採取・摂取の判断に使用しないでください。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 1,
  },
  heading: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  lead: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 11,
  },
  list: {
    gap: 8,
  },
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 11,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  severityChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  severityText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },
  itemNote: {
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
});
