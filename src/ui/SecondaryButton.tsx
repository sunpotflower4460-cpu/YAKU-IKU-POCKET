import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { DynamicText } from './DynamicText';

interface Props extends PressableProps {
  label: string;
  fullWidth?: boolean;
}

/** Level B secondary action — paired with a PrimaryButton, never alone as the loudest element. */
export function SecondaryButton({ label, fullWidth, disabled, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: theme.minTapTarget,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.space[5],
          backgroundColor: pressed ? theme.colors.surfaceTertiary : theme.colors.surfaceSecondary,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      <DynamicText variant="callout" weight="secondary" color={theme.colors.textPrimary}>
        {label}
      </DynamicText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
