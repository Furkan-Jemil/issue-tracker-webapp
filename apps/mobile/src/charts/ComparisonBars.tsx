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
  onBarPress?: (label: string) => void;
}

/** Grouped open-vs-closed bars, View-based (crisp, no chart lib). */
export default function ComparisonBars({ data, height = 150, openColor, closedColor, onBarPress }: ComparisonBarsProps) {
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
          <TouchableOpacity key={g.label} style={styles.group} onPress={() => onBarPress?.(g.label)} disabled={!onBarPress} activeOpacity={0.7}>
            <View style={styles.bars}>
              {[g.open, g.closed].map((val, vi) => {
                const idx = gi * 2 + vi;
                const h = Math.max(2, (val / max) * plotH);
                return (
                  <Animated.View
                    key={vi}
                    style={[styles.bar, {
                      height: anims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, h] }),
                      backgroundColor: vi === 0 ? oc : cc,
                    }]}
                  />
                );
              })}
            </View>
            <Text numberOfLines={1} style={[styles.axis, { color: colors.mutedForeground }]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.legend}>
        {[['Open', oc], ['Closed', cc]].map(([l, c]) => (
          <View key={l} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: c as string }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  group: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: '100%', paddingBottom: 4 },
  bar: { width: 16, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { fontFamily: 'Outfit_400Regular', fontSize: 9, marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: 'Outfit_500Medium', fontSize: 11 },
});
