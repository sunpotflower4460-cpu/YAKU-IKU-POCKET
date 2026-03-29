import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/colors';
import { PLANTS } from '../src/data/plants';
import { useGameStore } from '../src/store/useGameStore';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  plantEmoji: string;
}

// Generate quiz questions from plant data
function generateQuestions(): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Q type 1: "この植物の危険度は？"
  PLANTS.forEach((plant) => {
    const wrongDangers = (['GREEN', 'YELLOW', 'RED'] as const)
      .filter((d) => d !== plant.danger);
    const dangerLabels: Record<string, string> = {
      GREEN: '🟢 安全（緑）',
      YELLOW: '🟡 注意（黄）',
      RED: '🔴 危険（赤）',
    };
    const options = [
      dangerLabels[plant.danger],
      dangerLabels[wrongDangers[0]],
      dangerLabels[wrongDangers[1]],
    ];
    const shuffled = shuffleArray(options);
    const correctIndex = shuffled.indexOf(dangerLabels[plant.danger]);
    questions.push({
      id: `danger_${plant.id}`,
      question: `${plant.emoji} ${plant.name} の危険度は？`,
      options: shuffled,
      correctIndex,
      explanation: `${plant.name}の危険度は「${dangerLabels[plant.danger]}」です。${plant.warningNote ?? plant.description.slice(0, 60)}`,
      plantEmoji: plant.emoji,
    });
  });

  // Q type 2: "この効果を持つ植物は？"
  const effectQuestions: QuizQuestion[] = [];
  PLANTS.forEach((plant) => {
    if (plant.effects.length === 0) return;
    const effect = plant.effects[0];
    const wrongPlants = PLANTS
      .filter((p) => p.id !== plant.id && !p.effects.includes(effect))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    if (wrongPlants.length < 2) return;
    const options = shuffleArray([plant.name, wrongPlants[0].name, wrongPlants[1].name]);
    const correctIndex = options.indexOf(plant.name);
    effectQuestions.push({
      id: `effect_${plant.id}`,
      question: `「${effect}」の効果がある植物は？`,
      options,
      correctIndex,
      explanation: `${plant.name}（${plant.nameEn}）は「${plant.effects.join('・')}」などの効果があります。`,
      plantEmoji: plant.emoji,
    });
  });
  questions.push(...effectQuestions);

  // Q type 3: "この植物の季節は？"
  const seasonQuestions: QuizQuestion[] = [];
  const seasons = ['春', '夏', '秋', '冬'];
  PLANTS.forEach((plant) => {
    const mainSeason = seasons.find((s) => plant.season.includes(s));
    if (!mainSeason) return;
    const wrongSeasons = seasons.filter((s) => s !== mainSeason).slice(0, 2);
    const options = shuffleArray([mainSeason, ...wrongSeasons]);
    const correctIndex = options.indexOf(mainSeason);
    seasonQuestions.push({
      id: `season_${plant.id}`,
      question: `${plant.emoji} ${plant.name}が最も旬な季節は？`,
      options,
      correctIndex,
      explanation: `${plant.name}の旬は「${plant.season}」です。`,
      plantEmoji: plant.emoji,
    });
  });
  questions.push(...seasonQuestions);

  return shuffleArray(questions);
}

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const QUIZ_LENGTH = 10;

