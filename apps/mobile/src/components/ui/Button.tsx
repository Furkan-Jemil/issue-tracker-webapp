import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Animated, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const HEIGHTS: Record<Size, number> = { sm: 32, md: 36, lg: 40 };
const PAD: Record<Size, number> = { sm: 12, md: 16, lg: 20 };
const FONT: Record<Size, number> = { sm: 12, md: 14, lg: 14 };

export default function Button({
  title, onPress, variant = 'default', size = 'md', loading, disabled, icon, fullWidth, style,
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bg = {
    default: colors.green,
    outline: 'transparent',
    ghost: 'transparent',
    destructive: colors.destructive,
  }[variant];

  const fg = {
    default: '#ffffff',
    outline: colors.foreground,
    ghost: colors.mutedForeground,
    destructive: colors.onError,
  }[variant];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={title}
        onPressIn={() => {
          Animated.spring(scaleAnim, { toValue: 0.96, tension: 150, friction: 8, useNativeDriver: true }).start();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        onPressOut={() => {
          Animated.spring(scaleAnim, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }).start();
        }}
        style={[
          styles.base,
          {
            backgroundColor: bg,
            borderColor: variant === 'outline' ? colors.outline : 'transparent',
            borderWidth: variant === 'outline' ? 1 : 0,
            height: HEIGHTS[size],
            paddingHorizontal: PAD[size],
            borderRadius: radius.lg,
            opacity: disabled ? 0.5 : 1,
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, { color: fg, fontSize: FONT[size], marginLeft: icon ? 6 : 0 }]}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Outfit_600SemiBold',
  },
});
