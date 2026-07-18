import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, lightColors, darkColors } from './colors';
import { space, radius, type, weight, motion, minTapTarget } from './tokens';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: AppColors;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  weight: typeof weight;
  motion: typeof motion;
  minTapTarget: number;
}

function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    space,
    radius,
    type,
    weight,
    motion,
    minTapTarget,
  };
}

const ThemeContext = createContext<Theme>(buildTheme('light'));

/**
 * Provides the resolved theme (light/dark) based on the device's system
 * setting. An in-app override (Settings > appearance) can be layered on top
 * in a later PR (Fieldbook settings, §7.8) — for now it follows the OS.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(() => buildTheme(scheme === 'dark' ? 'dark' : 'light'), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
