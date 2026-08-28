import React from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, useTheme } from '../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
}

interface BoundaryProps extends Props {
  theme: Theme;
  safeTop: number;
  safeBottom: number;
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
  private titleRef = React.createRef<React.ElementRef<typeof Text>>();
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Keep a breadcrumb in dev logs; no user-facing PII.
    console.error('[ErrorBoundary] Unhandled render error:', error);
  }

  componentDidUpdate(_prevProps: BoundaryProps, prevState: State) {
    if (!prevState.hasError && this.state.hasError) {
      this.focusTimer = setTimeout(() => {
        const node = findNodeHandle(this.titleRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 80);
    }
  }

  componentWillUnmount() {
    if (this.focusTimer) clearTimeout(this.focusTimer);
  }

  handleReset = () => {
    if (this.focusTimer) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }
    this.setState({ hasError: false });
  };

  render() {
    const { theme, safeTop, safeBottom } = this.props;

    if (this.state.hasError) {
      return (
        <>
          <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
          <ScrollView
            style={{ backgroundColor: theme.colors.canvas }}
            contentContainerStyle={[
              styles.container,
              {
                paddingTop: Math.max(40, safeTop + 24),
                paddingBottom: Math.max(40, safeBottom + 24),
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.borderSubtle,
                },
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Ionicons name="leaf-outline" size={36} color={theme.colors.accentPrimary} />
            </View>

            <Text
              ref={this.titleRef}
              style={[styles.title, { color: theme.colors.textPrimary }]}
              accessibilityRole="header"
              accessibilityLiveRegion="assertive"
              accessibilityLabel="うまく表示できませんでした"
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
              accessibilityHint="エラー画面を閉じて、アプリの表示をやり直します"
            >
              <Ionicons name="refresh" size={19} color={theme.colors.textOnAccent} />
              <Text style={[styles.btnText, { color: theme.colors.textOnAccent }]}>もう一度試す</Text>
            </Pressable>

            <Text style={[styles.helper, { color: theme.colors.textTertiary }]}>
              同じ画面で繰り返す場合は、一度アプリを閉じてから開き直してください。
            </Text>
          </ScrollView>
        </>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundary({ children }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ErrorBoundaryImpl theme={theme} safeTop={insets.top} safeBottom={insets.bottom}>
      {children}
    </ErrorBoundaryImpl>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
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
    maxWidth: '100%',
    paddingHorizontal: 22,
    paddingVertical: 10,
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
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  helper: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 380,
  },
});
