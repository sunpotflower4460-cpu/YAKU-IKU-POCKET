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
        accessibilityRole="text"
      >
        <View style={[styles.iconWrapCompact, { backgroundColor: theme.colors.surfaceTertiary }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.statusCaution} />
        </View>
        <Text style={[styles.compactText, { color: theme.colors.textSecondary }]}>
          AI判定は参考情報です。採取・摂取はアプリだけで判断せず、必ず専門家に確認してください。
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
      accessibilityRole="text"
    >
      <View style={styles.titleRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceTertiary }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.statusCaution} />
        </View>
        <View style={styles.titleTextWrap}>
          <Text style={[styles.eyebrow, { color: theme.colors.statusCaution }]}>SAFETY</Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>安全に使うために</Text>
        </View>
      </View>

      <Text style={[styles.lead, { color: theme.colors.textSecondary }]}>
        このアプリは植物を学び、観察を記録するための参考ツールです。AIの候補だけで安全性を判断しないでください。
      </Text>

      <View style={[styles.rule, { backgroundColor: theme.colors.borderSubtle }]} />

      <View style={styles.pointRow}>
        <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.statusCaution} />
        <Text style={[styles.pointText, { color: theme.colors.textSecondary }]}>
          野草を採取・摂取する前に、必ず専門家へ確認する
        </Text>
      </View>
      <View style={styles.pointRow}>
        <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.statusCaution} />
        <Text style={[styles.pointText, { color: theme.colors.textSecondary }]}>
          写真やAI判定だけで「食べられる」と決めない
        </Text>
      </View>
      <View style={styles.pointRow}>
        <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.statusCaution} />
        <Text style={[styles.pointText, { color: theme.colors.textSecondary }]}>
          体調や安全に不安がある場合は、利用より確認を優先する
        </Text>
      </View>
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
  titleTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 1,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  lead: {
    fontSize: 14,
    lineHeight: 21,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 13,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconWrapCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
