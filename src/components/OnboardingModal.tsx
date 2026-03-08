import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 40;

interface Props {
  visible: boolean;
  onComplete: () => void;
}

const SLIDES = [
  {
    emoji: '📷',
    subEmoji: '🌿',
    title: '野草・ハーブをスキャン',
    body: 'カメラで植物を撮影するとAIが自動識別。50種類の野草・ハーブを集めよう！',
    gradient: ['#1B5E20', '#2E7D32', '#43A047'] as [string, string, string],
    label: 'スキャン',
  },
  {
    emoji: '🏆',
    subEmoji: '⭐',
    title: '収集してレベルアップ',
    body: '新しい植物を発見するとXPを獲得。クエストをクリアして上位称号を目指そう！',
    gradient: ['#0D47A1', '#1565C0', '#1976D2'] as [string, string, string],
    label: 'コレクション',
  },
  {
    emoji: '⚠️',
    subEmoji: null,
    title: '必ず専門家に確認を',
    body: 'このアプリの情報は参考目的のみです。野草の採取・摂取は必ず専門家にご確認ください。',
    gradient: ['#E65100', '#F57F17', '#FFB300'] as [string, string, string],
    label: '安全について',
    isSafety: true,
  },
];

export function OnboardingModal({ visible, onComplete }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const translateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSlideIndex(0);
      translateAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  function goToSlide(index: number) {
    Animated.timing(translateAnim, {
      toValue: -index * CARD_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSlideIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Slides container */}
          <View style={styles.slidesWrapper}>
            <Animated.View
              style={[
                styles.slidesTrack,
                { transform: [{ translateX: translateAnim }] },
              ]}
            >
              {SLIDES.map((slide, i) => (
                <View key={i} style={[styles.slide, slide.isSafety && styles.slideSafety]}>
                  {slide.isSafety ? (
                    <View style={styles.safetyHeader}>
                      <Text style={styles.safetyEmoji}>{slide.emoji}</Text>
                    </View>
                  ) : (
                    <LinearGradient colors={slide.gradient} style={styles.slideHeader}>
                      <View style={styles.emojiCircle}>
                        <Text style={styles.slideEmoji}>{slide.emoji}</Text>
                        {slide.subEmoji && (
                          <Text style={styles.subEmoji}>{slide.subEmoji}</Text>
                        )}
                      </View>
                    </LinearGradient>
                  )}

                  <View style={styles.slideContent}>
                    <Text style={[styles.slideTitle, slide.isSafety && styles.slideTitleSafety]}>
                      {slide.title}
                    </Text>
                    <Text style={[styles.slideBody, slide.isSafety && styles.slideBodySafety]}>
                      {slide.body}
                    </Text>

                    {slide.isSafety && (
                      <View style={styles.safetyBox}>
                        <Text style={styles.safetyBoxText}>
                          🔬 専門家への確認なしに野草を採取・摂取しないでください
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* Dot indicator */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === slideIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {isLastSlide ? (
              <Pressable style={styles.btnPrimary} onPress={handleComplete}>
                <Text style={styles.btnPrimaryText}>理解しました。はじめる！</Text>
              </Pressable>
            ) : (
              <View style={styles.actionRow}>
                <Pressable style={styles.btnSkip} onPress={handleSkipToSafety}>
                  <Text style={styles.btnSkipText}>安全情報へ</Text>
                </Pressable>
                <Pressable style={styles.btnNext} onPress={handleNext}>
                  <Text style={styles.btnNextText}>次へ →</Text>
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
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    width: CARD_WIDTH,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },

  // Slides
  slidesWrapper: {
    width: CARD_WIDTH,
    overflow: 'hidden',
  },
  slidesTrack: {
    flexDirection: 'row',
    width: CARD_WIDTH * SLIDES.length,
  },
  slide: {
    width: CARD_WIDTH,
  },
  slideSafety: {
    backgroundColor: '#FFFBF0',
  },

  // Gradient header
  slideHeader: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideEmoji: { fontSize: 52 },
  subEmoji: {
    fontSize: 22,
    position: 'absolute',
    bottom: 8,
    right: 8,
  },

  // Safety header
  safetyHeader: {
    height: 140,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FFB300',
  },
  safetyEmoji: { fontSize: 72 },

  // Slide content
  slideContent: {
    padding: 20,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  slideTitleSafety: {
    color: '#B45309',
  },
  slideBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  slideBodySafety: {
    color: '#92400E',
  },
  safetyBox: {
    marginTop: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    width: '100%',
  },
  safetyBoxText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: Colors.bgCard,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.border,
  },

  // Actions
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnNext: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnNextText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  btnSkip: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
  },
  btnSkipText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  btnPrimary: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
});
