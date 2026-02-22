import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { scanPlant } from '../../src/utils/aiRecognition';
import { useGameStore } from '../../src/store/useGameStore';
import { ScanResultModal } from '../../src/components/ScanResultModal';
import { Plant } from '../../src/types';
import { Colors } from '../../src/constants/colors';

type ScanState = 'idle' | 'scanning' | 'done';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

export default function ScanScreen() {
  const router = useRouter();
  const { discoveredPlantIds, discoverPlant, addScan } = useGameStore();

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const cameraRef = useRef<CameraView>(null);

  // Scan state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [usedRealAI, setUsedRealAI] = useState(false);
  const [result, setResult] = useState<{
    plant: Plant;
    confidence: number;
    isNewDiscovery: boolean;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animations
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Scan line
  useEffect(() => {
    if (scanState === 'scanning') {
      Animated.loop(
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
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(spinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scanLineY.setValue(0);
      spinAnim.setValue(0);
    }
  }, [scanState]);

  // Idle pulse
  useEffect(() => {
    if (scanState === 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanState]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  async function handleScan() {
    if (scanState !== 'idle') return;
    setScanState('scanning');

    try {
      let base64Image: string | undefined;

      // Capture real photo if camera ref is available
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.6,
          exif: false,
        });
        base64Image = photo?.base64 ?? undefined;
      }

      const scanResult = await scanPlant(discoveredPlantIds, base64Image);
      setResult(scanResult);
      setUsedRealAI(scanResult.usedRealAI);
      setScanState('done');
      setModalVisible(true);
    } catch {
      setScanState('idle');
    }
  }

  function handleAddToZukan() {
    if (!result) return;
    discoverPlant(result.plant.id);
    addScan(result.plant.id);
    setModalVisible(false);
    setResult(null);
    setScanState('idle');
    router.push(`/plant/${result.plant.id}`);
  }

  function handleScanAgain() {
    setModalVisible(false);
    setResult(null);
    setScanState('idle');
  }

  // ── Permission not yet resolved ──
  if (!permission) {
    return <View style={styles.container} />;
  }

  // ── Permission denied ──
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.permissionTitle}>カメラへのアクセスが必要です</Text>
        <Text style={styles.permissionDesc}>
          植物をスキャンして図鑑に収録するためにカメラを使用します。
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>カメラを許可する</Text>
        </Pressable>
        <Text style={styles.permissionDisclaimer}>
          ⚠️ AI判定は参考情報です。採取・摂取前に必ず専門家へご確認ください。
        </Text>
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

          {CLAUDE_API_KEY ? (
            <View style={styles.aiModeBadge}>
              <Text style={styles.aiModeText}>🤖 Claude AI</Text>
            </View>
          ) : (
            <View style={[styles.aiModeBadge, styles.aiModeMock]}>
              <Text style={styles.aiModeText}>🎲 モックAI</Text>
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
            <Text style={styles.statusText}>
              {scanState === 'idle'
                ? '🌿 植物にカメラをかざしてください'
                : scanState === 'scanning'
                ? '🔍 AIが解析しています...'
                : '✅ スキャン完了'}
            </Text>
          </View>
        </View>

        {/* Hint bar */}
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            {scanState === 'scanning'
              ? `${CLAUDE_API_KEY ? 'Claude Vision AI' : 'モックAI'}で植物を解析中...`
              : '⚠️ AI判定は参考情報です。自己判断での採取・摂取は危険です'}
          </Text>
        </View>
      </View>

      {/* Control area */}
      <View style={styles.controlArea}>
        {scanState === 'idle' && (
          <>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Pressable style={styles.scanBtn} onPress={handleScan}>
                <View style={styles.scanBtnInner}>
                  <Text style={styles.scanBtnIcon}>🔍</Text>
                </View>
              </Pressable>
            </Animated.View>
            <Text style={styles.scanLabel}>タップしてスキャン</Text>
          </>
        )}

        {scanState === 'scanning' && (
          <>
            <View style={[styles.scanBtn, styles.scanBtnDisabled]}>
              <View style={styles.scanBtnInner}>
                <Animated.Text
                  style={[styles.scanBtnIcon, { transform: [{ rotate: spin }] }]}
                >
                  ⚙️
                </Animated.Text>
              </View>
            </View>
            <Text style={styles.scanLabel}>解析中...</Text>
          </>
        )}

        {scanState === 'done' && (
          <>
            <Pressable
              style={[styles.scanBtn, { backgroundColor: '#1565C0' }]}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.scanBtnInner}>
                <Text style={styles.scanBtnIcon}>📖</Text>
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
        onAddToZukan={handleAddToZukan}
        onScanAgain={handleScanAgain}
      />
    </View>
  );
}

const VIEWFINDER_SIZE = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },

  // ── Permission screen ──
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.bg,
  },
  permissionEmoji: { fontSize: 64, marginBottom: 20 },
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
  permissionDisclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
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
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Hint bar
  hintBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },

  // ── Control area ──
  controlArea: {
    backgroundColor: Colors.bg,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scanBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
  scanBtnIcon: { fontSize: 32 },
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
