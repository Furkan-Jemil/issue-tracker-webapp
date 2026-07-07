import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  padding?: number;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityRole?: 'button';
  accessibilityLabel?: string;
}

/** Figma card: white surface, 16px radius, soft shadow, no visible border in light. */
export default function Card({ children, padding, style, onPress, accessibilityRole, accessibilityLabel }: CardProps) {
  const { colors, radius, isDark } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: padding,
          borderColor: isDark ? colors.border : colors.outlineVariant,
          borderWidth: 1,
          ...(isDark ? { shadowOpacity: 0, elevation: 0 } : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, tension: 150, friction: 8, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }).start()}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          {content}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
});
