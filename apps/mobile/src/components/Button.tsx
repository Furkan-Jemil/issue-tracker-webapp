import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';

type ButtonVariant = 'primary' | 'tonal' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export default function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style }: ButtonProps) {
  const { colors, typography, radius, spacing } = useTheme();

  const bgColor = {
    primary: colors.primary,
    tonal: colors.primaryContainer,
    outline: 'transparent',
    ghost: 'transparent',
    danger: colors.error,
  }[variant];

  const txtColor = {
    primary: colors.onPrimary,
    tonal: colors.onPrimaryContainer,
    outline: colors.primary,
    ghost: colors.primary,
    danger: colors.onError,
  }[variant];

  const borderColor = {
    primary: 'transparent',
    tonal: 'transparent',
    outline: colors.outline,
    ghost: 'transparent',
    danger: 'transparent',
  }[variant];

  const height = { sm: 36, md: 44, lg: 52 }[size];
  const padH = { sm: spacing.md, md: spacing.lg, lg: spacing.xl }[size];
  const txtStyle = { sm: typography.labelBadge, md: typography.bodySmBold, lg: typography.sectionHeading }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          height,
          paddingHorizontal: padH,
          borderRadius: radius.md,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={txtColor} />
      ) : (
        <>
          {icon}
          <Text style={[txtStyle, { color: txtColor, marginLeft: icon ? spacing.iconGap : 0 }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
