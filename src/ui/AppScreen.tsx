import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

type BaseProps = {
  children?: React.ReactNode;
  /** Applies horizontal screen padding (theme.space[4]) — default true. */
  padded?: boolean;
};

type StaticProps = BaseProps & ViewProps & {
  scroll?: false;
};

type ScrollProps = BaseProps & ScrollViewProps & {
  scroll: true;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

type Props = StaticProps | ScrollProps;

/**
 * Root screen container (Z0 canvas). Handles safe-area insets and the canvas
 * background colour. Scroll screens apply safe-area and horizontal spacing to
 * the scroll content rather than the viewport so measurement and scrolling
 * remain predictable.
 */
export function AppScreen(props: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const padded = props.padded ?? true;

  if (props.scroll) {
    const { scroll: _scroll, padded: _padded, style, contentContainerStyle, children, ...rest } = props;
    return (
      <ScrollView
        style={[styles.base, { backgroundColor: theme.colors.canvas }, style]}
        contentContainerStyle={[
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + theme.space[8],
            paddingHorizontal: padded ? theme.space[4] : 0,
          },
          contentContainerStyle,
        ]}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  const { scroll: _scroll, padded: _padded, style, children, ...rest } = props;
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.canvas,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingHorizontal: padded ? theme.space[4] : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
