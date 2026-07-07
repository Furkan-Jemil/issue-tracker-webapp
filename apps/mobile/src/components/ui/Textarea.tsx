import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface TextareaProps extends TextInputProps {
  label?: string;
  rows?: number;
  error?: string;
}

export default function Textarea({ label, rows = 4, style, error, ...rest }: TextareaProps) {
  const { colors, radius, typography } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>}
      <TextInput
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.mutedForeground}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.area,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error : focused ? colors.green : colors.outline,
            borderRadius: radius.lg,
            color: colors.foreground,
            minHeight: 22 * rows,
          },
          style as any,
        ]}
        {...rest}
      />
      {error && (
        <Text style={[typography.micro, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  area: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
});
