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
      {/* All primary routes start on a dark/colored top surface (custom tab
          heroes/camera or the plant-detail accent header), so light status-bar
          content gives reliable contrast in both theme modes. ErrorBoundary
          overrides this when it presents its light recovery screen. */}
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="plant/[id]"
          options={{
            title: '植物詳細',
            headerStyle: { backgroundColor: theme.colors.accentPrimary },
            headerTintColor: theme.colors.textOnAccent,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
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
