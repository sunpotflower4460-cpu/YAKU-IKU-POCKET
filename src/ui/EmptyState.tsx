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
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={icon} size={40} color={theme.colors.textTertiary} />
      </View>
      <DynamicText
        variant="headline"
        weight="secondary"
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
        style={[styles.title, { marginTop: theme.space[3] }]}
      >
        {title}
      </DynamicText>
      {description && (
        <DynamicText
          variant="subheadline"
          color={theme.colors.textSecondary}
          style={[styles.description, { marginTop: theme.space[1] }]}
        >
          {description}
        </DynamicText>
      )}
      {action && (
        <View style={[styles.action, { marginTop: theme.space[4] }]}>
          {action}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24 },
  title: { textAlign: 'center', maxWidth: 520 },
  description: { textAlign: 'center', maxWidth: 520 },
  action: { maxWidth: '100%', alignItems: 'center' },
});
