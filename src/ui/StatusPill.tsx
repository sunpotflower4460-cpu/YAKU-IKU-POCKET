import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { DynamicText } from './DynamicText';

export type StatusKind = 'observed' | 'provisional' | 'verified' | 'caution' | 'danger';

const ICON: Record<StatusKind, React.ComponentProps<typeof Ionicons>['name']> = {
  observed: 'eye-outline',
  provisional: 'help-circle-outline',
  verified: 'checkmark-circle-outline',
  caution: 'alert-circle-outline',
  danger: 'warning',
};

interface Props {
  kind: StatusKind;
  label: string;
}

/**
 * Level D-capable status indicator. Always pairs an icon with text — never
 * colour alone — so it reads correctly for colour-blind users and VoiceOver.
 */
export function StatusPill({ kind, label }: Props) {
  const theme = useTheme();
  const colorMap: Record<StatusKind, string> = {
    observed: theme.colors.statusObserved,
    provisional: theme.colors.statusProvisional,
    verified: theme.colors.statusVerified,
    caution: theme.colors.statusCaution,
    danger: theme.colors.statusDanger,
  };
  const color = colorMap[kind];
  return (
    <View
      style={[styles.base, { backgroundColor: color + '22', borderColor: color, borderRadius: theme.radius.pill }]}
      accessibilityLabel={label}
    >
      <Ionicons name={ICON[kind]} size={12} color={color} />
      <DynamicText variant="caption1" weight="secondary" color={color}>
        {label}
      </DynamicText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
});
