import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/colors';
import { useGameStore } from '../src/store/useGameStore';

type MeditationPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'holdEmpty' | 'done';

interface Preset {
  label: string;
  minutes: number;
  emoji: string;
  description: string;
  breathPattern: { inhale: number; holdIn: number; exhale: number; holdOut: number };
}

const PRESETS: Preset[] = [
  {
    label: '短い瞑想',
    minutes: 3,
    emoji: '🌱',
    description: '手軽に始める3分間',
    breathPattern: { inhale: 4, holdIn: 0, exhale: 4, holdOut: 0 },
  },
  {
    label: '集中瞑想',
    minutes: 5,
    emoji: '🌿',
    description: '心を落ち着かせる5分間',
    breathPattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  },
  {
    label: '深い瞑想',
    minutes: 10,
    emoji: '🍃',
    description: '深くリラックスする10分間',
    breathPattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  },
  {
    label: '朝の養生',
    minutes: 15,
    emoji: '🌅',
    description: '一日の始まりを整える',
    breathPattern: { inhale: 4, holdIn: 4, exhale: 6, holdOut: 2 },
  },
];

const PHASE_LABELS: Record<MeditationPhase, string> = {
  idle: '準備ができたら開始',
  inhale: '吸って...',
  hold: '止めて...',
  exhale: '吐いて...',
  holdEmpty: '止めて...',
  done: '完了！お疲れ様でした',
};

const PHASE_COLORS: Record<MeditationPhase, [string, string]> = {
  idle: ['#4CAF50', '#2E7D32'],
  inhale: ['#42A5F5', '#1565C0'],
  hold: ['#AB47BC', '#6A1B9A'],
  exhale: ['#26A69A', '#00695C'],
  holdEmpty: ['#78909C', '#37474F'],
  done: ['#66BB6A', '#2E7D32'],
};

