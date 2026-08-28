import { Tabs } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View, AppState, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../src/utils/haptics';
import { useGameStore, XP_PER_LEVEL } from '../../src/store/useGameStore';
import { LevelUpModal } from '../../src/components/LevelUpModal';
import { getPlayerTitle } from '../../src/utils/playerTitle';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const startSession = useGameStore((s) => s.startSession);
  const hasHydrated = useGameStore((s) => s._hasHydrated);
  const sessionDate = useGameStore((s) => s.todayDate);
  const xp = useGameStore((s) => s.xp);

  const currentLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
  const prevLevelRef = useRef<number | null>(null);

  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, title: '' });

  // Keep the bar comfortably above the home indicator without making devices
  // with no bottom inset feel unnecessarily tall.
  const tabBottomInset = Math.max(insets.bottom, theme.space[2]);
  const tabBarHeight = 56 + tabBottomInset;

  // One-time session init — wait until persisted state has loaded so streak /
  // daily-quest resets never run against default (empty) state.
  useEffect(() => {
    if (hasHydrated) startSession();
  }, [hasHydrated, startSession]);

  // Re-check the date when the app returns to the foreground, so leaving the
  // app open across midnight still resets daily/monthly quests and streaks.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && hasHydrated) startSession();
    });
    return () => sub.remove();
  }, [hasHydrated, startSession]);

  // Detect level-up whenever xp changes.
  useEffect(() => {
    if (prevLevelRef.current === null) {
      // First mount — just record current level, don't celebrate.
      prevLevelRef.current = currentLevel;
      return;
    }
    if (currentLevel > prevLevelRef.current) {
      setLevelUpData({
        level: currentLevel,
        title: getPlayerTitle(currentLevel),
      });
      setLevelUpVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  return (
    <>
      <Tabs
        // Several screens intentionally memoize "current month/day" UI data.
        // When startSession observes a date rollover after foregrounding, remount
        // the screen subtree once so those mount-time calendars cannot remain
        // stuck on yesterday / the previous month.
        key={sessionDate || 'hydrating'}
        screenOptions={{
          // Every tab already owns an immersive/custom top area (home hero,
          // camera controls, collection header, profile hero). Keeping the
          // navigator header would duplicate hierarchy and consume vertical
          // space, especially on smaller phones.
          headerShown: false,
          tabBarActiveTintColor: theme.colors.accentPrimary,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: theme.colors.canvasElevated,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.borderSubtle,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: theme.mode === 'dark' ? 0.22 : 0.08,
            shadowRadius: 10,
            elevation: 12,
            height: tabBarHeight,
            paddingBottom: tabBottomInset,
            paddingTop: theme.space[2],
          },
          tabBarItemStyle: {
            minHeight: theme.minTapTarget,
          },
          tabBarLabelStyle: {
            fontSize: theme.type.caption1,
            fontWeight: theme.weight.secondary,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '今日',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: '観察',
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  backgroundColor: focused
                    ? theme.colors.accentPrimaryPressed
                    : theme.colors.accentPrimary,
                  width: 52,
                  height: 34,
                  borderRadius: theme.radius.pill,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: focused ? 0.22 : 0.12,
                  shadowRadius: 5,
                  elevation: focused ? 5 : 2,
                }}
              >
                <Ionicons
                  name={focused ? 'camera' : 'camera-outline'}
                  size={20}
                  color={theme.colors.textOnAccent}
                />
              </View>
            ),
            tabBarActiveTintColor: theme.colors.accentPrimary,
          }}
        />
        <Tabs.Screen
          name="zukan"
          options={{
            title: '探す',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '記録',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <LevelUpModal
        visible={levelUpVisible}
        level={levelUpData.level}
        title={levelUpData.title}
        onClose={() => setLevelUpVisible(false)}
      />
    </>
  );
}
