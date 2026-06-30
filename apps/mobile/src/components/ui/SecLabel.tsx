import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';

/** Small uppercase section label (Figma SecLabel). */
export default function SecLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: 'Outfit_600SemiBold',
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: colors.mutedForeground,
          marginBottom: 8,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
