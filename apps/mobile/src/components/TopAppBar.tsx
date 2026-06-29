import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Bell, User } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { getInitials } from '../utils/formatters';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export default function TopAppBar({ title, subtitle, onBackPress, onNotificationPress, onProfilePress }: TopAppBarProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const { user } = useAppContext();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: spacing.pageMargin }]}>
      <View style={styles.left}>
        {onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={[styles.backBtn, { marginRight: spacing.sm }]}>
            <ArrowLeft size={22} color={colors.onSurface} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={[typography.pageTitle, { color: colors.primary }]}>{title}</Text>
          {subtitle && (
            <Text style={[typography.micro, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.right}>
        {onNotificationPress && (
          <TouchableOpacity
            onPress={onNotificationPress}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.full }]}
          >
            <Bell size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
        {onProfilePress && (
          <TouchableOpacity
            onPress={onProfilePress}
            style={[styles.avatar, { backgroundColor: colors.primaryContainer, borderRadius: radius.full }]}
          >
            <Text style={[typography.labelBadge, { color: colors.onPrimaryContainer }]}>
              {getInitials(user?.name, user?.email)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
