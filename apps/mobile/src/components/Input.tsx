import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export default function Input({ label, error, leftIcon, style, ...rest }: InputProps) {
  const { colors, typography, radius, spacing } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing.xs }}>
      {label && (
        <Text style={[typography.bodySmBold, { color: colors.onSurface }]}>{label}</Text>
      )}
      <View
        style={[
          styles.well,
          {
            backgroundColor: focused ? colors.surfaceContainerLowest : colors.surfaceContainerLow,
            borderColor: focused ? colors.primaryContainer : 'transparent',
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            height: 48,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.iconSlot}>{leftIcon}</View>
        )}
        <TextInput
          placeholderTextColor={colors.onSurfaceVariant}
          style={[
            typography.bodySm,
            {
              flex: 1,
              color: colors.onSurface,
              height: '100%',
              paddingVertical: 0,
              marginLeft: leftIcon ? spacing.iconGap : 0,
            },
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
      </View>
      {error && (
        <Text style={[typography.micro, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  iconSlot: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
