import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  findNodeHandle,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
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

type Slide = {
  icon: IoniconName;
  subIcon?: IoniconName;
  title: string;
  body: string;
  gradient?: [string, string, string];
  label: string;
  isSafety?: boolean;
};

const SLIDES: Slide[] = [
  {
    icon: 'camera-outline',
    subIcon: 'leaf-outline',
    title: '野草・ハーブを観察',
    body: `植物を撮影して候補を確認し、特徴を見比べます。${TOTAL_PLANTS}種類の野草・ハーブとの出会いを、自分のフィールドノートに残せます。`,
    gradient: ['#174F2A', '#286B38', '#41824B'],
    label: '観察',
  },
  {
    icon: 'book-outline',
    subIcon: 'compass-outline',
    title: '観察を重ねて、見る目を育てる',
    body: '見つけた植物、季節、メモ、見比べた特徴を少しずつ蓄積。XPやチャレンジは、学びを続けるための小さな目印です。',
    gradient: ['#123F46', '#1F6265', '#3D7C70'],
    label: '記録',
  },
  {
    icon: 'shield-checkmark-outline',
    title: '安全情報を確認してください',
    body: 'このアプリは植物を学び、観察を記録するための参考ツールです。野草の採取・摂取は、AIが示す候補だけで決めず、専門家に確認してください。',
    label: '安全',
    isSafety: true,
  },
];

