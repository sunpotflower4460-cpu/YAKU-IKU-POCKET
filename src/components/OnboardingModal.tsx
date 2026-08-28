import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { TOTAL_PLANTS } from '../data/plants';
import { useReduceMotion } from '../utils/reduceMotion';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  visible: boolean;
  onComplete: () => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SLIDES: {
  icon: IoniconName;
  subIcon?: IoniconName;
  title: string;
  body: string;
  gradient?: [string, string, string];
  label: string;
  isSafety?: boolean;
}[] = [
  {
    icon: 'camera-outline',
    subIcon: 'leaf-outline',
    title: '野草・ハーブを観察',
    body: `カメラで植物を撮影し、候補と見分けるポイントを確認。${TOTAL_PLANTS}種類の野草・ハーブとの出会いを記録できます。`,
    gradient: ['#1B5E20', '#2E7D32', '#43A047'],
    label: '観察',
  },
  {
    icon: 'trophy-outline',
    subIcon: 'star',
    title: '学びを積み重ねる',
    body: '新しい観察や学習でXPを獲得。クエストや記録を通して、少しずつ植物を見る目を育てていきます。',
    gradient: ['#164E63', '#0E7490', '#0891B2'],
    label: '成長',
  },
  {
    icon: 'warning-outline',
    title: '必ず専門家に確認を',
    body: 'このアプリの情報は教育・参考目的です。野草の採取・摂取は、アプリの判定だけで決めず、必ず専門家にご確認ください。',
    label: '安全について',
    isSafety: true,
  },
];

