import React from 'react';
import { Pressable, PressableProps, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { DynamicText } from './DynamicText';

interface Props extends PressableProps {
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
}

/** Level A primary CTA. One per screen — do not use for secondary actions. */
export function PrimaryButton({ label, loading, fullWidth, disabled, style, ...rest }: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: theme.minTapTarget + 8,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.space[6],
          backgroundColor: pressed ? theme.colors.accentPrimaryPressed : theme.colors.accentPrimary,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.textOnAccent} />
      ) : (
        <DynamicText variant="headline" weight="secondary" color={theme.colors.textOnAccent}>
          {label}
        </DynamicText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
