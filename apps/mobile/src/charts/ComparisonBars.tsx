import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/useTheme';

export interface BarGroup {
  label: string;
  open: number;
  closed: number;
}

interface ComparisonBarsProps {
  data: BarGroup[];
  height?: number;
  openColor?: string;
  closedColor?: string;
  /** Fired when an open/closed bar or its legend entry is tapped. */
  onSegmentPress?: (kind: 'open' | 'closed') => void;
}

/** Grouped open-vs-closed bars, View-based (crisp, no chart lib). */
export default function ComparisonBars({ data, height = 150, openColor, closedColor, onSegmentPress }: ComparisonBarsProps) {
  const { colors } = useTheme();
  const oc = openColor ?? colors.chart2;
  const cc = closedColor ?? colors.chart3;
  const max = Math.max(1, ...data.flatMap((d) => [d.open, d.closed]));
  const plotH = height - 28;

  const barCount = data.length * 2;
  const anims = useRef(Array.from({ length: barCount }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(50, anims.map(v => Animated.spring(v, {
      toValue: 1,
      tension: 80,
      friction: 10,
      useNativeDriver: false,
    }))).start();
  }, [anims]);

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {data.map((g, gi) => (
          <View key={g.label} style={styles.group}>
            <View style={styles.bars}>
              {[g.open, g.closed].map((val, vi) => {
                const idx = gi * 2 + vi;
                const h = Math.max(2, (val / max) * plotH);
                const kind = vi === 0 ? 'open' : 'closed';
                return (
                  <TouchableOpacity
                    key={vi}
                    activeOpacity={0.7}
                    disabled={!onSegmentPress}
                    onPress={() => onSegmentPress?.(kind)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${kind} issues`}
                    style={styles.barTouch}
                  >
                    <Animated.View
                      style={[styles.bar, {
                        height: anims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, h] }),
                        backgroundColor: vi === 0 ? oc : cc,
                      }]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text numberOfLines={1} style={[styles.axis, { color: colors.mutedForeground }]}>{g.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        {([['Open', oc, 'open'], ['Closed', cc, 'closed']] as const).map(([l, c, kind]) => (
          <TouchableOpacity key={l} style={styles.legendItem} disabled={!onSegmentPress} activeOpacity={0.7} onPress={() => onSegmentPress?.(kind)} accessibilityRole="button" accessibilityLabel={`View ${l} issues`}>
            <View style={[styles.swatch, { backgroundColor: c as string }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  group: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: '100%', paddingBottom: 4 },
  barTouch: { justifyContent: 'flex-end', height: '100%' },
  bar: { width: 16, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { fontFamily: 'Outfit_400Regular', fontSize: 9, marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: 'Outfit_500Medium', fontSize: 11 },
});
