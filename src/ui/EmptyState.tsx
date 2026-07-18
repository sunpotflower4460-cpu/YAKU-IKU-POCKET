import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { DynamicText } from './DynamicText';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Standard empty state for lists/screens with nothing to show yet. */
export function EmptyState({ icon, title, description, action }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { paddingVertical: theme.space[10] }]}>
      <Ionicons name={icon} size={40} color={theme.colors.textTertiary} />
      <DynamicText variant="headline" weight="secondary" style={{ marginTop: theme.space[3] }}>
        {title}
      </DynamicText>
      {description && (
        <DynamicText
          variant="subheadline"
          color={theme.colors.textSecondary}
          style={{ marginTop: theme.space[1], textAlign: 'center' }}
        >
          {description}
        </DynamicText>
      )}
      {action && <View style={{ marginTop: theme.space[4] }}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24 },
});
