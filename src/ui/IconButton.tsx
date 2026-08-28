import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends PressableProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  size?: number;
  variant?: 'plain' | 'surface';
}

/**
 * Icon-only control. Always requires accessibilityLabel (icons alone don't
 * read to VoiceOver). The control itself is a full 44x44pt tap target; callers
 * may opt into extra hitSlop only when surrounding controls cannot overlap.
 */
export function IconButton({
  icon,
  accessibilityLabel,
  size = 20,
  variant = 'plain',
  disabled,
  accessibilityState,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        {
          width: theme.minTapTarget,
          height: theme.minTapTarget,
          borderRadius: theme.radius.pill,
          backgroundColor:
            variant === 'surface' ? (state.pressed ? theme.colors.surfaceTertiary : theme.colors.surfaceSecondary) : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Ionicons name={icon} size={size} color={theme.colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
