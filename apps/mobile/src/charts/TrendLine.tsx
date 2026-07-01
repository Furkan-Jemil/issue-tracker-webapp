import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Animated, TouchableOpacity } from 'react-native';
import Svg, { Polyline, Line as SvgLine } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';

export interface TrendPoint {
  label: string;
  open: number;
  prog: number;
}

interface TrendLineProps {
  data: TrendPoint[];
  height?: number;
  onPointPress?: (label: string) => void;
}

/** Two-series line chart on react-native-svg, auto-fitting to width. */
export default function TrendLine({ data, height = 140, onPointPress }: TrendLineProps) {
  const { colors } = useTheme();
  const [w, setW] = React.useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideAnim]);

  const plotH = height - 22;
  const max = Math.max(1, ...data.flatMap((d) => [d.open, d.prog]));
  const n = Math.max(1, data.length - 1);

  const toPoints = (key: 'open' | 'prog') =>
    data
      .map((d, i) => {
        const x = (i / n) * (w || 1);
        const y = plotH - (d[key] / max) * plotH;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <Animated.View onLayout={onLayout} style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={{ height }}>
        {w > 0 && (
          <Svg width={w} height={height}>
            {[0.5, 1].map((f, i) => (
              <SvgLine key={i} x1={0} y1={plotH * f} x2={w} y2={plotH * f} stroke={colors.cardBorder} strokeWidth={1} />
            ))}
            <Polyline points={toPoints('open')} fill="none" stroke={colors.chart2} strokeWidth={2} />
            <Polyline points={toPoints('prog')} fill="none" stroke={colors.chart3} strokeWidth={2} />
          </Svg>
        )}
      </View>
      <View style={styles.legend}>
        {[['Open', colors.chart2], ['In Progress', colors.chart3]].map(([l, c]) => (
          <TouchableOpacity key={l} style={styles.legendItem} onPress={() => onPointPress?.(l)} disabled={!onPointPress}>
            <View style={[styles.swatch, { backgroundColor: c as string }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: 'Outfit_500Medium', fontSize: 11 },
});
