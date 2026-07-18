import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../src/utils/haptics';
import { useRouter } from 'expo-router';
import { scanPlant } from '../../src/utils/aiRecognition';
import { useGameStore } from '../../src/store/useGameStore';
import { ScanResultModal } from '../../src/components/ScanResultModal';
import { Plant } from '../../src/types';
import { Colors } from '../../src/constants/colors';
import { IS_DEMO_MODE } from '../../src/utils/appMode';
import {
  CapturedPhoto,
  PhotoOrgan,
  ORGAN_LABEL,
  ORGAN_CYCLE,
  MAX_CAPTURE_PHOTOS,
} from '../../src/types/capture';

type ScanState = 'idle' | 'scanning' | 'done';

// Stages we actually perform, shown honestly — never a step we don't run
// (§7.4 "実際に行っていない処理を表示しない").
type ProcessingStage = 'reviewing' | 'identifying' | 'safety';

const REAL_STAGE_LABEL: Record<ProcessingStage, string> = {
  reviewing: '写真を確認中...',
  identifying: 'Claude Vision AI が解析中...',
  safety: '安全情報を確認中...',
};
const DEMO_STAGE_LABEL: Record<ProcessingStage, string> = {
  reviewing: '写真を確認中...',
  identifying: 'デモモードで候補を表示中...',
  safety: '安全情報を確認中...',
};

