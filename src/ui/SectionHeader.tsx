import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { DynamicText } from './DynamicText';

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

/** Level B section title used to break a screen into scannable groups. */
export function SectionHeader({ title, action }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { marginBottom: theme.space[2] }]}>
      <DynamicText variant="title3" weight="secondary">
        {title}
      </DynamicText>
      {action && (
        <DynamicText
          variant="footnote"
          weight="secondary"
          color={theme.colors.accentPrimary}
          onPress={action.onPress}
          accessibilityRole="button"
        >
          {action.label}
        </DynamicText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
