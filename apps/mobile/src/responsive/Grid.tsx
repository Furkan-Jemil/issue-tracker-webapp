import React from 'react';
import { View, ViewStyle } from 'react-native';

interface GridProps {
  children: React.ReactNode;
  /** Number of columns. */
  columns: number;
  /** Gap between items (both axes). */
  gap?: number;
  style?: ViewStyle;
}

/**
 * Simple responsive grid built on flex-wrap. Each child is wrapped in a cell
 * whose width is a percentage of the row minus the gutter, so N columns lay
 * out evenly and wrap to new rows automatically.
 */
export default function Grid({ children, columns, gap = 10, style }: GridProps) {
  const items = React.Children.toArray(children);
  const widthPct = `${100 / columns}%`;

  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2 }, style]}>
      {items.map((child, i) => (
        <View
          key={i}
          style={{ width: widthPct as unknown as number, paddingHorizontal: gap / 2, marginBottom: gap }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
