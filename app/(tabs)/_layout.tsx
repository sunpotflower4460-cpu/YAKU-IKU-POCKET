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
  const startSession = useGameStore((state) => state.startSession);
  const hasHydrated = useGameStore((state) => state._hasHydrated);
  const sessionDate = useGameStore((state) => state.todayDate);
  const xp = useGameStore((state) => state.xp);

  const currentLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
  const prevLevelRef = useRef<number | null>(null);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, title: '' });

  const tabBottomInset = Math.max(insets.bottom, theme.space[2]);
  const tabBarHeight = 56 + tabBottomInset;

  useEffect(() => {
    if (hasHydrated) startSession();
  }, [hasHydrated, startSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && hasHydrated) startSession();
    });
    return () => subscription.remove();
  }, [hasHydrated, startSession]);

  useEffect(() => {
    if (prevLevelRef.current === null) {
      prevLevelRef.current = currentLevel;
      return;
    }
    if (currentLevel > prevLevelRef.current) {
      setLevelUpData({ level: currentLevel, title: getPlayerTitle(currentLevel) });
      setLevelUpVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  return (
    <>
      <Tabs
        key={sessionDate || 'hydrating'}
        screenOptions={{
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
          tabBarItemStyle: { minHeight: theme.minTapTarget },
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
              <Ionicons name={focused ? 'journal' : 'journal-outline'} size={size} color={color} />
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
