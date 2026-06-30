import { useWindowDimensions } from 'react-native';

export const TABLET_BREAKPOINT = 768;
export const LARGE_TABLET_BREAKPOINT = 1024;

export interface Responsive {
  width: number;
  height: number;
  isTablet: boolean;
  isLargeTablet: boolean;
  /** Suggested number of columns for stat/card grids. */
  columns: number;
  /** Horizontal page padding. */
  pagePadding: number;
  /** Max content width for centered reading layouts (forms, settings). */
  contentMaxWidth: number;
}

/**
 * Single source of truth for layout breakpoints. Figma uses one breakpoint
 * (`md:` = 768px): phone below, tablet/desktop above.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    columns: isLargeTablet ? 4 : isTablet ? 3 : 2,
    pagePadding: isTablet ? 24 : 16,
    contentMaxWidth: isTablet ? 720 : width,
  };
}
