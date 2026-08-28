import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Tracks the user's reduced-motion preference across native and web.
 *
 * React Native's AccessibilityInfo is authoritative on iOS/Android. On web we
 * subscribe directly to `prefers-reduced-motion` so browser/OS changes are
 * reflected immediately even when the RN web adapter does not surface the
 * native accessibility event consistently.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const syncPreference = () => setReduceMotion(media.matches);

      syncPreference();

      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', syncPreference);
        return () => media.removeEventListener('change', syncPreference);
      }

      // Safari versions that predate MediaQueryList.addEventListener.
      media.addListener?.(syncPreference);
      return () => media.removeListener?.(syncPreference);
    }

    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // Keep the conservative default (motion enabled) when the platform
        // cannot report its preference. Avoid an unhandled promise rejection.
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
