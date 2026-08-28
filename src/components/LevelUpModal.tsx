import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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

const MOTIF_COUNT = 3;
const MOTIF_ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'leaf-outline',
  'sparkles-outline',
  'compass-outline',
];

export function LevelUpModal({ visible, level, title, onClose }: Props) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const { height, fontScale } = useWindowDimensions();
  const compactLayout = height < 650 || fontScale >= 1.3;
  const cardMaxHeight = Math.max(360, height - 32);
  const cardScale = useRef(new Animated.Value(0.97)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const levelScale = useRef(new Animated.Value(0.9)).current;
  const motifAnims = useRef(
    Array.from({ length: MOTIF_COUNT }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(10),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    cardScale.setValue(reduceMotion ? 1 : 0.97);
    cardOpacity.setValue(1);
    levelScale.setValue(reduceMotion ? 1 : 0.9);
    motifAnims.forEach((animation) => {
      animation.opacity.setValue(reduceMotion ? 1 : 0);
      animation.translateY.setValue(reduceMotion ? 0 : 10);
    });

    if (reduceMotion) return;

    const cardAnimation = Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 72,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: theme.motion.stateChange,
        useNativeDriver: true,
      }),
    ]);

    const motifAnimations = motifAnims.map((animation, index) =>
      Animated.sequence([
        Animated.delay(110 + index * 80),
        Animated.parallel([
          Animated.timing(animation.opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(animation.translateY, {
            toValue: 0,
            tension: 68,
            friction: 9,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const levelAnimation = Animated.sequence([
      Animated.delay(180),
      Animated.spring(levelScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    cardAnimation.start();
    motifAnimations.forEach((animation) => animation.start());
    levelAnimation.start();

    return () => {
      cardAnimation.stop();
      motifAnimations.forEach((animation) => animation.stop());
      levelAnimation.stop();
    };
  }, [visible, reduceMotion, cardScale, cardOpacity, levelScale, motifAnims, theme.motion.stateChange]);

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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />

        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.card,
            {
              maxHeight: cardMaxHeight,
              backgroundColor: theme.colors.surfacePrimary,
              borderColor: theme.colors.borderSubtle,
              shadowColor: theme.colors.shadow,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <LinearGradient
            colors={theme.mode === 'dark'
              ? ['#102A1A', '#1A4028', '#2B5834']
              : ['#17472A', '#28623A', '#4C7543']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientShell}
          >
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="成長の記録を閉じる"
            >
              <Ionicons name="close" size={21} color="#FFFFFF" />
            </Pressable>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                compactLayout && styles.contentCompact,
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View
                style={[styles.motifsRow, compactLayout && styles.motifsRowCompact]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {motifAnims.map((animation, index) => (
                  <Animated.View
                    key={MOTIF_ICONS[index]}
                    style={[
                      styles.motifCircle,
                      {
                        opacity: animation.opacity,
                        transform: [{ translateY: animation.translateY }],
                      },
                    ]}
                  >
                    <Ionicons name={MOTIF_ICONS[index]} size={20} color="#DCE6A1" />
                  </Animated.View>
                ))}
              </View>

              <Text style={styles.eyebrow}>成長の記録</Text>

              <Animated.Text
                style={[styles.levelNum, { transform: [{ scale: levelScale }] }]}
                accessibilityRole="header"
                accessibilityLabel={`レベル${level}`}
              >
                Level {level}
              </Animated.Text>

              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.messageText}>
                観察の積み重ねが、新しい段階に届きました。
              </Text>

              <View style={[styles.growthLine, compactLayout && styles.growthLineCompact]} accessibilityElementsHidden>
                <View style={styles.growthDot} />
                <View style={styles.growthRule} />
                <View style={styles.growthDot} />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [styles.continueButton, pressed && styles.continuePressed]}
                onPress={handleContinue}
                accessibilityRole="button"
                accessibilityLabel="観察を続ける"
              >
                <Text style={styles.continueText}>観察を続ける</Text>
                <Ionicons name="arrow-forward" size={18} color="#21472B" />
              </Pressable>
            </View>
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
    paddingVertical: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 18,
  },
  gradientShell: {
    flexShrink: 1,
  },
  scroll: {
    flexShrink: 1,
  },
  content: {
    paddingTop: 54,
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  contentCompact: {
    paddingTop: 48,
    paddingBottom: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pressed: { opacity: 0.72 },
  motifsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 16,
  },
  motifsRowCompact: {
    marginBottom: 10,
  },
  motifCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: '#F4F8F4',
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  levelNum: {
    fontSize: 52,
    lineHeight: 61,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.14)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleText: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 7,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#EEF8EF',
    marginTop: 8,
    textAlign: 'center',
  },
  growthLine: {
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  growthLineCompact: {
    marginVertical: 14,
  },
  growthRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(221,232,163,0.58)',
  },
  growthDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DCE6A1',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  continueButton: {
    minHeight: 54,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#F4F8EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  continuePressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  continueText: {
    color: '#21472B',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
});