export function OnboardingModal({ visible, onComplete }: Props) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);
  const translateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const cardWidth = Math.min(Math.max(width - 32, 280), 440);
  const cardMaxHeight = Math.max(height - 32, 420);
  const slideContentMaxHeight = Math.max(cardMaxHeight - 300, 210);

  useEffect(() => {
    if (visible) {
      setSlideIndex(0);
      translateAnim.setValue(0);
      scaleAnim.setValue(reduceMotion ? 1 : 0.96);
      opacityAnim.setValue(1);

      if (!reduceMotion) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: theme.motion.stateChange,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      scaleAnim.setValue(0.96);
      opacityAnim.setValue(0);
    }
  }, [visible, reduceMotion, translateAnim, scaleAnim, opacityAnim, theme.motion.stateChange]);

  // Rotation, Stage Manager and split-screen can change the available width
  // while the modal is open. Keep the current slide aligned after a resize.
  useEffect(() => {
    translateAnim.setValue(-slideIndex * cardWidth);
  }, [cardWidth, slideIndex, translateAnim]);

  function goToSlide(index: number) {
    setSlideIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (reduceMotion) {
      translateAnim.setValue(-index * cardWidth);
      return;
    }
    Animated.timing(translateAnim, {
      toValue: -index * cardWidth,
      duration: theme.motion.expand,
      useNativeDriver: true,
    }).start();
  }

  function handleNext() {
    if (slideIndex < SLIDES.length - 1) {
      goToSlide(slideIndex + 1);
    }
  }

  function handleSkipToSafety() {
    goToSlide(SLIDES.length - 1);
  }

  function handleComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  }

  const isLastSlide = slideIndex === SLIDES.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              width: cardWidth,
              maxHeight: cardMaxHeight,
              backgroundColor: theme.colors.surfacePrimary,
              borderColor: theme.colors.borderSubtle,
              shadowColor: theme.colors.shadow,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={[styles.slidesWrapper, { width: cardWidth }]}>
            <Animated.View
              style={[
                styles.slidesTrack,
                {
                  width: cardWidth * SLIDES.length,
                  transform: [{ translateX: translateAnim }],
                },
              ]}
            >
              {SLIDES.map((slide, i) => (
                <View
                  key={slide.label}
                  style={[
                    styles.slide,
                    { width: cardWidth, backgroundColor: theme.colors.surfacePrimary },
                    slide.isSafety && styles.slideSafety,
                  ]}
                  accessibilityElementsHidden={i !== slideIndex}
                  importantForAccessibility={i === slideIndex ? 'yes' : 'no-hide-descendants'}
                >
                  {slide.isSafety ? (
                    <View style={styles.safetyHeader}>
                      <View style={styles.safetyIconCircle}>
                        <Ionicons name={slide.icon} size={48} color="#B45309" />
                      </View>
                    </View>
                  ) : (
                    <LinearGradient colors={slide.gradient!} style={styles.slideHeader}>
                      <View style={styles.emojiCircle}>
                        <Ionicons name={slide.icon} size={48} color="#FFFFFF" />
                        {slide.subIcon && (
                          <View style={styles.subIconWrap}>
                            <Ionicons name={slide.subIcon} size={20} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  )}

                  <ScrollView
                    style={{ maxHeight: slideContentMaxHeight }}
                    contentContainerStyle={styles.slideContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <Text
                      style={[
                        styles.slideTitle,
                        { color: theme.colors.textPrimary },
                        slide.isSafety && styles.slideTitleSafety,
                      ]}
                      accessibilityRole="header"
                    >
                      {slide.title}
                    </Text>
                    <Text
                      style={[
                        styles.slideBody,
                        { color: theme.colors.textSecondary },
                        slide.isSafety && styles.slideBodySafety,
                      ]}
                    >
                      {slide.body}
                    </Text>

                    {slide.isSafety && (
                      <View style={styles.safetyBox}>
                        <View style={styles.safetyBoxInner}>
                          <Ionicons name="shield-checkmark-outline" size={16} color="#92400E" />
                          <Text style={styles.safetyBoxText}>
                            専門家への確認なしに野草を採取・摂取しないでください
                          </Text>
                        </View>
                      </View>
                    )}
                  </ScrollView>
                </View>
              ))}
            </Animated.View>
          </View>

          <View
            style={[styles.dotsRow, { backgroundColor: theme.colors.surfacePrimary }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === slideIndex
                    ? { ...styles.dotActive, backgroundColor: theme.colors.accentPrimary }
                    : { ...styles.dotInactive, backgroundColor: theme.colors.borderStrong },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Text
              style={[styles.progressLabel, { color: theme.colors.textTertiary }]}
              accessibilityLiveRegion="polite"
            >
              {slideIndex + 1} / {SLIDES.length} ・ {SLIDES[slideIndex].label}
            </Text>
            {isLastSlide ? (
              <Pressable
                style={({ pressed }) => [styles.btnPrimary, pressed && styles.buttonPressed]}
                onPress={handleComplete}
                accessibilityRole="button"
                accessibilityLabel="安全上の注意を理解してはじめる"
              >
                <Text style={styles.btnPrimaryText}>理解してはじめる</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSkip,
                    { backgroundColor: theme.colors.surfaceSecondary },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleSkipToSafety}
                  accessibilityRole="button"
                  accessibilityLabel="安全情報を見る"
                >
                  <Text style={[styles.btnSkipText, { color: theme.colors.accentPrimary }]}>安全情報を見る</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.btnNext,
                    { backgroundColor: theme.colors.accentPrimary },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleNext}
                  accessibilityRole="button"
                  accessibilityLabel="次へ"
                >
                  <Text style={[styles.btnNextText, { color: theme.colors.textOnAccent }]}>次へ</Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.colors.textOnAccent} />
                </Pressable>
              </View>
            )}
          </View>
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
    padding: 16,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 24,
    elevation: 16,
  },
  slidesWrapper: {
    overflow: 'hidden',
  },
  slidesTrack: {
    flexDirection: 'row',
  },
  slide: {},
  slideSafety: {
    backgroundColor: '#FFFBF0',
  },
  slideHeader: {
    height: 164,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subIconWrap: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyHeader: {
    height: 132,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F59E0B',
  },
  safetyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 29,
  },
  slideTitleSafety: {
    color: '#B45309',
  },
  slideBody: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  slideBodySafety: {
    color: '#92400E',
  },
  safetyBox: {
    marginTop: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
    width: '100%',
  },
  safetyBoxInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  safetyBoxText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '700',
    lineHeight: 19,
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 6,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 6,
  },
  progressLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnNext: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNextText: {
    fontWeight: '800',
    fontSize: 16,
  },
  btnSkip: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSkipText: {
    fontWeight: '700',
    fontSize: 14,
  },
  btnPrimary: {
    minHeight: 54,
    backgroundColor: '#B45309',
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
