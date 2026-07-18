import React from 'react';
import { View, ViewProps, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends ViewProps {
  scroll?: boolean;
  /** Applies horizontal screen padding (theme.space[4]) — default true. */
  padded?: boolean;
}

/**
 * Root screen container (Z0 canvas). Handles safe-area insets and the
 * canvas background colour so individual screens stop repeating this
 * boilerplate. Use `scroll` for scrollable screens (wraps in ScrollView).
 */
export function AppScreen({ scroll = false, padded = true, style, children, ...rest }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;
  return (
    <Container
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.canvas,
          paddingTop: insets.top,
          paddingHorizontal: padded ? theme.space[4] : 0,
        },
        style,
      ]}
      {...(scroll ? { contentContainerStyle: { paddingBottom: insets.bottom + theme.space[8] } } : {})}
      {...rest}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