export default function MeditationScreen() {
  const router = useRouter();
  const { addMeditationSession } = useGameStore();

  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[1]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<MeditationPhase>('idle');
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const animScale = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  const totalDuration = selectedPreset.minutes * 60;
  const progress = Math.min(totalSeconds / totalDuration, 1);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
  }, []);

  const animateCircle = useCallback(
    (toScale: number, duration: number) => {
      Animated.timing(animScale, {
        toValue: toScale,
        duration: duration * 1000,
        useNativeDriver: true,
      }).start();
    },
    [animScale]
  );

  const runBreathCycle = useCallback(() => {
    const { inhale, holdIn, exhale, holdOut } = selectedPreset.breathPattern;
    let elapsed = 0;

    // Inhale
    setPhase('inhale');
    animateCircle(1.35, inhale);
    elapsed += inhale * 1000;

    // Hold in
    if (holdIn > 0) {
      phaseTimerRef.current = setTimeout(() => {
        setPhase('hold');
      }, elapsed);
      elapsed += holdIn * 1000;
    }

    // Exhale
    phaseTimerRef.current = setTimeout(() => {
      setPhase('exhale');
      animateCircle(1.0, exhale);
    }, elapsed);
    elapsed += exhale * 1000;

    // Hold out
    if (holdOut > 0) {
      phaseTimerRef.current = setTimeout(() => {
        setPhase('holdEmpty');
      }, elapsed);
      elapsed += holdOut * 1000;
    }

    // Cycle end
    phaseTimerRef.current = setTimeout(() => {
      setBreathCount((prev) => prev + 1);
    }, elapsed);

    return elapsed;
  }, [selectedPreset, animateCircle]);

  useEffect(() => {
    if (!running) return;
    setBreathCount(0);
    const cycleMs = runBreathCycle();
    const cycleInterval = setInterval(runBreathCycle, cycleMs);
    intervalRef.current = cycleInterval;
    return () => clearTimers();
  }, [running, runBreathCycle, clearTimers]);

  // Countdown timer
  useEffect(() => {
    if (!running) return;
    startTimeRef.current = Date.now() - totalSeconds * 1000;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTotalSeconds(elapsed);
      if (elapsed >= totalDuration) {
        clearInterval(tick);
        clearTimers();
        setRunning(false);
        setPhase('done');
        setCompleted(true);
        addMeditationSession();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [running, totalDuration, clearTimers, addMeditationSession]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompleted(false);
    setTotalSeconds(0);
    setBreathCount(0);
    startTimeRef.current = Date.now();
    setRunning(true);
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearTimers();
    setRunning(false);
    setPhase('idle');
    animScale.setValue(1);
  };

  const formatTime = (secs: number) => {
    const remaining = Math.max(0, totalDuration - secs);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const colors = PHASE_COLORS[phase];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={!running}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={colors} style={styles.header}>
        <Pressable onPress={() => { handleStop(); router.back(); }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textWhite} />
        </Pressable>
        <Text style={styles.headerTitle}>瞑想タイマー</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      {/* Circle Visualizer */}
      <LinearGradient colors={colors} style={styles.visualizerBg}>
        <View style={styles.circleContainer}>
          {/* Outer pulse rings */}
          <Animated.View
            style={[
              styles.ringOuter,
              {
                transform: [{ scale: Animated.multiply(animScale, 1.15) }],
                opacity: 0.3,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ringMid,
              {
                transform: [{ scale: Animated.multiply(animScale, 1.07) }],
                opacity: 0.5,
              },
            ]}
          />
          <Animated.View
            style={[styles.circleMain, { transform: [{ scale: animScale }] }]}
          >
            <Text style={styles.circleEmoji}>
              {completed ? '✨' : running ? '🧘' : '🌿'}
            </Text>
            <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
            {running && (
              <Text style={styles.timerText}>{formatTime(totalSeconds)}</Text>
            )}
          </Animated.View>
        </View>

        {running && (
          <View style={styles.breathStats}>
            <Text style={styles.breathStatText}>呼吸回数: {breathCount}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Preset selection */}
      {!running && !completed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>セッションを選ぶ</Text>
          {PRESETS.map((preset) => (
            <Pressable
              key={preset.label}
              style={[
                styles.presetCard,
                selectedPreset.label === preset.label && styles.presetCardSelected,
              ]}
              onPress={() => {
                setSelectedPreset(preset);
                setTotalSeconds(0);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.presetEmoji}>{preset.emoji}</Text>
              <View style={styles.presetInfo}>
                <Text style={[
                  styles.presetLabel,
                  selectedPreset.label === preset.label && styles.presetLabelSelected,
                ]}>
                  {preset.label}
                </Text>
                <Text style={styles.presetDesc}>{preset.description}</Text>
                <Text style={styles.presetTime}>{preset.minutes}分</Text>
              </View>
              {selectedPreset.label === preset.label && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* Breath pattern info */}
      {!running && !completed && (
        <View style={styles.breathPatternBox}>
          <Text style={styles.breathPatternTitle}>呼吸パターン</Text>
          <View style={styles.breathPatternRow}>
            <BreathStep label="吸う" secs={selectedPreset.breathPattern.inhale} color="#42A5F5" />
            {selectedPreset.breathPattern.holdIn > 0 && (
              <BreathStep label="止める" secs={selectedPreset.breathPattern.holdIn} color="#AB47BC" />
            )}
            <BreathStep label="吐く" secs={selectedPreset.breathPattern.exhale} color="#26A69A" />
            {selectedPreset.breathPattern.holdOut > 0 && (
              <BreathStep label="止める" secs={selectedPreset.breathPattern.holdOut} color="#78909C" />
            )}
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!running ? (
          <Pressable style={styles.startButton} onPress={handleStart}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.startButtonGrad}>
              <Ionicons name="play" size={24} color={Colors.textWhite} />
              <Text style={styles.startButtonText}>
                {completed ? 'もう一度' : '瞑想を始める'}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Ionicons name="stop" size={22} color={Colors.textWhite} />
            <Text style={styles.stopButtonText}>終了する</Text>
          </Pressable>
        )}
      </View>

      {/* Completed message */}
      {completed && (
        <View style={styles.completedBox}>
          <Text style={styles.completedTitle}>瞑想完了！</Text>
          <Text style={styles.completedText}>
            {selectedPreset.minutes}分間の瞑想を達成しました。お疲れ様でした 🌿{'\n'}
            心と体がリフレッシュされましたか？
          </Text>
        </View>
      )}

      {/* Tips */}
      {!running && (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 瞑想のヒント</Text>
          <Text style={styles.tipsText}>
            • 背筋を伸ばし、楽な姿勢で座りましょう{'\n'}
            • 目を閉じるか、前方の一点を見つめます{'\n'}
            • 思考が浮かんでも良い。ただ呼吸に意識を戻しましょう{'\n'}
            • 毎日続けることで効果が高まります
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function BreathStep({ label, secs, color }: { label: string; secs: number; color: string }) {
  return (
    <View style={styles.breathStep}>
      <View style={[styles.breathDot, { backgroundColor: color }]} />
      <Text style={styles.breathStepLabel}>{label}</Text>
      <Text style={[styles.breathStepSecs, { color }]}>{secs}秒</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textWhite },
  visualizerBg: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  ringMid: {
    position: 'absolute',
    width: 175,
    height: 175,
    borderRadius: 88,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  circleMain: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  circleEmoji: { fontSize: 36, marginBottom: 4 },
  phaseLabel: {
    fontSize: 13,
    color: Colors.textWhite,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  timerText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textWhite,
    marginTop: 4,
  },
  breathStats: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  breathStatText: {
    fontSize: 13,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 12,
  },
  presetCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  presetEmoji: { fontSize: 28 },
  presetInfo: { flex: 1 },
  presetLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  presetLabelSelected: { color: Colors.primaryDark },
  presetDesc: { fontSize: 12, color: Colors.textMuted },
  presetTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  breathPatternBox: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
  },
  breathPatternTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breathPatternRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breathStep: { alignItems: 'center', gap: 4 },
  breathDot: { width: 10, height: 10, borderRadius: 5 },
  breathStepLabel: { fontSize: 11, color: Colors.textSecondary },
  breathStepSecs: { fontSize: 16, fontWeight: '800' },
  controls: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  startButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  stopButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#B71C1C',
    borderRadius: 18,
    paddingVertical: 18,
  },
  stopButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  completedBox: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.primaryPale,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsBox: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#AB47BC',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
