import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LookalikeRisk } from '../data/safety';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  warnings: LookalikeRisk[];
}

/**
 * Surfaces dangerous look-alike warnings. Never relies on colour alone — it
 * pairs iconography, explicit labels and text. Each warning remains a separate
 * accessibility stop so screen-reader users can inspect the same detail that
 * sighted users see instead of hearing one oversized summary element.
 *
 * This component is intentionally not a live region: callers such as the scan
 * result already announce the result context. Static safety detail should be
 * explored in document order instead of interrupting with duplicate alerts.
 */
export function SafetyBanner({ warnings }: Props) {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stackSeverity = fontScale >= 1.3 || width < 350;
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
    >
      <View
        style={styles.headerRow}
        accessible
        accessibilityRole="header"
        accessibilityLabel={`類似種に関する安全情報。有毒または危険な類似種が${warnings.length}件あります。`}
      >
        <View
          style={[styles.iconWrap, { backgroundColor: `${theme.colors.statusDanger}18` }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="warning" size={18} color={theme.colors.statusDanger} />
        </View>
        <View style={styles.headerTextWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[styles.eyebrow, { color: theme.colors.statusDanger }]}>類似種リスク</Text>
          <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>有毒・危険な類似種に注意</Text>
        </View>
      </View>

      <Text style={[styles.lead, { color: theme.colors.textSecondary }]}>
        見た目が似ていても、安全性は同じとは限りません。特徴を一つずつ見比べてください。
      </Text>

      <View style={styles.list}>
        {warnings.map((warning) => {
          const severityLabel = warning.severity === 'high_risk' ? '重大な危険' : '注意';
          return (
            <View
              key={warning.name}
              style={[
                styles.item,
                {
                  backgroundColor: theme.colors.surfacePrimary,
                  borderColor: theme.colors.borderSubtle,
                },
              ]}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${warning.name}。${severityLabel}。${warning.note}`}
            >
              <View
                style={[styles.itemTitleRow, stackSeverity && styles.itemTitleRowStacked]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Ionicons
                  name={warning.severity === 'high_risk' ? 'alert-circle' : 'information-circle-outline'}
                  size={16}
                  color={warning.severity === 'high_risk' ? theme.colors.statusDanger : theme.colors.statusCaution}
                />
                <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                  {warning.name}
                </Text>
                <View
                  style={[
                    styles.severityChip,
                    stackSeverity && styles.severityChipStacked,
                    {
                      borderColor: warning.severity === 'high_risk'
                        ? `${theme.colors.statusDanger}55`
                        : `${theme.colors.statusCaution}55`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      {
                        color: warning.severity === 'high_risk'
                          ? theme.colors.statusDanger
                          : theme.colors.statusCaution,
                      },
                    ]}
                  >
                    {severityLabel}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.itemNote, { color: theme.colors.textSecondary }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {warning.note}
              </Text>
            </View>
          );
        })}
      </View>

      <View
        style={[styles.footer, { borderTopColor: theme.colors.borderSubtle }]}
        accessible
        accessibilityRole="text"
        accessibilityLabel="この観察結果を採取や摂取の判断に使用しないでください。"
      >
        <Ionicons
          name="shield-outline"
          size={16}
          color={theme.colors.statusDanger}
          accessibilityElementsHidden
        />
        <Text
          style={[styles.footerText, { color: theme.colors.statusDanger }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
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
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  heading: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  lead: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 11,
  },
  list: { gap: 8 },
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  itemTitleRowStacked: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  itemName: {
    flex: 1,
    minWidth: 120,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  severityChip: {
    maxWidth: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  severityChipStacked: {
    marginLeft: 22,
  },
  severityText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  itemNote: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
});
