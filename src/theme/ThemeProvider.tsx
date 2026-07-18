import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, lightColors, darkColors } from './colors';
import { space, radius, type, weight, motion, minTapTarget } from './tokens';
import { useGameStore } from '../store/useGameStore';

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
 * Provides the resolved theme (light/dark), following the device's system
 * setting unless the user has set an explicit override in Fieldbook settings
 * (§7.8 "ダークモード"). `themeOverride` defaults to 'system'.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const override = useGameStore((s) => s.themeOverride);
  const resolvedMode: ThemeMode = override === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : override;
  const theme = useMemo(() => buildTheme(resolvedMode), [resolvedMode]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
