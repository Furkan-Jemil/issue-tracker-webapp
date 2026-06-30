import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { getInitials } from '../../utils/formatters';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface AvatarProps {
  /** Pass initials directly… */
  initials?: string;
  /** …or a name/email to derive them. */
  name?: string;
  email?: string;
  size?: AvatarSize;
  /** Online/offline dot. Omit to hide. */
  online?: boolean;
}

const DIMS: Record<AvatarSize, { box: number; font: number }> = {
  xs: { box: 20, font: 8 },
  sm: { box: 28, font: 10 },
  md: { box: 32, font: 12 },
  lg: { box: 44, font: 15 },
};

export default function Avatar({ initials, name, email, size = 'md', online }: AvatarProps) {
  const { colors } = useTheme();
  const { box, font } = DIMS[size];
  const label = initials ?? getInitials(name, email);

  return (
    <View>
      <View
        style={[
          styles.circle,
          {
            width: box,
            height: box,
            borderRadius: box / 2,
            backgroundColor: colors.green + '26',
            borderColor: colors.green + '40',
          },
        ]}
      >
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: font, color: colors.greenFg }}>{label}</Text>
      </View>
      {online != null && (
        <View
          style={[
            styles.dot,
            { backgroundColor: online ? '#22c55e' : '#94a3b8', borderColor: colors.card },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
  },
});
