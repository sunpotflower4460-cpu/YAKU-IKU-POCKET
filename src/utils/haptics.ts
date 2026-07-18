import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// expo-haptics throws on web ("not available on web") instead of no-oping,
// which crashes any interaction that triggers haptic feedback when running
// the web build (`npm run web`, `build:web` — a supported target per
// CLAUDE.md and vercel.json). This wrapper makes haptics a no-op on web and
// swallows any other platform error so feedback is best-effort everywhere.

export function impactAsync(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(style).catch(() => {});
}

export function notificationAsync(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(type).catch(() => {});
}

export function selectionAsync() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
