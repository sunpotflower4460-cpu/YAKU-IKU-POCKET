import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends TextProps {
  variant?: keyof ReturnType<typeof useTheme>['type'];
  weight?: keyof ReturnType<typeof useTheme>['weight'];
  color?: string;
}

/**
 * Text that scales with the system's Dynamic Type setting. Font size and line
 * height come from the same semantic variant so large text keeps predictable
 * rhythm instead of inheriting platform-dependent leading.
 */
export function DynamicText({ variant = 'body', weight = 'regular', color, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <Text
      allowFontScaling
      style={[
        {
          fontSize: theme.type[variant],
          lineHeight: theme.lineHeight[variant],
          fontWeight: theme.weight[weight],
          color: color ?? theme.colors.textPrimary,
        },
        styles.base,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
