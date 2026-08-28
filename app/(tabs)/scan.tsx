import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  Alert,
  Linking,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../src/utils/haptics';
import { useRouter } from 'expo-router';
import { scanPlant } from '../../src/utils/aiRecognition';
import { useGameStore } from '../../src/store/useGameStore';
import { ScanResultModal } from '../../src/components/ScanResultModal';
import { DisclaimerBanner } from '../../src/components/DisclaimerBanner';
import { Plant } from '../../src/types';
import { IdentificationCandidate } from '../../src/types/observation';
import { TraitCheck } from '../../src/types/traitCheck';
import { SUBJECT_CATEGORY_LABEL } from '../../src/types/subject';
import { isDemoMode } from '../../src/utils/appMode';
import { useReduceMotion } from '../../src/utils/reduceMotion';
import { persistObservationPhoto } from '../../src/utils/observationPhotoStorage';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  CapturedPhoto,
  ORGAN_LABEL,
  ORGAN_CYCLE,
  MAX_CAPTURE_PHOTOS,
} from '../../src/types/capture';

type ScanState = 'idle' | 'scanning' | 'done';

type ProcessingStage = 'reviewing' | 'identifying' | 'safety';

const REAL_STAGE_LABEL: Record<ProcessingStage, string> = {
  reviewing: '写真を確認中...',
  identifying: '植物候補を解析中...',
  safety: '安全情報を確認中...',
};
const DEMO_STAGE_LABEL: Record<ProcessingStage, string> = {
  reviewing: '写真を確認中...',
  identifying: 'デモ候補を準備中...',
  safety: '安全情報を確認中...',
};

