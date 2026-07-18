import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/** Loading placeholder. Pulses unless the user has Reduce Motion enabled. */
export function Skeleton({ width = '100%', height = 16, radius, style }: Props) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.7);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.control,
          backgroundColor: theme.colors.surfaceTertiary,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({});
