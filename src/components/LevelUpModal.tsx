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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { useReduceMotion } from '../utils/reduceMotion';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  visible: boolean;
  level: number;
  title: string;
  onClose: () => void;
}

const STAR_COUNT = 5;

export function LevelUpModal({ visible, level, title, onClose }: Props) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const levelScale = useRef(new Animated.Value(0.82)).current;
  const starAnims = useRef(
    Array.from({ length: STAR_COUNT }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(12),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    cardScale.setValue(reduceMotion ? 1 : 0.96);
    cardOpacity.setValue(1);
    levelScale.setValue(reduceMotion ? 1 : 0.82);
    starAnims.forEach((a) => {
      a.opacity.setValue(reduceMotion ? 1 : 0);
      a.translateY.setValue(reduceMotion ? 0 : 12);
    });

    if (reduceMotion) return;

    const cardAnimation = Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 70,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: theme.motion.stateChange,
        useNativeDriver: true,
      }),
    ]);

    const starAnimations = starAnims.map((a, i) =>
      Animated.sequence([
        Animated.delay(100 + i * 65),
        Animated.parallel([
          Animated.timing(a.opacity, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.spring(a.translateY, {
            toValue: 0,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const levelAnimation = Animated.sequence([
      Animated.delay(220),
      Animated.spring(levelScale, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    cardAnimation.start();
    starAnimations.forEach((animation) => animation.start());
    levelAnimation.start();

    return () => {
      cardAnimation.stop();
      starAnimations.forEach((animation) => animation.stop());
      levelAnimation.stop();
    };
  }, [visible, reduceMotion, cardScale, cardOpacity, levelScale, starAnims, theme.motion.stateChange]);

  function handleContinue() {
    Haptics.selectionAsync();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={false}
        />

        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfacePrimary,
              borderColor: theme.colors.borderSubtle,
              shadowColor: theme.colors.shadow,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['#8A4B08', '#C56A0B', '#E69B24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onClose}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="レベルアップ画面を閉じる"
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.starsRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {starAnims.map((a, i) => (
                <Animated.View
                  key={i}
                  style={{
                    opacity: a.opacity,
                    transform: [{ translateY: a.translateY }],
                  }}
                >
                  <Ionicons name="star" size={22} color="#FFE082" />
                </Animated.View>
              ))}
            </View>

            <Text style={styles.eyebrow}>LEVEL UP</Text>

            <Animated.Text
              style={[
                styles.levelNum,
                { transform: [{ scale: levelScale }] },
              ]}
              accessibilityRole="header"
            >
              Lv.{level}
            </Animated.Text>

            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.messageText}>新しい景色へ、一歩進みました。</Text>

            <Pressable
              style={({ pressed }) => [styles.continueButton, pressed && styles.continuePressed]}
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel="続ける"
            >
              <Text style={styles.continueText}>続ける</Text>
              <Ionicons name="arrow-forward" size={18} color="#8A4B08" />
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 18,
  },
  gradient: {
    paddingTop: 38,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 2.8,
    marginBottom: 4,
  },
  levelNum: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 80,
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.76)',
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
  },
  continueButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  continuePressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  continueText: {
    color: '#8A4B08',
    fontSize: 16,
    fontWeight: '800',
  },
});
