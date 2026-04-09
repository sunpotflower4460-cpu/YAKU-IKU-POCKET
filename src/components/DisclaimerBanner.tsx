import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  compact?: boolean;
}

export function DisclaimerBanner({ compact = false }: Props) {
  if (compact) {
    return (
      <View style={styles.compact}>
        <Ionicons name="warning-outline" size={16} color="#B45309" />
        <Text style={styles.compactText}>
          このアプリの情報は参考目的のみです。採取・摂取前に必ず専門家へご確認ください。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <View style={styles.titleRow}>
        <Ionicons name="warning-outline" size={14} color="#B45309" />
        <Text style={styles.title}>免責事項・安全上の注意</Text>
      </View>
      <Text style={styles.body}>
        {'• 本アプリの情報は教育・参考目的のみです。\n'}
        {'• 野草の採取・摂取は必ず専門家に確認してから行ってください。\n'}
        {'• AI判定は100%正確ではありません。自己判断での摂取は危険です。\n'}
        {'• 毒草・毒きのこによる食中毒は生命に関わります。\n'}
        {'• 本アプリによる損害について運営者は一切責任を負いません。'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFFBF0',
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  body: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 19,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBF0',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 15,
  },
});
