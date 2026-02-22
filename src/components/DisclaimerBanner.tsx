import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  compact?: boolean;
}

export function DisclaimerBanner({ compact = false }: Props) {
  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.compactText}>
          ⚠️ このアプリの情報は参考です。採取・摂取前に必ず専門家へご確認ください。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>⚠️ 免責事項・安全上の注意</Text>
      <Text style={styles.body}>
        {'・本アプリの情報は教育・参考目的のみです。\n'}
        {'・野草の採取・摂取は必ず専門家に確認してから行ってください。\n'}
        {'・AI判定は100%正確ではありません。自己判断での摂取は危険です。\n'}
        {'・毒草・毒きのこによる食中毒は生命に関わります。\n'}
        {'・本アプリによる損害について運営者は一切責任を負いません。'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD54F',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 6,
  },
  body: {
    fontSize: 11,
    color: '#BF360C',
    lineHeight: 18,
  },
  compact: {
    backgroundColor: '#FFF8E1',
    borderTopColor: '#FFD54F',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  compactText: {
    fontSize: 11,
    color: '#E65100',
    textAlign: 'center',
  },
});
