import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { recognizePlant } from '../../src/utils/mockAI';
import { useGameStore } from '../../src/store/useGameStore';
import { ScanResultModal } from '../../src/components/ScanResultModal';
import { Plant } from '../../src/types';
import { Colors } from '../../src/constants/colors';

type ScanState = 'idle' | 'scanning' | 'done';

export default function ScanScreen() {
  const router = useRouter();
  const { discoveredPlantIds, discoverPlant, addScan } = useGameStore();

  const [scanState, setScanState] = useState<ScanState>('idle');
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

  // Scan line loop
  useEffect(() => {
    if (scanState === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, {
            toValue: 220,
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
          Animated.timing(spinAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineY.setValue(0);
      spinAnim.setValue(0);
    }
  }, [scanState]);

  // Button pulse
  useEffect(() => {
    if (scanState === 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
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
      const scanResult = await recognizePlant(discoveredPlantIds);
      setResult(scanResult);
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

  return (
    <View style={styles.container}>
      {/* Camera mock */}
      <View style={styles.cameraView}>
        {/* Simulated camera bg */}
        <View style={styles.cameraBg}>
          <Text style={styles.cameraBgText}>
            {scanState === 'idle'
              ? '📷 カメラをかざして\nスキャンボタンを押してください'
              : scanState === 'scanning'
              ? '🔍 植物を解析中...'
              : '✅ スキャン完了'}
          </Text>
        </View>

        {/* Viewfinder overlay */}
        <View style={styles.viewfinderOverlay}>
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

          {/* Spinner */}
          {scanState === 'scanning' && (
            <Animated.Text
              style={[styles.spinner, { transform: [{ rotate: spin }] }]}
            >
              ⚙️
            </Animated.Text>
          )}
        </View>

        {/* Hint text */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            {scanState === 'idle'
              ? '⚠️ AI判定は参考情報です。自己判断での採取・摂取は危険です'
              : scanState === 'scanning'
              ? '植物の特徴を分析しています...'
              : '判定完了！結果を確認してください'}
          </Text>
        </View>
      </View>

      {/* Scan button */}
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

        {/* Disclaimer */}
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
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  cameraView: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBg: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1117',
  },
  cameraBgText: {
    color: '#4CAF50',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  viewfinderOverlay: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00FF41',
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00FF41',
    borderTopRightRadius: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00FF41',
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00FF41',
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00FF41',
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    fontSize: 32,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 10,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
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
