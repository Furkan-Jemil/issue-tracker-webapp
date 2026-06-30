import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  padding?: number;
  style?: ViewStyle;
}

/** Figma card: white surface, 16px radius, soft shadow, no visible border in light. */
export default function Card({ children, padding, style }: CardProps) {
  const { colors, radius, isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          padding: padding,
          borderColor: colors.cardBorder,
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
});