export function OnboardingModal({ visible, onComplete }: Props) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const { width, height, fontScale } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);
  const slideIndexRef = useRef(0);
  const wasVisibleRef = useRef(false);
  const translateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideTitleRefs = useRef<(React.ElementRef<typeof Text> | null)[]>([]);

  const cardWidth = Math.min(Math.max(width - 32, 280), 440);
  // The overlay reserves 16pt above and below. Keep the card inside that
  // available viewport even in a short browser window / split-view layout.
  const cardMaxHeight = Math.max(1, height - 32);
  const stackActions = fontScale >= 1.3 || width < 360;
  const visualHeaderHeight = Math.min(160, Math.max(80, Math.round(height * 0.22)));
  const safetyHeaderHeight = Math.min(132, Math.max(72, Math.round(height * 0.18)));
  const controlsReserve = stackActions ? 188 : 132;
  const slideContentMaxHeight = Math.max(
    20,
    Math.min(260, cardMaxHeight - visualHeaderHeight - controlsReserve)
  );
  const illustrationSize = Math.min(94, Math.max(60, visualHeaderHeight - 18));
  const mainIconSize = Math.min(47, Math.max(30, Math.round(illustrationSize * 0.5)));
  const stackActions = fontScale >= 1.3 || width < 360;
  const safetyBg = theme.mode === 'dark' ? theme.colors.surfaceSecondary : '#FFF9EC';
  const safetySurface = theme.mode === 'dark' ? theme.colors.surfaceTertiary : '#FFF1C9';
  const safetyAccent = theme.colors.statusCaution;

  useEffect(() => {
    const justOpened = visible && !wasVisibleRef.current;
    const justClosed = !visible && wasVisibleRef.current;
    wasVisibleRef.current = visible;

    if (justOpened) {
      slideIndexRef.current = 0;
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
      return;
    }

    if (justClosed) {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      translateAnim.stopAnimation();
      scaleAnim.setValue(0.96);
      opacityAnim.setValue(0);
      return;
    }

    // If the accessibility preference changes while onboarding is already
    // open, preserve the current page instead of replaying the entrance/reset.
    if (visible && reduceMotion) {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      translateAnim.stopAnimation();
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      translateAnim.setValue(-slideIndexRef.current * cardWidth);
    }
  }, [visible, reduceMotion, cardWidth, translateAnim, scaleAnim, opacityAnim, theme.motion.stateChange]);

  useEffect(() => {
    // Browser resizing / split-view changes the card width. Re-anchor the
    // currently visible page without treating it as a user navigation event.
    translateAnim.setValue(-slideIndexRef.current * cardWidth);
  }, [cardWidth, translateAnim]);

  useEffect(() => {
    if (!visible) return;
    const delay = reduceMotion ? 70 : theme.motion.expand + 90;
    const timer = setTimeout(() => {
      const node = findNodeHandle(slideTitleRefs.current[slideIndex]);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, delay);
    return () => clearTimeout(timer);
  }, [visible, slideIndex, reduceMotion, theme.motion.expand]);

  function goToSlide(index: number) {
    slideIndexRef.current = index;
    setSlideIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateAnim.stopAnimation();
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
    if (slideIndex < SLIDES.length - 1) goToSlide(slideIndex + 1);
  }

  function handleBack() {
    if (slideIndex > 0) goToSlide(slideIndex - 1);
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
      onRequestClose={handleBack}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}> 
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={handleBack}
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
              {SLIDES.map((slide, index) => {
                const active = index === slideIndex;
                return (
                  <View
                    key={slide.label}
                    style={[
                      styles.slide,
                      {
                        width: cardWidth,
                        backgroundColor: slide.isSafety ? safetyBg : theme.colors.surfacePrimary,
                      },
                    ]}
                    accessibilityElementsHidden={!active}
                    importantForAccessibility={active ? 'yes' : 'no-hide-descendants'}
                  >
                    {slide.isSafety ? (
                      <View
                        style={[
                          styles.safetyHeader,
                          {
                            height: safetyHeaderHeight,
                            backgroundColor: safetySurface,
                            borderBottomColor: `${safetyAccent}66`,
                          },
                        ]}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                      >
                        <View
                          style={[
                            styles.safetyIconCircle,
                            {
                              width: Math.min(84, Math.max(56, safetyHeaderHeight - 20)),
                              height: Math.min(84, Math.max(56, safetyHeaderHeight - 20)),
                              borderRadius: 42,
                              backgroundColor: `${safetyAccent}16`,
                            },
                          ]}
                        >
                          <Ionicons name={slide.icon} size={Math.min(46, Math.max(30, safetyHeaderHeight * 0.42))} color={safetyAccent} />
                        </View>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={slide.gradient!}
                        style={[styles.slideHeader, { height: visualHeaderHeight }]}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                      >
                        <View
                          style={[
                            styles.illustrationCircle,
                            {
                              width: illustrationSize,
                              height: illustrationSize,
                              borderRadius: illustrationSize / 2,
                            },
                          ]}
                        >
                          <Ionicons name={slide.icon} size={mainIconSize} color="#FFFFFF" />
                          {slide.subIcon && illustrationSize >= 70 && (
                            <View style={styles.subIconWrap}>
                              <Ionicons name={slide.subIcon} size={19} color="#FFFFFF" />
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
                        ref={(node) => {
                          slideTitleRefs.current[index] = node;
                        }}
                        style={[
                          styles.slideTitle,
                          { color: slide.isSafety ? safetyAccent : theme.colors.textPrimary },
                        ]}
                        accessibilityRole="header"
                        accessibilityLabel={`${index + 1}/${SLIDES.length}ページ。${slide.label}。${slide.title}`}
                      >
                        {slide.title}
                      </Text>
                      <Text
                        style={[
                          styles.slideBody,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {slide.body}
                      </Text>

                      {slide.isSafety && (
                        <View
                          style={[
                            styles.safetyBox,
                            { backgroundColor: safetySurface, borderColor: `${safetyAccent}55` },
                          ]}
                          accessible
                          accessibilityRole="alert"
                          accessibilityLabel="採取や摂取の前に、専門家へ確認してください。"
                        >
                          <View
                            style={styles.safetyBoxInner}
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                          >
                            <Ionicons name="warning-outline" size={17} color={safetyAccent} />
                            <Text style={[styles.safetyBoxText, { color: theme.colors.textPrimary }]}> 
                              採取・摂取の前に、専門家へ確認してください
                            </Text>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                );
              })}
            </Animated.View>
          </View>

          <View
            style={[styles.dotsRow, { backgroundColor: theme.colors.surfacePrimary }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === slideIndex
                    ? { ...styles.dotActive, backgroundColor: theme.colors.accentPrimary }
                    : { ...styles.dotInactive, backgroundColor: theme.colors.borderStrong },
                ]}
              />
            ))}
          </View>

          <View style={[styles.actions, { backgroundColor: theme.colors.surfacePrimary }]}> 
            <Text
              style={[styles.progressLabel, { color: theme.colors.textTertiary }]}
              accessibilityRole="text"
              accessibilityLabel={`${slideIndex + 1}/${SLIDES.length}ページ。${SLIDES[slideIndex].label}`}
            >
              {slideIndex + 1} / {SLIDES.length} ・ {SLIDES[slideIndex].label}
            </Text>

            <View style={[styles.actionRow, stackActions && styles.actionRowStacked]}> 
              {slideIndex === 0 ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSecondary,
                    stackActions && styles.btnStacked,
                    { backgroundColor: theme.colors.surfaceSecondary },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleSkipToSafety}
                  accessibilityRole="button"
                  accessibilityLabel="安全ガイドを見る"
                >
                  <Text style={[styles.btnSecondaryText, { color: theme.colors.textSecondary }]}>安全ガイド</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSecondary,
                    stackActions && styles.btnStacked,
                    { backgroundColor: theme.colors.surfaceSecondary },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleBack}
                  accessibilityRole="button"
                  accessibilityLabel="前の説明に戻る"
                >
                  <Ionicons name="arrow-back" size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.btnSecondaryText, { color: theme.colors.textSecondary }]}>戻る</Text>
                </Pressable>
              )}

              {isLastSlide ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnPrimary,
                    stackActions && styles.btnStacked,
                    { backgroundColor: theme.colors.accentPrimary },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleComplete}
                  accessibilityRole="button"
                  accessibilityLabel="安全ガイドを確認してはじめる"
                >
                  <Text style={[styles.btnPrimaryText, { color: theme.colors.textOnAccent }]}>確認してはじめる</Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.colors.textOnAccent} />
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnNext,
                    stackActions && styles.btnStacked,
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
              )}
            </View>
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
  slidesWrapper: { overflow: 'hidden' },
  slidesTrack: { flexDirection: 'row' },
  slide: {},
  slideHeader: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.30)',
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
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  safetyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 15,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
  },
  slideBody: {
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
  },
  safetyBox: {
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  safetyBoxInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  safetyBoxText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
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
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24 },
  dotInactive: { width: 6 },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 6,
  },
  progressLabel: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionRowStacked: {
    flexDirection: 'column-reverse',
  },
  btnNext: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNextText: {
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  btnSecondary: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  btnPrimary: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  btnStacked: {
    flex: 0,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
