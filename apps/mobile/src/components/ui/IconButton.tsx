import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  /** Filled lime when active (Figma toolbar pattern). */
  active?: boolean;
  /** Small count badge in the corner. */
  badge?: number;
  size?: number;
}

/** Square card button used across toolbars (filter, view toggle, theme). */
export default function IconButton({ icon, onPress, active, badge, size = 36 }: IconButtonProps) {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: radius.lg,
          backgroundColor: active ? colors.green : colors.card,
        },
      ]}
    >
      {icon}
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 8 },
});
