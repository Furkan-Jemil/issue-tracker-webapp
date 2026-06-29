import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TextStyle } from 'react-native';

/// ──────────────────────────────────────────────
/// Stitch DES Design System — ET Green Theme
/// Canonical spec from stitch_des_design_system
/// ──────────────────────────────────────────────

const lightColors = {
  // Brand
  primary: '#3d6a00',
  onPrimary: '#ffffff',
  primaryContainer: '#80ca28',
  onPrimaryContainer: '#2d5100',
  primaryFixed: '#aaf854',
  primaryFixedDim: '#8fdb39',
  inversePrimary: '#8fdb39',

  // Surface system (tonal layers)
  background: '#f8f9ff',
  surface: '#f8f9ff',
  surfaceDim: '#cbdbf5',
  surfaceBright: '#f8f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerHigh: '#dce9ff',
  surfaceContainerHighest: '#d3e4fe',

  onBackground: '#0b1c30',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#414937',

  // Secondary (slate)
  secondary: '#565e74',
  onSecondary: '#ffffff',
  secondaryContainer: '#dae2fd',
  onSecondaryContainer: '#5c647a',

  // Tertiary (magenta)
  tertiary: '#98378b',
  onTertiary: '#ffffff',
  tertiaryContainer: '#ff90ea',
  onTertiaryContainer: '#7d1d72',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Outline
  outline: '#717a65',
  outlineVariant: '#c1cab1',
  surfaceTint: '#3d6a00',

  // Inverse
  inverseSurface: '#213145',
  inverseOnSurface: '#eaf1ff',

  // Foreground / text
  foreground: '#0b1c30',

  // Legacy compat aliases
  card: '#ffffff',
  input: '#eff4ff',
  border: '#c1cab1',
  primaryForeground: '#ffffff',
  secondaryText: '#414937',
  destructive: '#ba1a1a',
  destructiveForeground: '#ffffff',

  // Status semantics (tint & tone)
  statusOpenBg: '#fee2e2',
  statusOpenText: '#b91c1c',
  statusInProgressBg: '#dbeafe',
  statusInProgressText: '#1d4ed8',
  statusResolvedBg: '#dcfce7',
  statusResolvedText: '#15803d',
  statusClosedBg: '#f1f5f9',
  statusClosedText: '#64748b',

  // Priority semantics
  priorityHighBg: '#ffedd5',
  priorityHighText: '#c2410c',
  priorityMediumBg: '#fef9c3',
  priorityMediumText: '#a16207',
  priorityLowBg: '#f1f5f9',
  priorityLowText: '#64748b',

  // Charts (monochromatic blue scale)
  chart1: '#93c5fd',
  chart2: '#3b82f6',
  chart3: '#1d4ed8',
  chart4: '#1e3a8a',
  chartOpen: '#3b82f6',
  chartInProgress: '#f59e0b',
  chartResolved: '#10b981',
  chartClosed: '#6b7280',
  chartInProgressSoft: '#fef3c7',
};

export type ThemeColors = typeof lightColors;

const darkColors: ThemeColors = {
  primary: '#8fdb39',
  onPrimary: '#162300',
  primaryContainer: '#2d5100',
  onPrimaryContainer: '#aaf854',
  primaryFixed: '#aaf854',
  primaryFixedDim: '#8fdb39',
  inversePrimary: '#3d6a00',

  background: '#030712',
  surface: '#0f172a',
  surfaceDim: '#030712',
  surfaceBright: '#1e293b',
  surfaceContainerLowest: '#0a0f1a',
  surfaceContainerLow: '#0f172a',
  surfaceContainer: '#1a2332',
  surfaceContainerHigh: '#253040',
  surfaceContainerHighest: '#303b4d',

  onBackground: '#eaf1ff',
  onSurface: '#eaf1ff',
  onSurfaceVariant: '#b9c4d0',

  secondary: '#bec6e0',
  onSecondary: '#283041',
  secondaryContainer: '#3e475c',
  onSecondaryContainer: '#dae2fd',

  tertiary: '#ffacec',
  onTertiary: '#530049',
  tertiaryContainer: '#7b1c71',
  onTertiaryContainer: '#ffd7f2',

  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  outline: '#8994a0',
  outlineVariant: '#3f485a',
  surfaceTint: '#8fdb39',

  inverseSurface: '#eaf1ff',
  inverseOnSurface: '#213145',

  foreground: '#eaf1ff',

  card: '#1a2332',
  input: '#253040',
  border: '#3f485a',
  primaryForeground: '#162300',
  secondaryText: '#b9c4d0',
  destructive: '#ffb4ab',
  destructiveForeground: '#690005',

  statusOpenBg: '#4a1515',
  statusOpenText: '#fca5a5',
  statusInProgressBg: '#1e3a5f',
  statusInProgressText: '#93c5fd',
  statusResolvedBg: '#14532d',
  statusResolvedText: '#86efac',
  statusClosedBg: '#1f2937',
  statusClosedText: '#9ca3af',

  priorityHighBg: '#4a1c0e',
  priorityHighText: '#fdba74',
  priorityMediumBg: '#3b3511',
  priorityMediumText: '#fde68a',
  priorityLowBg: '#1f2937',
  priorityLowText: '#9ca3af',

  chart1: '#60a5fa',
  chart2: '#3b82f6',
  chart3: '#2563eb',
  chart4: '#1d4ed8',
  chartOpen: '#3b82f6',
  chartInProgress: '#f59e0b',
  chartResolved: '#10b981',
  chartClosed: '#6b7280',
  chartInProgressSoft: '#78350f',
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
  bodySmBold: { fontFamily: FONT_SEMI, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: FONT, fontSize: 14, lineHeight: 20 },
  labelBadge: { fontFamily: FONT_SEMI, fontSize: 12, lineHeight: 16 },
  micro: { fontFamily: FONT_MED, fontSize: 11, lineHeight: 14 },
  nanoCaps: { fontFamily: FONT_SEMI, fontSize: 10, lineHeight: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  monoId: { fontFamily: FONT_MONO, fontSize: 10, lineHeight: 12, letterSpacing: 0.3 },
};

/// 4px base grid spacing
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  cardPadding: 20,
  pageMargin: 24,
  sectionGap: 12,
  elementGap: 8,
  iconGap: 6,
};

const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

interface ThemeContextValue {
  colors: typeof lightColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  isTablet: boolean;
  pagePadding: number;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      radius,
      isTablet: false,
      pagePadding: 24,
      isDark,
      toggleTheme,
    }),
    [isDark, toggleTheme],
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
