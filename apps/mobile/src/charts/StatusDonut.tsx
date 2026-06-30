import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
}

/** Donut chart drawn as stacked stroked-circle arcs (no chart lib needed). */
export default function StatusDonut({ data, size = 150, strokeWidth = 22 }: StatusDonutProps) {
  const { colors } = useTheme();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offsetAcc = 0;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* track */}
          <Circle cx={cx} cy={cy} r={r} stroke={colors.muted} strokeWidth={strokeWidth} fill="none" />
          <G rotation={-90} origin={`${cx}, ${cy}`}>
            {data.map((d, i) => {
              const frac = d.value / total;
              const dash = frac * circ;
              const seg = (
                <Circle
                  key={i}
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
          </G>
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.total, { color: colors.foreground }]}>{total}</Text>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>total</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.label} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: d.color }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>
              {d.label} <Text style={{ color: colors.mutedForeground }}>{d.value}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  total: { fontFamily: 'Outfit_700Bold', fontSize: 24 },
  totalLabel: { fontFamily: 'Outfit_400Regular', fontSize: 10, marginTop: -2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: 'Outfit_500Medium', fontSize: 11 },
});
