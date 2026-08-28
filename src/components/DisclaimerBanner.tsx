import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  compact?: boolean;
}

export function DisclaimerBanner({ compact = false }: Props) {
  const theme = useTheme();

  if (compact) {
    return (
      <View
        style={[
          styles.compact,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderTopColor: theme.colors.borderSubtle,
          },
        ]}
        accessible
        accessibilityRole="text"
        accessibilityLabel="安全ガイド。AIの候補は参考情報です。採取や摂取はアプリだけで判断せず、必ず専門家に確認を。"
      >
        <View
          style={[styles.iconWrapCompact, { backgroundColor: theme.colors.surfaceTertiary }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.statusCaution} />
        </View>
        <Text
          style={[styles.compactText, { color: theme.colors.textSecondary }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          AIの候補は参考情報です。採取・摂取はアプリだけで判断せず、必ず専門家に確認を。
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View
        style={styles.titleRow}
        accessible
        accessibilityRole="header"
        accessibilityLabel="安全ガイド。安全に使うために"
      >
        <View
          style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceTertiary }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.statusCaution} />
        </View>
        <View
          style={styles.titleTextWrap}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={[styles.eyebrow, { color: theme.colors.statusCaution }]}>安全ガイド</Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>安全に使うために</Text>
        </View>
      </View>

      <Text style={[styles.lead, { color: theme.colors.textSecondary }]}>
        このアプリは植物を学び、観察を記録するための参考ツールです。AIが示す候補だけで安全性を判断しないでください。
      </Text>

      <View style={[styles.rule, { backgroundColor: theme.colors.borderSubtle }]} accessibilityElementsHidden />

      <SafetyPoint text="野草を採取・摂取する前に、必ず専門家に確認を" />
      <SafetyPoint text="写真やAIの候補だけで「食べられる」と決めない" />
      <SafetyPoint text="体調や安全に不安がある場合は、利用より確認を優先する" />
    </View>
  );
}

function SafetyPoint({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.pointRow} accessible accessibilityRole="text" accessibilityLabel={text}>
      <Ionicons
        name="checkmark-circle-outline"
        size={17}
        color={theme.colors.statusCaution}
        accessibilityElementsHidden
      />
      <Text
        style={[styles.pointText, { color: theme.colors.textSecondary }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleTextWrap: { flex: 1 },
  eyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  lead: {
    fontSize: 14,
    lineHeight: 22,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 13,
  },
  pointRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 7,
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  compact: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconWrapCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
