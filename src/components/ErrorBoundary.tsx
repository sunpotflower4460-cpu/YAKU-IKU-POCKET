import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme, useTheme } from '../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
}

interface BoundaryProps extends Props {
  theme: Theme;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level error boundary. Catches unexpected render errors anywhere in the
 * tree and shows a recoverable fallback instead of a blank screen.
 */
class ErrorBoundaryImpl extends React.Component<BoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Keep a breadcrumb in dev logs; no user-facing PII.
    console.error('[ErrorBoundary] Unhandled render error:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    const { theme } = this.props;

    if (this.state.hasError) {
      return (
        <View style={[styles.container, { backgroundColor: theme.colors.canvas }]}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
            accessibilityElementsHidden
          >
            <Ionicons name="leaf-outline" size={36} color={theme.colors.accentPrimary} />
          </View>

          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            accessibilityRole="header"
          >
            うまく表示できませんでした
          </Text>
          <Text style={[styles.desc, { color: theme.colors.textSecondary }]}>
            一時的な表示エラーが発生しました。下のボタンでもう一度画面を開き直せます。
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.colors.accentPrimary },
              pressed && styles.btnPressed,
            ]}
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="もう一度試す"
          >
            <Ionicons name="refresh" size={19} color={theme.colors.textOnAccent} />
            <Text style={[styles.btnText, { color: theme.colors.textOnAccent }]}>もう一度試す</Text>
          </Pressable>

          <Text style={[styles.helper, { color: theme.colors.textTertiary }]}>
            同じ画面で繰り返す場合は、一度アプリを閉じてから開き直してください。
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundary({ children }: Props) {
  const theme = useTheme();
  return <ErrorBoundaryImpl theme={theme}>{children}</ErrorBoundaryImpl>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    marginTop: 9,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 420,
  },
  btn: {
    minHeight: 52,
    marginTop: 24,
    minWidth: 190,
    paddingHorizontal: 22,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  helper: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 380,
  },
});