export default function ScanScreen() {
  const router = useRouter();
  const { discoveredPlantIds, recordObservation } = useGameStore();

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const cameraRef = useRef<CameraView>(null);

  // Scan state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [usedRealAI, setUsedRealAI] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('reviewing');
  // Multi-photo capture (§7.4): 1-5 photos of the same specimen, each taggable
  // by organ (whole/leaf/flower/...), sent together for identification.
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<{
    plant: Plant;
    confidence: number;
    isNewDiscovery: boolean;
    reason?: string;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const photoUri = photos[0]?.uri ?? null;

  // Animations
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Scan line
  useEffect(() => {
    if (scanState === 'scanning') {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, {
            toValue: VIEWFINDER_SIZE - 4,
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
  }, [scanState]);

  // Idle pulse
  useEffect(() => {
    if (scanState === 'idle') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanState]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Capture one photo and add it to the set (§7.4 複数写真) ──
  async function handleCapturePhoto() {
    if (capturing || photos.length >= MAX_CAPTURE_PHOTOS || !cameraRef.current) return;
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleCycleOrgan(id: string) {
    Haptics.selectionAsync();
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = ORGAN_CYCLE[(ORGAN_CYCLE.indexOf(p.organ) + 1) % ORGAN_CYCLE.length];
        return { ...p, organ: next };
      })
    );
  }

  // ── Identify from the captured photo set ──
  async function handleIdentify() {
    if (scanState !== 'idle' || photos.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanState('scanning');

    try {
      // Stages shown here are the real steps we perform, in order — never a
      // step we don't actually run (§7.4).
      setProcessingStage('reviewing');
      await new Promise((r) => setTimeout(r, 400)); // let the stage render before the network call

      setProcessingStage('identifying');
      const outcome = await scanPlant(discoveredPlantIds, photos);

      // Real AI could not confidently match a database plant. Never invent a
      // random result — tell the user it could not be identified.
      if (outcome.status === 'unidentified') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setScanState('idle');
        Alert.alert(
          '特定できませんでした',
          'この写真からは植物を特定できませんでした。別の角度・部位（葉や花）の写真を追加して、もう一度お試しください。',
        );
        return;
      }

      // Real AI call failed (network/timeout/malformed). No random fallback.
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
      await new Promise((r) => setTimeout(r, 300)); // safety lookup is near-instant; keep the stage legible

      setResult({
        plant: outcome.plant,
        confidence: outcome.confidence,
        isNewDiscovery: outcome.isNewDiscovery,
        reason: outcome.reason,
      });
      setUsedRealAI(outcome.usedRealAI);

      // Haptic feedback: success notification on scan complete
      if (outcome.isNewDiscovery) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setScanState('done');
      setModalVisible(true);
    } catch (err) {
      console.error('[Scan] Error:', err);
      // Error haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanState('idle');
      Alert.alert('スキャン失敗', 'もう一度お試しください。');
    }
  }

  function handleAddToZukan() {
    if (!result) return;
    // Safety: demo (mock) results are view-only and must never be persisted as
    // real observations, grant XP, or register plants. Only real identifications
    // reach this save path.
    if (IS_DEMO_MODE) return;
    recordObservation(result.plant.id, photoUri ?? undefined);
    setModalVisible(false);
    setResult(null);
    setScanState('idle');
    setPhotos([]);
    router.push(`/plant/${result.plant.id}`);
  }

  function handleScanAgain() {
    setModalVisible(false);
    setResult(null);
    setScanState('idle');
    setPhotos([]);
  }

  // ── Permission not yet resolved ──
  if (!permission) {
    return <View style={styles.container} />;
  }

  // ── Permission denied ──
  if (!permission.granted) {
    // On iOS the system prompt appears only once. Once the user has denied and
    // can no longer be asked, send them to the Settings app instead.
    const mustUseSettings = !permission.canAskAgain;
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.permissionTitle}>カメラへのアクセスが必要です</Text>
        <Text style={styles.permissionDesc}>
          {mustUseSettings
            ? '設定アプリからカメラへのアクセスを許可してください。'
            : '植物をスキャンして図鑑に収録するためにカメラを使用します。'}
        </Text>
        <Pressable
          style={styles.permissionBtn}
          onPress={mustUseSettings ? () => Linking.openSettings() : requestPermission}
        >
          <Text style={styles.permissionBtnText}>
            {mustUseSettings ? '設定を開く' : 'カメラを許可する'}
          </Text>
        </Pressable>
        <View style={styles.permissionDisclaimerRow}>
          <Ionicons name="warning-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.permissionDisclaimer}>
            AI判定は参考情報です。採取・摂取前に必ず専門家へご確認ください。
          </Text>
        </View>
      </View>
    );
  }

  // ── Main camera UI ──
  return (
    <View style={styles.container}>
      {/* Camera area */}
      <View style={styles.cameraArea}>
        {/* Real camera preview */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
        />

        {/* Dim overlay during scan */}
        {scanState === 'scanning' && (
          <View style={[StyleSheet.absoluteFill, styles.scanningDim]} />
        )}

        {/* Top controls: flash / flip */}
        <View style={styles.topControls}>
          <Pressable
            style={styles.controlBtn}
            onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
          >
            <Ionicons
              name={flash === 'off' ? 'flash-off' : 'flash'}
              size={22}
              color="#FFFFFF"
            />
          </Pressable>

          {!IS_DEMO_MODE ? (
            <View style={styles.aiModeBadge}>
              <Ionicons name="hardware-chip-outline" size={12} color="#FFFFFF" />
              <Text style={styles.aiModeText}>Claude AI</Text>
            </View>
          ) : (
            <View style={[styles.aiModeBadge, styles.aiModeMock]}>
              <Ionicons name="dice-outline" size={12} color="#FFFFFF" />
              <Text style={styles.aiModeText}>デモ（体験モード）</Text>
            </View>
          )}

          <Pressable
            style={styles.controlBtn}
            onPress={() =>
              setFacing((f) => (f === 'back' ? 'front' : 'back'))
            }
          >
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderWrapper}>
          <View style={styles.viewfinder}>
            {/* Corner markers */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            {/* Scan line */}
            {scanState === 'scanning' && (
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineY }] },
                ]}
              />
            )}
          </View>

          {/* Status label */}
          <View style={styles.statusLabel}>
            <View style={styles.statusTextRow}>
              <Ionicons
                name={
                  scanState === 'idle' ? 'leaf-outline' :
                  scanState === 'scanning' ? (!IS_DEMO_MODE ? 'hardware-chip-outline' : 'dice-outline') :
                  'checkmark-circle-outline'
                }
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {scanState === 'idle'
                  ? (photos.length === 0
                      ? '植物にカメラをかざしてください'
                      : `${photos.length}枚 撮影済み — 続けて撮影するか識別してください`)
                  : scanState === 'scanning'
                  ? (!IS_DEMO_MODE ? REAL_STAGE_LABEL[processingStage] : DEMO_STAGE_LABEL[processingStage])
                  : 'スキャン完了'}
              </Text>
            </View>
          </View>
        </View>

        {/* Hint bar */}
        <View style={styles.hintBar}>
          {scanState !== 'scanning' && (
            <Ionicons name="warning-outline" size={12} color="rgba(255,255,255,0.7)" />
          )}
          <Text style={styles.hintText}>
            {scanState === 'scanning'
              ? (!IS_DEMO_MODE ? REAL_STAGE_LABEL[processingStage] : DEMO_STAGE_LABEL[processingStage])
              : 'AI判定は参考情報です。自己判断での採取・摂取は危険です'}
          </Text>
        </View>
      </View>

      {/* Control area */}
      <View style={styles.controlArea}>
        {scanState === 'idle' && (
          <>
            {/* Captured-photo thumbnail strip with organ tagging (§7.4) */}
            {photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photoStrip}
                contentContainerStyle={styles.photoStripContent}
              >
                {photos.map((p) => (
                  <View key={p.id} style={styles.photoThumbWrap}>
                    <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                    <Pressable
                      style={styles.photoOrganChip}
                      onPress={() => handleCycleOrgan(p.id)}
                      accessibilityLabel={`部位: ${ORGAN_LABEL[p.organ]}（タップで変更）`}
                    >
                      <Text style={styles.photoOrganChipText}>{ORGAN_LABEL[p.organ]}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.photoDeleteBtn}
                      onPress={() => handleRemovePhoto(p.id)}
                      accessibilityLabel="この写真を削除"
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.captureRow}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Pressable
                  style={[styles.scanBtn, (capturing || photos.length >= MAX_CAPTURE_PHOTOS) && styles.scanBtnDisabled]}
                  onPress={handleCapturePhoto}
                  disabled={capturing || photos.length >= MAX_CAPTURE_PHOTOS}
                  accessibilityLabel="写真を撮影"
                  accessibilityRole="button"
                >
                  <View style={styles.scanBtnInner}>
                    <Ionicons name="camera-outline" size={32} color="#FFFFFF" />
                  </View>
                </Pressable>
              </Animated.View>

              {photos.length > 0 && (
                <Pressable
                  style={styles.identifyBtn}
                  onPress={handleIdentify}
                  accessibilityLabel={`${photos.length}枚の写真で識別する`}
                  accessibilityRole="button"
                >
                  <Ionicons name="search-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.identifyBtnText}>識別する（{photos.length}枚）</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.scanLabel}>
              {photos.length >= MAX_CAPTURE_PHOTOS
                ? `最大${MAX_CAPTURE_PHOTOS}枚まで撮影できます`
                : `タップして撮影（全体・葉・花など複数枚OK / ${photos.length}枚）`}
            </Text>
          </>
        )}

        {scanState === 'scanning' && (
          <>
            <View style={[styles.scanBtn, styles.scanBtnDisabled]}>
              <View style={styles.scanBtnInner}>
                <Animated.View style={[{ transform: [{ rotate: spin }] }]}>
                  <Ionicons name="cog-outline" size={32} color="#FFFFFF" />
                </Animated.View>
              </View>
            </View>
            <Text style={styles.scanLabel}>
              {!IS_DEMO_MODE ? REAL_STAGE_LABEL[processingStage] : DEMO_STAGE_LABEL[processingStage]}
            </Text>
          </>
        )}

        {scanState === 'done' && (
          <>
            <Pressable
              style={[styles.scanBtn, { backgroundColor: '#1565C0' }]}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.scanBtnInner}>
                <Ionicons name="book-outline" size={32} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text style={styles.scanLabel}>結果を表示</Text>
          </>
        )}

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            🛡️ このアプリの判定は教育目的の参考情報です。{'\n'}
            野草の採取・摂取は必ず専門家にご確認ください。
          </Text>
        </View>
      </View>

      {/* Result Modal */}
      <ScanResultModal
        visible={modalVisible}
        plant={result?.plant ?? null}
        confidence={result?.confidence ?? 0}
        isNewDiscovery={result?.isNewDiscovery ?? false}
        usedRealAI={usedRealAI}
        isDemo={IS_DEMO_MODE}
        reason={result?.reason}
        imageUri={photoUri ?? undefined}
        onAddToZukan={handleAddToZukan}
        onScanAgain={handleScanAgain}
      />
    </View>
  );
}

