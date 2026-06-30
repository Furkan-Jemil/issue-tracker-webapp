import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useResponsive } from './useResponsive';

interface TwoPaneProps {
  main: React.ReactNode;
  side: React.ReactNode;
  /** Fixed width of the side panel on tablet (Figma uses 300px). */
  sideWidth?: number;
  /** Gap between panes on tablet. */
  gap?: number;
  style?: ViewStyle;
}

/**
 * Stacks `main` then `side` vertically on phone; lays them side-by-side on
 * tablet (main flexes, side is a fixed-width rail) — the Figma 60/40 split.
 */
export default function TwoPane({ main, side, sideWidth = 300, gap = 16, style }: TwoPaneProps) {
  const { isTablet } = useResponsive();

  if (!isTablet) {
    return (
      <View style={style}>
        {main}
        {side}
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start' }, style]}>
      <View style={{ flex: 1, minWidth: 0 }}>{main}</View>
      <View style={{ width: sideWidth, marginLeft: gap }}>{side}</View>
    </View>
  );
}
