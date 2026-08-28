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
export function PrimaryButton({
  label,
  loading,
  fullWidth,
  disabled,
  accessibilityLabel,
  accessibilityState,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const spokenLabel = accessibilityLabel ?? label;
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${spokenLabel}、処理中` : spokenLabel}
      accessibilityState={{ ...accessibilityState, disabled: !!isDisabled, busy: !!loading }}
      accessibilityLiveRegion={loading ? 'polite' : undefined}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          minHeight: theme.minTapTarget + 8,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.space[6],
          paddingVertical: theme.space[2],
          backgroundColor: state.pressed ? theme.colors.accentPrimaryPressed : theme.colors.accentPrimary,
          opacity: isDisabled && !loading ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={theme.colors.textOnAccent}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
      <DynamicText
        variant="headline"
        weight="secondary"
        color={theme.colors.textOnAccent}
        style={styles.label}
      >
        {label}
      </DynamicText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
});
