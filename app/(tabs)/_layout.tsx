import { Tabs } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/colors';
import { useGameStore, XP_PER_LEVEL } from '../../src/store/useGameStore';
import { LevelUpModal } from '../../src/components/LevelUpModal';
import { getPlayerTitle } from '../../src/utils/playerTitle';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  const startSession = useGameStore((s) => s.startSession);
  const xp = useGameStore((s) => s.xp);

  const currentLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
  const prevLevelRef = useRef<number | null>(null);

  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, title: '' });

  // One-time session init
  useEffect(() => { startSession(); }, []);

  // Detect level-up whenever xp changes
  useEffect(() => {
    if (prevLevelRef.current === null) {
      // First mount — just record current level, don't celebrate
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
        screenOptions={{
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 12,
            height: 68,
            paddingBottom: 10,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
          headerStyle: { backgroundColor: Colors.primaryDark },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'ホーム',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'スキャン',
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  backgroundColor: focused ? Colors.primaryDark : Colors.primary,
                  width: 52,
                  height: 32,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.45,
                  shadowRadius: 6,
                  elevation: 6,
                }}
              >
                <Ionicons name={focused ? 'camera' : 'camera-outline'} size={20} color="#FFFFFF" />
              </View>
            ),
            tabBarActiveTintColor: Colors.primary,
          }}
        />
        <Tabs.Screen
          name="zukan"
          options={{
            title: '図鑑',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'マイページ',
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
