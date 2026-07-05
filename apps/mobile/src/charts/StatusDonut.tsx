import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: DonutDatum[];
  size?: number;
  strokeWidth?: number;
  onSlicePress?: (label: string) => void;
}

/** Donut chart drawn as stacked stroked-circle arcs (no chart lib needed). */
export default function StatusDonut({ data, size = 150, strokeWidth = 22, onSlicePress }: StatusDonutProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offsetAcc = 0;

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ width: size, height: size, opacity: scaleAnim, transform: [{ scale: scaleAnim }] }}>
        <Svg width={size} height={size}>
          {/* track */}
          <Circle cx={cx} cy={cy} r={r} stroke={colors.muted} strokeWidth={strokeWidth} fill="none" />
          <G rotation={-90} origin={`${cx}, ${cy}`}>
            {/* Visible arcs */}
            {data.map((d, i) => {
              const frac = d.value / total;
              const dash = frac * circ;
              const seg = (
                <Circle
                  key={`seg-${i}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  stroke={d.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                  fill="none"
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-offsetAcc}
                />
              );
              offsetAcc += dash;
              return seg;
            })}
            {/* Wider transparent hit arcs — reliable touch target over each slice */}
            {(() => {
              let hitAcc = 0;
              return data.map((d, i) => {
                const frac = d.value / total;
                const dash = frac * circ;
                const hit = dash > 0 ? (
                  <Circle
                    key={`hit-${i}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    stroke={d.color}
                    strokeOpacity={0}
                    strokeWidth={strokeWidth + 20}
                    strokeLinecap="butt"
                    fill="none"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={-hitAcc}
                    onPressIn={() => onSlicePress?.(d.label)}
                  />
                ) : null;
                hitAcc += dash;
                return hit;
              });
            })()}
          </G>
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.total, { color: colors.foreground }]}>{total}</Text>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>total</Text>
        </View>
      </Animated.View>

      <View style={styles.legend}>
        {data.map((d) => (
          <TouchableOpacity key={d.label} style={styles.legendItem} onPress={() => onSlicePress?.(d.label)} disabled={!onSlicePress}>
            <View style={[styles.swatch, { backgroundColor: d.color }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>
              {d.label} <Text style={{ color: colors.mutedForeground }}>{d.value}</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  total: { fontFamily: 'Outfit_700Bold', fontSize: 24 },
  totalLabel: { fontFamily: 'Outfit_400Regular', fontSize: 10, marginTop: -2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: 'Outfit_500Medium', fontSize: 11 },
});
