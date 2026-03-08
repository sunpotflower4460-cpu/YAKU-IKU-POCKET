import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  level: number;
  title: string;
  onClose: () => void;
}

const STARS = ['⭐', '⭐', '⭐', '⭐', '⭐'];

export function LevelUpModal({ visible, level, title, onClose }: Props) {
  const cardScale = useRef(new Animated.Value(0)).current;
  const levelScale = useRef(new Animated.Value(0.3)).current;
  const starAnims = useRef(
    STARS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(24),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset
      cardScale.setValue(0);
      levelScale.setValue(0.3);
      starAnims.forEach((a) => {
        a.opacity.setValue(0);
        a.translateY.setValue(24);
      });

      // Card entrance
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();

      // Stars staggered
      starAnims.forEach((a, i) => {
        Animated.sequence([
          Animated.delay(150 + i * 80),
          Animated.parallel([
            Animated.timing(a.opacity, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.spring(a.translateY, {
              toValue: 0,
              tension: 70,
              friction: 6,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });

      // Level number bounce
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(levelScale, {
          toValue: 1,
          tension: 40,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 4.5 s
      const timer = setTimeout(onClose, 4500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[styles.card, { transform: [{ scale: cardScale }] }]}
        >
          <LinearGradient
            colors={['#E65100', '#FF8F00', '#FFB300']}
            style={styles.gradient}
          >
            {/* Stars row */}
            <View style={styles.starsRow}>
              {starAnims.map((a, i) => (
                <Animated.Text
                  key={i}
                  style={[
                    styles.starEmoji,
                    {
                      opacity: a.opacity,
                      transform: [{ translateY: a.translateY }],
                    },
                  ]}
                >
                  {STARS[i]}
                </Animated.Text>
              ))}
            </View>

            <Text style={styles.levelUpText}>LEVEL UP!</Text>

            <Animated.Text
              style={[
                styles.levelNum,
                { transform: [{ scale: levelScale }] },
              ]}
            >
              Lv.{level}
            </Animated.Text>

            <Text style={styles.titleText}>{title}</Text>

            <Text style={styles.tapHint}>タップして閉じる</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF8F00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 20,
  },
  gradient: {
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  starEmoji: { fontSize: 28 },
  levelUpText: {
    fontSize: 20,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 4,
    marginBottom: 6,
  },
  levelNum: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 88,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.95)',
    marginTop: 10,
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 28,
  },
});