const VIEWFINDER_SIZE = Math.min(Dimensions.get('window').width * 0.65, 280);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },

  // ── Permission screen ──
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.bg,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 24,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  permissionDisclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  permissionDisclaimer: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 17,
  },

  // ── Camera area ──
  cameraArea: {
    flex: 1,
    position: 'relative',
  },
  scanningDim: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // Top controls
  topControls: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(46,125,50,0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  aiModeMock: {
    backgroundColor: 'rgba(80,80,80,0.8)',
  },
  aiModeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Viewfinder
  viewfinderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 32, height: 32,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderColor: '#00FF41', borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: 32, height: 32,
    borderTopWidth: 3, borderRightWidth: 3,
    borderColor: '#00FF41', borderTopRightRadius: 4,
  },
  cornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: 32, height: 32,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderColor: '#00FF41', borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderColor: '#00FF41', borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: '#00FF41',
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
  },
  statusLabel: {
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Hint bar
  hintBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
    textAlign: 'center',
  },

  // ── Control area ──
  controlArea: {
    backgroundColor: Colors.bg,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Multi-photo strip (§7.4)
  photoStrip: { width: '100%', marginBottom: 12 },
  photoStripContent: { gap: 10, paddingHorizontal: 2 },
  photoThumbWrap: { width: 64, height: 64, borderRadius: 12, overflow: 'visible' },
  photoThumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#E0E0E0' },
  photoOrganChip: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoOrganChipText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  photoDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  identifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1565C0',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  identifyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  scanBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 8,
  },
  scanBtnDisabled: {
    backgroundColor: '#9E9E9E',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  scanBtnInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnIcon: { width: 32, height: 32 },
  scanLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  disclaimerBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 10,
    width: '100%',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 17,
  },
});
