import React from 'react';
import { View, ViewProps, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Z2 interactive surface: the ONLY place a real shadow/elevation belongs.
 * Reserve for primary CTAs, floating controls, or the single selected card
 * in a list — never apply to every card in a grid (see design system §21).
 */
export function ElevatedCard({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surfacePrimary,
          borderRadius: theme.radius.card,
          ...Platform.select({
            ios: {
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: theme.mode === 'dark' ? 0.4 : 0.12,
              shadowRadius: 10,
            },
            android: { elevation: 4 },
            default: {},
          }),
        },
        style,
      ]}
      {...rest}
    />
  );
}
