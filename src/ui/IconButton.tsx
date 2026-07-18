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
 * read to VoiceOver). Visual size can be smaller than the tap target — the
 * padding here keeps the hit area at 44x44pt regardless of icon size.
 */
export function IconButton({ icon, accessibilityLabel, size = 20, variant = 'plain', style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          width: theme.minTapTarget,
          height: theme.minTapTarget,
          borderRadius: theme.radius.pill,
          backgroundColor:
            variant === 'surface' ? (pressed ? theme.colors.surfaceTertiary : theme.colors.surfaceSecondary) : 'transparent',
        },
        typeof style === 'function' ? undefined : style,
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