export default function ScanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const viewfinderSize = Math.min(width * 0.65, 280);
  const compactControls = width < 380 || fontScale >= 1.3;
  const {
    discoveredPlantIds,
    recordObservation,
    recordUnidentifiedObservation,
    aiConsentGiven,
    markCandidatesCompared,
  } = useGameStore();
  const demoMode = isDemoMode(aiConsentGiven);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const cameraRef = useRef<CameraView>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [usedRealAI, setUsedRealAI] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('reviewing');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);
  const [savingUnidentified, setSavingUnidentified] = useState(false);
  const [result, setResult] = useState<{
    plant: Plant;
    confidence: number;
    isNewDiscovery: boolean;
    reason?: string;
    candidates?: IdentificationCandidate[];
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const photoUri = photos[0]?.uri ?? null;
  const cameraControlsLocked = scanState === 'scanning' || savingUnidentified;

  const reduceMotion = useReduceMotion();
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scanState === 'scanning' && !reduceMotion) {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, {
            toValue: viewfinderSize - 4,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineY, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      scanLoop.start();

      const spinLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(spinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      spinLoop.start();

      return () => {
        scanLoop.stop();
        spinLoop.stop();
      };
    } else {
      scanLineY.setValue(0);
      spinAnim.setValue(0);
    }
  }, [scanState, reduceMotion, viewfinderSize, scanLineY, spinAnim]);

  useEffect(() => {
    if (scanState === 'idle' && !reduceMotion && !savingUnidentified) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.035, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanState, reduceMotion, savingUnidentified, pulseAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const processingLabel = !demoMode ? REAL_STAGE_LABEL[processingStage] : DEMO_STAGE_LABEL[processingStage];
  const cameraStatusLabel = savingUnidentified
    ? '未特定の観察記録を保存中...'
    : capturing
      ? '写真を撮影中...'
      : scanState === 'idle'
        ? (photos.length === 0
            ? '植物にカメラをかざしてください'
            : `${photos.length}枚 撮影済み。続けて撮影するか候補を確認してください`)
        : scanState === 'scanning'
          ? processingLabel
          : '候補を確認できます';

  async function handleCapturePhoto() {
    if (capturing || savingUnidentified || photos.length >= MAX_CAPTURE_PHOTOS || !cameraRef.current) return;
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        exif: false,
      });
      if (photo?.base64 && photo?.uri) {
        setPhotos((prev) => [
          ...prev,
          { id: `photo_${Date.now()}_${prev.length}`, uri: photo.uri, base64: photo.base64!, organ: 'auto' },
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('[Capture] Error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('撮影に失敗しました', 'もう一度お試しください。');
    } finally {
      setCapturing(false);
    }
  }

  function handleRemovePhoto(id: string) {
    if (savingUnidentified) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleCycleOrgan(id: string) {
    if (savingUnidentified) return;
    Haptics.selectionAsync();
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = ORGAN_CYCLE[(ORGAN_CYCLE.indexOf(p.organ) + 1) % ORGAN_CYCLE.length];
        return { ...p, organ: next };
      })
    );
  }

  async function handleIdentify() {
    if (scanState !== 'idle' || photos.length === 0 || savingUnidentified) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanState('scanning');

    try {
      setProcessingStage('reviewing');
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStage('identifying');
      const outcome = await scanPlant(discoveredPlantIds, photos, aiConsentGiven);

      if (outcome.status === 'unidentified') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setScanState('idle');
        Alert.alert(
          '特定できませんでした',
          'この写真からは植物を特定できませんでした。別の角度・部位（葉や花）の写真を追加して、もう一度お試しください。判定できなくても、写真だけを記録として残すこともできます。',
          [
            { text: '写真を撮り直す', style: 'cancel', onPress: () => setPhotos([]) },
            { text: '別の写真を追加する' },
            { text: '未特定のまま記録する', onPress: handleSaveUnidentified },
          ]
        );
        return;
      }

      if (outcome.status === 'out_of_scope') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setScanState('idle');
        Alert.alert(
          `${SUBJECT_CATEGORY_LABEL[outcome.category]}の可能性があります`,
          outcome.guidance,
          [
            { text: '写真を撮り直す', style: 'cancel', onPress: () => setPhotos([]) },
            { text: '別の写真を追加する' },
            { text: '判定せず記録する', onPress: handleSaveUnidentified },
          ]
        );
        return;
      }

      if (outcome.status === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setScanState('idle');
        Alert.alert(
          'AIに接続できませんでした',
          '通信環境をご確認のうえ、しばらくしてからもう一度お試しください。',
        );
        return;
      }

      setProcessingStage('safety');
      await new Promise((r) => setTimeout(r, 300));

      setResult({
        plant: outcome.plant,
        confidence: outcome.confidence,
        isNewDiscovery: outcome.isNewDiscovery,
        reason: outcome.reason,
        candidates: outcome.candidates,
      });
      setUsedRealAI(outcome.usedRealAI);

      if (outcome.isNewDiscovery) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setScanState('done');
      setModalVisible(true);
    } catch (err) {
      console.error('[Scan] Error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanState('idle');
      Alert.alert('スキャン失敗', 'もう一度お試しください。');
    }
  }

  function handleSelectCandidate(candidate: IdentificationCandidate) {
    Haptics.selectionAsync();
    if (result && candidate.plant.id !== result.plant.id) {
      markCandidatesCompared();
    }
    setResult((prev) =>
      prev
        ? {
            ...prev,
            plant: candidate.plant,
            confidence: candidate.score.visionScore ?? prev.confidence,
            isNewDiscovery: !discoveredPlantIds.includes(candidate.plant.id),
            reason: candidate.reason,
          }
        : prev
    );
  }

  async function handleAddToZukan(traitChecks: TraitCheck[]) {
    if (!result || savingObservation) return;
    if (demoMode) return;
    setSavingObservation(true);
    try {
      const durableUri = photoUri ? await persistObservationPhoto(photoUri) : undefined;
      recordObservation(result.plant.id, durableUri, traitChecks);
      const savedPlantId = result.plant.id;
      setModalVisible(false);
      setResult(null);
      setScanState('idle');
      setPhotos([]);
      setSavingObservation(false);
      router.push(`/plant/${savedPlantId}`);
    } catch (err) {
      console.error('[ObservationSave] Error:', err);
      setSavingObservation(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('観察記録を保存できませんでした', '写真はそのまま残しています。もう一度お試しください。');
    }
  }

  async function handleSaveUnidentified() {
    if (savingUnidentified) return;
    setSavingUnidentified(true);
    try {
      const durableUri = photoUri ? await persistObservationPhoto(photoUri) : undefined;
      recordUnidentifiedObservation(durableUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanState('idle');
      setPhotos([]);
    } catch (err) {
      console.error('[UnidentifiedObservationSave] Error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '観察記録を保存できませんでした',
        '写真はそのまま残しています。通信や端末の空き容量を確認して、もう一度お試しください。'
      );
    } finally {
      setSavingUnidentified(false);
    }
  }

  function handleScanAgain() {
    if (savingObservation || savingUnidentified) return;
    setModalVisible(false);
    setResult(null);
    setScanState('idle');
    setPhotos([]);
  }

  if (!permission) {
    return (
      <View
        style={[styles.container, styles.permissionLoading, { backgroundColor: theme.colors.canvas }]}
        accessible
        accessibilityRole="text"
        accessibilityLabel="カメラを準備中"
      >
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
        <Text style={[styles.permissionLoadingText, { color: theme.colors.textSecondary }]}>カメラを準備中…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    const mustUseSettings = !permission.canAskAgain;
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.canvas }]}
        contentContainerStyle={[
          styles.permissionContainer,
          {
            paddingTop: Math.max(insets.top + 24, 40),
            paddingBottom: Math.max(insets.bottom + 24, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            styles.permissionIconWrap,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.borderSubtle,
            },
          ]}
          accessibilityElementsHidden
        >
          <Ionicons name="camera-outline" size={36} color={theme.colors.accentPrimary} />
        </View>
        <Text style={[styles.permissionTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">カメラへのアクセスが必要です</Text>
        <Text style={[styles.permissionDesc, { color: theme.colors.textSecondary }]}>
          {mustUseSettings
            ? '設定アプリからカメラへのアクセスを許可してください。'
            : '植物を撮影し、候補を確認するためにカメラを使用します。'}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.permissionBtn,
            { backgroundColor: theme.colors.accentPrimary },
            pressed && styles.buttonPressed,
          ]}
          onPress={mustUseSettings ? () => Linking.openSettings() : requestPermission}
          accessibilityRole="button"
          accessibilityLabel={mustUseSettings ? '設定を開く' : 'カメラを許可する'}
        >
          <Text style={[styles.permissionBtnText, { color: theme.colors.textOnAccent }]}>
            {mustUseSettings ? '設定を開く' : 'カメラを許可する'}
          </Text>
        </Pressable>
        <View style={styles.permissionSafetyWrap}>
          <DisclaimerBanner compact />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraArea}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
        />

        {(scanState === 'scanning' || savingUnidentified) && (
          <View style={[StyleSheet.absoluteFill, styles.scanningDim]} />
        )}

        <View style={[styles.topControls, { top: insets.top + 8 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.controlBtn,
              cameraControlsLocked && styles.cameraControlDisabled,
              pressed && !cameraControlsLocked && styles.cameraControlPressed,
            ]}
            onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
            disabled={cameraControlsLocked}
            accessibilityRole="button"
            accessibilityLabel={flash === 'off' ? 'フラッシュをオンにする' : 'フラッシュをオフにする'}
            accessibilityState={{ selected: flash === 'on', disabled: cameraControlsLocked }}
          >
            <Ionicons
              name={flash === 'off' ? 'flash-off' : 'flash'}
              size={22}
              color="#FFFFFF"
            />
          </Pressable>

          {!demoMode ? (
            <View style={styles.aiModeBadge} accessible accessibilityRole="text" accessibilityLabel="AI解析モード">
              <Ionicons name="hardware-chip-outline" size={13} color="#FFFFFF" />
              <Text style={styles.aiModeText} maxFontSizeMultiplier={1.4}>AI解析</Text>
            </View>
          ) : (
            <View
              style={[styles.aiModeBadge, styles.aiModeMock]}
              accessible
              accessibilityRole="text"
              accessibilityLabel="デモモード"
            >
              <Ionicons name="flask-outline" size={13} color="#FFFFFF" />
              <Text style={styles.aiModeText} maxFontSizeMultiplier={1.4}>デモモード</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.controlBtn,
              cameraControlsLocked && styles.cameraControlDisabled,
              pressed && !cameraControlsLocked && styles.cameraControlPressed,
            ]}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            disabled={cameraControlsLocked}
            accessibilityRole="button"
            accessibilityLabel="カメラを切り替える"
            accessibilityState={{ disabled: cameraControlsLocked }}
          >
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.viewfinderWrapper}>
          <View style={[styles.viewfinder, { width: viewfinderSize, height: viewfinderSize }]} accessibilityElementsHidden>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            {scanState === 'scanning' && (
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineY }] },
                ]}
              />
            )}
          </View>

          <View
            style={styles.statusLabel}
            accessible
            accessibilityRole="text"
            accessibilityLabel={cameraStatusLabel}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.statusTextRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {savingUnidentified ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={
                    scanState === 'idle' ? 'leaf-outline' :
                    scanState === 'scanning' ? (!demoMode ? 'hardware-chip-outline' : 'flask-outline') :
                    'checkmark-circle-outline'
                  }
                  size={14}
                  color="#FFFFFF"
                />
              )}
              <Text style={styles.statusText}>{cameraStatusLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.hintBar}>
          {scanState !== 'scanning' && !savingUnidentified && (
            <Ionicons name="shield-outline" size={14} color="rgba(255,255,255,0.82)" />
          )}
          <Text style={styles.hintText}>
            {savingUnidentified
              ? '保存が終わるまで写真をそのまま残しています'
              : scanState === 'scanning'
                ? '処理が終わるまで、そのままお待ちください'
                : 'AIの候補は参考情報です。採取・摂取はアプリだけで判断しないでください'}
          </Text>
        </View>
      </View>

      <View style={[styles.controlArea, { backgroundColor: theme.colors.canvas }]}>
        {scanState === 'idle' && (
          <>
            {photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photoStrip}
                contentContainerStyle={styles.photoStripContent}
              >
                {photos.map((p) => (
                  <View key={p.id} style={styles.photoThumbWrap}>
                    <Image
                      source={{ uri: p.uri }}
                      style={[styles.photoThumb, { backgroundColor: theme.colors.surfaceSecondary }]}
                      accessibilityIgnoresInvertColors
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.photoOrganChip,
                        { backgroundColor: theme.colors.accentPrimary },
                        savingUnidentified && styles.controlDisabled,
                        pressed && !savingUnidentified && styles.buttonPressed,
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      onPress={() => handleCycleOrgan(p.id)}
                      disabled={savingUnidentified}
                      accessibilityRole="button"
                      accessibilityLabel={`部位: ${ORGAN_LABEL[p.organ]}。タップで変更`}
                      accessibilityState={{ disabled: savingUnidentified }}
                    >
                      <Text style={[styles.photoOrganChipText, { color: theme.colors.textOnAccent }]}>{ORGAN_LABEL[p.organ]}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.photoDeleteBtn,
                        savingUnidentified && styles.controlDisabled,
                        pressed && !savingUnidentified && styles.cameraControlPressed,
                      ]}
                      hitSlop={8}
                      onPress={() => handleRemovePhoto(p.id)}
                      disabled={savingUnidentified}
                      accessibilityRole="button"
                      accessibilityLabel="この写真を削除"
                      accessibilityState={{ disabled: savingUnidentified }}
                    >
                      <Ionicons name="close" size={15} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={[styles.captureRow, compactControls && styles.captureRowStacked]}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Pressable
                  style={[
                    styles.scanBtn,
                    { backgroundColor: theme.colors.accentPrimary, shadowColor: theme.colors.shadow },
                    (capturing || savingUnidentified || photos.length >= MAX_CAPTURE_PHOTOS) && styles.scanBtnDisabled,
                  ]}
                  onPress={handleCapturePhoto}
                  disabled={capturing || savingUnidentified || photos.length >= MAX_CAPTURE_PHOTOS}
                  accessibilityLabel={savingUnidentified ? '未特定の観察記録を保存中' : capturing ? '写真を撮影中' : '写真を撮影'}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: capturing || savingUnidentified || photos.length >= MAX_CAPTURE_PHOTOS, busy: capturing || savingUnidentified }}
                >
                  <View style={styles.scanBtnInner}>
                    {capturing || savingUnidentified ? (
                      <ActivityIndicator color={theme.colors.textOnAccent} />
                    ) : (
                      <Ionicons name="camera-outline" size={32} color={theme.colors.textOnAccent} />
                    )}
                  </View>
                </Pressable>
              </Animated.View>

              {photos.length > 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.identifyBtn,
                    compactControls && styles.identifyBtnStacked,
                    { backgroundColor: theme.colors.accentPrimary },
                    savingUnidentified && styles.controlDisabled,
                    pressed && !savingUnidentified && styles.buttonPressed,
                  ]}
                  onPress={handleIdentify}
                  disabled={savingUnidentified}
                  accessibilityLabel={savingUnidentified ? '未特定の観察記録を保存中' : `${photos.length}枚の写真から植物候補を確認する`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: savingUnidentified, busy: savingUnidentified }}
                >
                  <Ionicons name="search-outline" size={21} color={theme.colors.textOnAccent} />
                  <Text style={[styles.identifyBtnText, { color: theme.colors.textOnAccent }]} numberOfLines={2}>候補を確認（{photos.length}枚）</Text>
                </Pressable>
              )}
            </View>
            <Text style={[styles.scanLabel, { color: theme.colors.textSecondary }]}>
              {savingUnidentified
                ? '未特定の観察記録を保存中…'
                : capturing
                  ? '写真を保存中…'
                  : photos.length >= MAX_CAPTURE_PHOTOS
                    ? `最大${MAX_CAPTURE_PHOTOS}枚まで撮影できます`
                    : `全体・葉・花など、角度を変えて撮影できます（${photos.length}枚）`}
            </Text>
          </>
        )}

        {scanState === 'scanning' && (
          <>
            <View style={[styles.scanBtn, styles.scanBtnDisabled]} accessibilityElementsHidden>
              <View style={styles.scanBtnInner}>
                <Animated.View style={[{ transform: [{ rotate: spin }] }]}>
                  <Ionicons name="cog-outline" size={32} color="#FFFFFF" />
                </Animated.View>
              </View>
            </View>
            <Text
              style={[styles.scanLabel, { color: theme.colors.textSecondary }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {photos.length}枚の写真を確認しています
            </Text>
          </>
        )}

        {scanState === 'done' && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.scanBtn,
                { backgroundColor: theme.colors.accentPrimary, shadowColor: theme.colors.shadow },
                savingUnidentified && styles.controlDisabled,
                pressed && !savingUnidentified && styles.buttonPressed,
              ]}
              onPress={() => setModalVisible(true)}
              disabled={savingUnidentified}
              accessibilityRole="button"
              accessibilityLabel="植物候補を表示"
              accessibilityState={{ disabled: savingUnidentified }}
            >
              <View style={styles.scanBtnInner}>
                <Ionicons name="leaf-outline" size={32} color={theme.colors.textOnAccent} />
              </View>
            </Pressable>
            <Text style={[styles.scanLabel, { color: theme.colors.textSecondary }]}>植物候補を表示</Text>
          </>
        )}

        <View style={styles.safetyNoticeWrap}>
          <DisclaimerBanner compact />
        </View>
      </View>

      <ScanResultModal
        visible={modalVisible}
        plant={result?.plant ?? null}
        confidence={result?.confidence ?? 0}
        isNewDiscovery={result?.isNewDiscovery ?? false}
        usedRealAI={usedRealAI}
        isDemo={demoMode}
        isSaving={savingObservation}
        reason={result?.reason}
        candidates={result?.candidates}
        selectedPlantId={result?.plant.id}
        onSelectCandidate={handleSelectCandidate}
        imageUri={photoUri ?? undefined}
        onAddToZukan={handleAddToZukan}
        onScanAgain={handleScanAgain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  permissionLoading: { justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 28 },
  permissionLoadingText: { fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  permissionContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  permissionIconWrap: { width: 72, height: 72, borderRadius: 36, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  permissionTitle: { fontSize: 22, lineHeight: 29, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  permissionDesc: { fontSize: 15, lineHeight: 23, textAlign: 'center', marginBottom: 24, maxWidth: 420 },
  permissionBtn: { minHeight: 52, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  permissionBtnText: { fontWeight: '800', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  permissionSafetyWrap: { width: '100%', maxWidth: 480, borderRadius: 16, overflow: 'hidden' },
  cameraArea: { flex: 1, position: 'relative', minHeight: 300 },
  scanningDim: { backgroundColor: 'rgba(0,0,0,0.25)' },
  topControls: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  controlBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.48)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  cameraControlDisabled: { opacity: 0.5 },
  cameraControlPressed: { opacity: 0.65 },
  aiModeBadge: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(24,79,44,0.88)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  aiModeMock: { backgroundColor: 'rgba(60,60,60,0.88)' },
  aiModeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  viewfinderWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingBottom: 54 },
  viewfinder: { position: 'relative', overflow: 'hidden' },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#75E180', borderTopLeftRadius: 6 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#75E180', borderTopRightRadius: 6 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#75E180', borderBottomLeftRadius: 6 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#75E180', borderBottomRightRadius: 6 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#75E180', shadowColor: '#75E180', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 6 },
  statusLabel: { marginTop: 18, maxWidth: '88%', backgroundColor: 'rgba(0,0,0,0.68)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 15, paddingVertical: 8 },
  statusTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statusText: { color: '#FFFFFF', fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  hintBar: { position: 'absolute', bottom: 12, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  hintText: { color: '#FFFFFF', fontSize: 12, lineHeight: 18, flex: 1, textAlign: 'center' },
  controlArea: { paddingTop: 16, paddingBottom: 18, paddingHorizontal: 20, alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  photoStrip: { width: '100%', marginBottom: 8 },
  photoStripContent: { gap: 12, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 16 },
  photoThumbWrap: { width: 64, height: 64, borderRadius: 12, overflow: 'visible' },
  photoThumb: { width: 64, height: 64, borderRadius: 12 },
  photoOrganChip: { position: 'absolute', bottom: -12, alignSelf: 'center', minHeight: 28, minWidth: 44, borderRadius: 999, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  photoOrganChipText: { fontSize: 11, fontWeight: '800' },
  photoDeleteBtn: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.78)', borderWidth: 2, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  captureRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 8 },
  captureRowStacked: { flexDirection: 'column' },
  identifyBtn: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 9, maxWidth: '100%' },
  identifyBtnStacked: { width: '100%' },
  identifyBtnText: { fontWeight: '800', fontSize: 15, lineHeight: 21, textAlign: 'center', flexShrink: 1 },
  scanBtn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.26, shadowRadius: 8, elevation: 8, marginBottom: 8 },
  scanBtnDisabled: { backgroundColor: '#7E8880', shadowColor: '#000000', shadowOpacity: 0.08 },
  scanBtnInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.26)', justifyContent: 'center', alignItems: 'center' },
  scanLabel: { fontSize: 13, lineHeight: 19, fontWeight: '600', marginBottom: 13, textAlign: 'center' },
  safetyNoticeWrap: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  controlDisabled: { opacity: 0.58 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
