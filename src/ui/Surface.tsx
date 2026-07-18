import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends ViewProps {
  /** Z-layer, controls background + border (see docs/DESIGN_SYSTEM.md §4.3). */
  level?: 'primary' | 'secondary' | 'tertiary';
  bordered?: boolean;
  radius?: keyof ReturnType<typeof useTheme>['radius'];
}

/**
 * Base content surface (Z1). Distinguishes itself from the canvas via
 * background + border, not shadow — shadow is reserved for Z2 interactive
 * elements per the design system.
 */
export function Surface({ level = 'primary', bordered = true, radius = 'card', style, ...rest }: Props) {
  const theme = useTheme();
  const bg =
    level === 'primary'
      ? theme.colors.surfacePrimary
      : level === 'secondary'
      ? theme.colors.surfaceSecondary
      : theme.colors.surfaceTertiary;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: theme.radius[radius],
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.borderSubtle,
        },
        style,
      ]}
      {...rest}
    />
  );
}
