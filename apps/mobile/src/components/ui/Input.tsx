import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  height?: number;
  error?: string;
}

/** Figma input: white card bg, slate border, lime focus ring. */
export default function Input({ label, required, leftIcon, height = 40, style, error, ...rest }: InputProps) {
  const { colors, radius, typography } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.well,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error : focused ? colors.green : colors.outline,
            borderRadius: radius.lg,
            height,
          },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            { color: colors.foreground, marginLeft: leftIcon ? 6 : 0 },
            style as any,
          ]}
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
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  well: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  icon: { alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: '100%', paddingVertical: 0, fontFamily: 'Outfit_400Regular', fontSize: 14 },
});
