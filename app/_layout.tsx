import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

function ThemedStack() {
  const theme = useTheme();
  const detailHeader = theme.mode === 'dark' ? '#10281A' : '#174F2A';

  return (
    <>
      {/* Primary routes begin on dark, nature-toned top surfaces. Keeping the
          navigation chrome dark in both theme modes makes status-bar and back
          controls consistently legible instead of turning the dark-theme
          detail header into a bright accent strip. */}
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="plant/[id]"
          options={{
            title: '植物詳細',
            headerStyle: { backgroundColor: detailHeader },
            headerTintColor: '#FFFFFF',
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
