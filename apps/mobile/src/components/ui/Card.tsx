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
          borderRadius: radius.xl,
          padding: padding,
          borderColor: colors.cardBorder,
          borderWidth: StyleSheet.hairlineWidth,
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
        activeOpacity={0.95}
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, tension: 150, friction: 8, useNativeDriver: true }).start()}
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
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
});