export default function QuizScreen() {
  const router = useRouter();
  const { quizHighScore, updateQuizHighScore } = useGameStore();

  const allQuestions = useMemo(() => generateQuestions(), []);
  const questions = useMemo(() => allQuestions.slice(0, QUIZ_LENGTH), [allQuestions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const currentQ = questions[currentIndex];

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedOption !== null) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedOption(index);
      const correct = index === currentQ.correctIndex;
      if (correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScore((s) => s + 1);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setAnswers((prev) => [...prev, correct]);

      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
          () => {
            if (currentIndex + 1 >= QUIZ_LENGTH) {
              const finalScore = correct ? score + 1 : score;
              setScore(finalScore);
              setFinished(true);
              if (finalScore > quizHighScore) updateQuizHighScore(finalScore);
            } else {
              setCurrentIndex((i) => i + 1);
              setSelectedOption(null);
              Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            }
          }
        );
      }, 1200);
    },
    [selectedOption, currentQ, currentIndex, score, quizHighScore, updateQuizHighScore, fadeAnim]
  );

  const handleRestart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setFinished(false);
    setAnswers([]);
    fadeAnim.setValue(1);
  };

  if (finished) {
    return <ResultScreen score={score} total={QUIZ_LENGTH} answers={answers} highScore={quizHighScore} onRestart={handleRestart} onBack={() => router.back()} />;
  }

  const optionColors = (index: number): [string, string] => {
    if (selectedOption === null) return [Colors.bgCard, Colors.bgCard];
    if (index === currentQ.correctIndex) return ['#E8F5E9', '#C8E6C9'];
    if (index === selectedOption) return ['#FFEBEE', '#FFCDD2'];
    return [Colors.bgCard, Colors.bgCard];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#F57F17', '#E65100']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textWhite} />
        </Pressable>
        <Text style={styles.headerTitle}>薬草クイズ</Text>
        <View style={styles.scoreChip}>
          <Text style={styles.scoreText}>{score}/{QUIZ_LENGTH}</Text>
        </View>
      </LinearGradient>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / QUIZ_LENGTH) * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {currentIndex + 1} / {QUIZ_LENGTH} 問
      </Text>

      <Animated.View style={[styles.questionArea, { opacity: fadeAnim }]}>
        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionEmoji}>{currentQ.plantEmoji}</Text>
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {currentQ.options.map((option, index) => {
            const [bgStart, bgEnd] = optionColors(index);
            const isCorrect = selectedOption !== null && index === currentQ.correctIndex;
            const isWrong = selectedOption === index && index !== currentQ.correctIndex;
            return (
              <Pressable
                key={index}
                onPress={() => handleAnswer(index)}
                disabled={selectedOption !== null}
              >
                <LinearGradient
                  colors={[bgStart, bgEnd]}
                  style={[
                    styles.optionCard,
                    isCorrect && styles.optionCorrect,
                    isWrong && styles.optionWrong,
                  ]}
                >
                  <View style={styles.optionIndex}>
                    <Text style={styles.optionIndexText}>
                      {isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    isCorrect && styles.optionTextCorrect,
                    isWrong && styles.optionTextWrong,
                  ]}>
                    {option}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation */}
        {selectedOption !== null && (
          <View style={[
            styles.explanationBox,
            selectedOption === currentQ.correctIndex ? styles.explanationCorrect : styles.explanationWrong,
          ]}>
            <Text style={styles.explanationEmoji}>
              {selectedOption === currentQ.correctIndex ? '🎉 正解！' : '💡 解説'}
            </Text>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function ResultScreen({
  score,
  total,
  answers,
  highScore,
  onRestart,
  onBack,
}: {
  score: number;
  total: number;
  answers: boolean[];
  highScore: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const isNewHighScore = score >= highScore;
  const resultEmoji = pct >= 80 ? '🏆' : pct >= 60 ? '🌿' : pct >= 40 ? '🌱' : '💧';
  const resultMessage =
    pct >= 80 ? '素晴らしい！薬草マスター！' :
    pct >= 60 ? '良い知識ですね！' :
    pct >= 40 ? 'まだまだ成長できます！' :
    '植物をもっと収集しましょう！';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.resultContent}>
      <LinearGradient colors={['#F57F17', '#E65100']} style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textWhite} />
        </Pressable>
        <Text style={styles.headerTitle}>クイズ結果</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <View style={styles.resultBox}>
        <Text style={styles.resultEmoji}>{resultEmoji}</Text>
        <Text style={styles.resultScore}>{score} / {total}</Text>
        <Text style={styles.resultPct}>{pct}%</Text>
        <Text style={styles.resultMsg}>{resultMessage}</Text>
        {isNewHighScore && score > 0 && (
          <View style={styles.newHighScore}>
            <Ionicons name="trophy" size={16} color="#FF8F00" />
            <Text style={styles.newHighScoreText}>新記録！</Text>
          </View>
        )}
      </View>

      {/* Answer summary */}
      <View style={styles.answerSummary}>
        <Text style={styles.summaryTitle}>回答まとめ</Text>
        <View style={styles.answerDots}>
          {answers.map((correct, i) => (
            <View
              key={i}
              style={[styles.answerDot, correct ? styles.answerDotCorrect : styles.answerDotWrong]}
            />
          ))}
        </View>
        <Text style={styles.summarySubtext}>
          正解: {answers.filter(Boolean).length}問 / 不正解: {answers.filter((a) => !a).length}問
        </Text>
      </View>

      <Pressable style={styles.restartButton} onPress={onRestart}>
        <LinearGradient colors={['#F57F17', '#E65100']} style={styles.restartGrad}>
          <Ionicons name="refresh" size={20} color={Colors.textWhite} />
          <Text style={styles.restartText}>もう一度挑戦</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={styles.backHomeButton} onPress={onBack}>
        <Text style={styles.backHomeText}>戻る</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textWhite },
  scoreChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scoreText: { fontSize: 14, fontWeight: '800', color: Colors.textWhite },
  progressBar: {
    height: 5,
    backgroundColor: Colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F57F17',
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    paddingRight: 16,
    marginTop: 6,
    marginBottom: 4,
  },
  questionArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  questionEmoji: { fontSize: 48, marginBottom: 12 },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  options: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 12,
  },
  optionCorrect: { borderColor: Colors.primary },
  optionWrong: { borderColor: Colors.dangerRed },
  optionIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIndexText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  optionTextCorrect: { color: Colors.primaryDark },
  optionTextWrong: { color: Colors.dangerRed },
  explanationBox: {
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  explanationCorrect: { backgroundColor: Colors.primaryPale, borderColor: Colors.primary },
  explanationWrong: { backgroundColor: Colors.dangerRedBg, borderColor: Colors.dangerRed },
  explanationEmoji: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  explanationText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
  // Result screen
  resultContent: { paddingBottom: 20 },
  resultBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.bgCard,
    margin: 16,
    borderRadius: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultScore: { fontSize: 48, fontWeight: '800', color: Colors.text },
  resultPct: { fontSize: 24, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  resultMsg: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  newHighScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newHighScoreText: { fontSize: 14, fontWeight: '700', color: '#F57F17' },
  answerSummary: {
    marginHorizontal: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  answerDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 10 },
  answerDot: { width: 16, height: 16, borderRadius: 8 },
  answerDotCorrect: { backgroundColor: Colors.primary },
  answerDotWrong: { backgroundColor: Colors.dangerRed },
  summarySubtext: { fontSize: 13, color: Colors.textMuted },
  restartButton: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F57F17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  restartGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  restartText: { fontSize: 17, fontWeight: '800', color: Colors.textWhite },
  backHomeButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backHomeText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
});
