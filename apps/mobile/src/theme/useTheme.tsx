import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { TextStyle, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/// ──────────────────────────────────────────────
/// Figma "Mobile & Tablet Design Guide" — ET Green Theme
/// Source of truth: ~/Downloads/Mobile & Tablet Design Guide(1)/src/styles/theme.css
/// Primary lime #80ca28 on slate surfaces. Multi-color charts.
/// ──────────────────────────────────────────────

const THEME_KEY = '@theme_mode';
export const TABLET_BREAKPOINT = 768;

const lightColors = {
  // Brand (Figma GREEN = #80ca28, GREEN_FG = #3a6b00 for text-on-light)
  primary: '#80ca28',
  onPrimary: '#ffffff',
  primaryContainer: '#80ca28',
  onPrimaryContainer: '#3a6b00',
  green: '#80ca28',
  greenFg: '#3a6b00',
  primaryFixed: '#aaf854',
  primaryFixedDim: '#8fdb39',
  inversePrimary: '#8fdb39',

  // Surfaces (Figma: slate-100 bg, white cards)
  background: '#F4F7FA',
  surface: '#ffffff',
  surfaceDim: '#e2e8f0',
  surfaceBright: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8fafc',
  surfaceContainer: '#f1f5f9',
  surfaceContainerHigh: '#e2e8f0',
  surfaceContainerHighest: '#e2e8f0',

  onBackground: '#0A192F',
  onSurface: '#0A192F',
  onSurfaceVariant: '#64748b',
  foreground: '#0A192F',
  mutedForeground: '#64748b',
  muted: '#f1f5f9',

  // Secondary (slate)
  secondary: '#64748b',
  onSecondary: '#ffffff',
  secondaryContainer: '#e2e8f0',
  onSecondaryContainer: '#475569',
  secondaryText: '#64748b',

  // Tertiary (kept for compat)
  tertiary: '#8b5cf6',
  onTertiary: '#ffffff',
  tertiaryContainer: '#ede9fe',
  onTertiaryContainer: '#6d28d9',

  // Error
  error: '#ef4444',
  onError: '#ffffff',
  errorContainer: '#fee2e2',
  onErrorContainer: '#b91c1c',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',

  // Outline / borders
  outline: '#cbd5e1',
  outlineVariant: '#e2e8f0',
  border: '#e2e8f0',
  surfaceTint: '#80ca28',

  // Inverse
  inverseSurface: '#1e293b',
  inverseOnSurface: '#f8fafc',

  // Legacy compat aliases
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  input: '#ffffff',
  primaryForeground: '#ffffff',

  // Status semantics (badge bg + text) — Blue monochromatic palette
  statusOpenBg: '#DBEAFE',
  statusOpenText: '#2563EB',
  statusInProgressBg: '#BFDBFE',
  statusInProgressText: '#1D4ED8',
  statusResolvedBg: '#DBEAFE',
  statusResolvedText: '#1D4ED8',
  statusClosedBg: '#F1F5F9',
  statusClosedText: '#475569',

  // Priority semantics
  priorityHighBg: '#ffedd5',
  priorityHighText: '#c2410c',
  priorityMediumBg: '#fef9c3',
  priorityMediumText: '#a16207',
  priorityLowBg: '#f1f5f9',
  priorityLowText: '#64748b',

  // Charts — Blue monochromatic palette
  chart1: '#93C5FD',
  chart2: '#3b82f6',
  chart3: '#1D4ED8',
  chart4: '#ef4444',
  chart5: '#1E3A8A',
  chartOpen: '#93C5FD',
  chartInProgress: '#3b82f6',
  chartResolved: '#1D4ED8',
  chartClosed: '#1E3A8A',
  chartInProgressSoft: '#DBEAFE',
};

export type ThemeColors = typeof lightColors;

const darkColors: ThemeColors = {
  primary: '#80ca28',
  onPrimary: '#0f172a',
  primaryContainer: '#80ca28',
  onPrimaryContainer: '#a8df50',
  green: '#80ca28',
  greenFg: '#a8df50',
  primaryFixed: '#aaf854',
  primaryFixedDim: '#8fdb39',
  inversePrimary: '#3d6a00',

  background: '#030712',
  surface: '#0f172a',
  surfaceDim: '#030712',
  surfaceBright: '#1e293b',
  surfaceContainerLowest: '#0f172a',
  surfaceContainerLow: '#1e293b',
  surfaceContainer: '#1e293b',
  surfaceContainerHigh: '#253040',
  surfaceContainerHighest: '#303b4d',

  onBackground: '#f8fafc',
  onSurface: '#f8fafc',
  onSurfaceVariant: '#94a3b8',
  foreground: '#f8fafc',
  mutedForeground: '#94a3b8',
  muted: '#1e293b',

  secondary: '#94a3b8',
  onSecondary: '#0f172a',
  secondaryContainer: '#334155',
  onSecondaryContainer: '#cbd5e1',
  secondaryText: '#94a3b8',

  tertiary: '#a78bfa',
  onTertiary: '#2e1065',
  tertiaryContainer: '#5b21b6',
  onTertiaryContainer: '#ede9fe',

  error: '#ef4444',
  onError: '#ffffff',
  errorContainer: '#7f1d1d',
  onErrorContainer: '#fecaca',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',

  outline: '#475569',
  outlineVariant: '#1e293b',
  border: '#1e293b',
  surfaceTint: '#80ca28',

  inverseSurface: '#f8fafc',
  inverseOnSurface: '#1e293b',

  card: '#0f172a',
  cardBorder: '#1e293b',
  input: '#1e293b',
  primaryForeground: '#0f172a',

  statusOpenBg: '#1E3A5F',
  statusOpenText: '#93C5FD',
  statusInProgressBg: '#1E3A8A',
  statusInProgressText: '#60A5FA',
  statusResolvedBg: '#172554',
  statusResolvedText: '#93C5FD',
  statusClosedBg: '#1E293B',
  statusClosedText: '#94A3B8',

  priorityHighBg: '#431407',
  priorityHighText: '#fb923c',
  priorityMediumBg: '#422006',
  priorityMediumText: '#fbbf24',
  priorityLowBg: '#1e293b',
  priorityLowText: '#94a3b8',

  chart1: '#93C5FD',
  chart2: '#3b82f6',
  chart3: '#1D4ED8',
  chart4: '#ef4444',
  chart5: '#1E3A8A',
  chartOpen: '#93C5FD',
  chartInProgress: '#3b82f6',
  chartResolved: '#1D4ED8',
  chartClosed: '#1E3A8A',
  chartInProgressSoft: '#172554',
};

const FONT = 'Outfit_400Regular';
const FONT_BOLD = 'Outfit_700Bold';
const FONT_SEMI = 'Outfit_600SemiBold';
const FONT_MED = 'Outfit_500Medium';
const FONT_MONO = 'JetBrainsMono_400Regular';

const typography: Record<string, TextStyle> = {
  display: { fontFamily: FONT_BOLD, fontSize: 24, lineHeight: 32, letterSpacing: -0.3 },
  pageTitle: { fontFamily: FONT_BOLD, fontSize: 20, lineHeight: 28, letterSpacing: -0.3 },
  sectionHeading: { fontFamily: FONT_BOLD, fontSize: 16, lineHeight: 24 },
  cardTitle: { fontFamily: FONT_BOLD, fontSize: 14, lineHeight: 20 },
  bodyMd: { fontFamily: FONT, fontSize: 15, lineHeight: 22 },
  bodySmBold: { fontFamily: FONT_SEMI, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: FONT, fontSize: 14, lineHeight: 20 },
  labelBadge: { fontFamily: FONT_SEMI, fontSize: 12, lineHeight: 16 },
  micro: { fontFamily: FONT_MED, fontSize: 11, lineHeight: 14 },
  nanoCaps: { fontFamily: FONT_SEMI, fontSize: 10, lineHeight: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  monoId: { fontFamily: FONT_MONO, fontSize: 10, lineHeight: 12, letterSpacing: 0.3 },
  // Dashboard-specific
  statValue: { fontFamily: FONT_BOLD, fontSize: 30, lineHeight: 36 },
  statLabel: { fontFamily: FONT_MED, fontSize: 11, lineHeight: 14 },
  cardDesc: { fontFamily: FONT, fontSize: 11, lineHeight: 16 },
  footerCaption: { fontFamily: FONT_BOLD, fontSize: 12, lineHeight: 16, textAlign: 'center' as const },
  footerSub: { fontFamily: FONT, fontSize: 10, lineHeight: 14, textAlign: 'center' as const },
  // Task detail
  detailTitle: { fontFamily: FONT_BOLD, fontSize: 18, lineHeight: 26 },
  detailLabel: { fontFamily: FONT_MED, fontSize: 11, lineHeight: 14 },
  detailValue: { fontFamily: FONT, fontSize: 13, lineHeight: 18 },
};

/// 4px base grid spacing
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  cardPadding: 16,
  pageMargin: 16,
  pageMarginTablet: 24,
  sectionGap: 16,
  elementGap: 8,
  iconGap: 6,
};

/// Figma radii: controls rounded-xl (12), cards rounded-2xl (16), badges rounded-md (6)
const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 999,
};

const shadows: Record<string, ViewStyle> = {
  sm: {
    ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 }, android: { elevation: 2 }, default: {} }),
  },
  md: {
    ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 4 }, default: {} }),
  },
  lg: {
    ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 }, android: { elevation: 8 }, default: {} }),
  },
  fab: {
    ...Platform.select({ ios: { shadowColor: '#80ca28', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }, android: { elevation: 6 }, default: {} }),
  },
};

const animation = {
  duration: { fast: 200, normal: 400, slow: 600 },
  spring: { tension: 120, friction: 14 },
  easing: { default: [0.25, 0.1, 0.25, 1] as const },
};

interface ThemeContextValue {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  animation: typeof animation;
  isTablet: boolean;
  isLargeTablet: boolean;
  width: number;
  pagePadding: number;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const isTablet = width >= TABLET_BREAKPOINT;
  const isLargeTablet = width >= 1024;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      radius,
      shadows,
      animation,
      isTablet,
      isLargeTablet,
      width,
      pagePadding: isTablet ? spacing.pageMarginTablet : spacing.pageMargin,
      isDark,
      toggleTheme,
    }),
    [isDark, isTablet, isLargeTablet, width, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
