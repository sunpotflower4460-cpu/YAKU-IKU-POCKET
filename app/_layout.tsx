import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

function ThemedStack() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="plant/[id]"
          options={{
            title: '植物詳細',
            headerStyle: { backgroundColor: theme.colors.accentPrimary },
            headerTintColor: theme.colors.textOnAccent,
            headerTitleStyle: { fontWeight: '700' },
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <ThemedStack />
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
