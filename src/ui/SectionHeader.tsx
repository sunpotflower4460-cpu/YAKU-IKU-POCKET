import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
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
      <DynamicText
        variant="title3"
        weight="secondary"
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </DynamicText>
      {action && (
        <Pressable
          style={({ pressed }) => [
            styles.action,
            { minHeight: theme.minTapTarget, borderRadius: theme.radius.control },
            pressed && { backgroundColor: theme.colors.surfaceSecondary },
          ]}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <DynamicText
            variant="footnote"
            weight="secondary"
            color={theme.colors.accentPrimary}
            style={styles.actionText}
          >
            {action.label}
          </DynamicText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: { flexGrow: 1, flexShrink: 1, minWidth: 180 },
  action: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    maxWidth: '100%',
    flexShrink: 1,
  },
  actionText: { textAlign: 'center', flexShrink: 1 },
});
