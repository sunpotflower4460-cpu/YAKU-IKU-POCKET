import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level error boundary. Catches unexpected render errors anywhere in the
 * tree and shows a recoverable fallback instead of a blank white screen
 * (which would otherwise be an instant App Store rejection).
 */
export class ErrorBoundary extends React.Component<Props, State> {
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
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="leaf-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.title}>問題が発生しました</Text>
          <Text style={styles.desc}>
            予期せぬエラーが発生しました。お手数ですが、もう一度お試しください。
          </Text>
          <Pressable style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>再読み込み</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.bg,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: Colors.textMuted,
  },
  btn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  btnText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
});
