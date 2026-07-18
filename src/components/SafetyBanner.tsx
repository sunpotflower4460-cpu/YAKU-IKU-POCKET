import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LookalikeRisk } from '../data/safety';

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
  if (warnings.length === 0) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={
        '危険情報。有毒の類似種があります。' +
        warnings.map((w) => w.name).join('、') +
        '。採取・摂取の判断には使用しないでください。'
      }
    >
      <View style={styles.headerRow}>
        <Ionicons name="warning" size={16} color={Colors.dangerRed} />
        <Text style={styles.heading}>有毒の類似種に注意</Text>
      </View>
      {warnings.map((w) => (
        <View key={w.name} style={styles.item}>
          <Text style={styles.itemName}>
            {w.name}
            {w.severity === 'high_risk' ? '（重大な危険）' : '（注意）'}
          </Text>
          <Text style={styles.itemNote}>{w.note}</Text>
        </View>
      ))}
      <Text style={styles.footer}>
        この観察結果を採取・摂取の判断に使用しないでください。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.dangerRedBg,
    borderColor: Colors.dangerRed,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  heading: { fontSize: 13, fontWeight: '800', color: Colors.dangerRed },
  item: { marginBottom: 6 },
  itemName: { fontSize: 12, fontWeight: '700', color: Colors.dangerRed },
  itemNote: { fontSize: 12, lineHeight: 17, color: Colors.text },
  footer: { marginTop: 2, fontSize: 11, lineHeight: 16, color: Colors.dangerRed, fontWeight: '700' },
});
