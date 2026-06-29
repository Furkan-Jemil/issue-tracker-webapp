import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  TriangleAlert,
  MessageSquare,
  UserCheck,
  Info,
  BellRing,
  CheckCheck,
  Trash2,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { safeFetch } from '../utils/api';
import TopAppBar from '../components/TopAppBar';
import AnimatedEntry from '../components/AnimatedEntry';
import EmptyState from '../components/EmptyState';
import { relativeTime } from '../utils/formatters';

const NOTIFICATION_ICON: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  critical: TriangleAlert,
  mention: MessageSquare,
  member: UserCheck,
};

function getNotificationIcon(type?: string) {
  return NOTIFICATION_ICON[type ?? ''] ?? Info;
}

function getNotificationColor(colors: any, type?: string) {
  switch (type) {
    case 'critical':
      return colors.error;
    case 'mention':
      return colors.primary;
    case 'member':
      return colors.chartResolved;
    default:
      return colors.onSurfaceVariant;
  }
}

export default function NotificationsScreen() {
  const { colors, typography, spacing, radius, pagePadding } = useTheme();
  const { notifications, isLoading, refreshData, markNotificationsRead } = useAppContext();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n: any) => !n.read).length,
    [notifications],
  );

  const sortedNotifications = useMemo(() => {
    const list = [...notifications] as any[];
    list.sort((a, b) => new Date(b.createdAt ?? b.timestamp ?? 0).getTime() - new Date(a.createdAt ?? a.timestamp ?? 0).getTime());
    return list;
  }, [notifications]);

  const groupedNotifications = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 86400000;
    const recent: any[] = [];
    const earlier: any[] = [];

    for (const n of sortedNotifications) {
      const t = new Date(n.createdAt ?? n.timestamp ?? 0).getTime();
      if (now - t < oneDayMs) {
        recent.push(n);
      } else {
        earlier.push(n);
      }
    }

    return { recent, earlier };
  }, [sortedNotifications]);

  const sectionData = useMemo(() => {
    const sections: { title?: string; data: any[] }[] = [];
    if (groupedNotifications.recent.length > 0) {
      sections.push({ data: groupedNotifications.recent });
    }
    if (groupedNotifications.earlier.length > 0) {
      sections.push({ title: 'Earlier notifications', data: groupedNotifications.earlier });
    }
    return sections;
  }, [groupedNotifications]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await safeFetch(`/api/notifications/${id}/read`, { method: 'POST' });
        refreshData();
      } catch {
        // silently fail
      }
    },
    [refreshData],
  );

  const handleDismiss = useCallback(
    async (id: string) => {
      try {
        await safeFetch(`/api/notifications/${id}`, { method: 'DELETE' });
        refreshData();
      } catch {
        // silently fail
      }
    },
    [refreshData],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markNotificationsRead();
    } catch {
      // silently fail
    }
  }, [markNotificationsRead]);

  const handleClearAll = useCallback(async () => {
    try {
      await safeFetch('/api/notifications', { method: 'DELETE' });
      refreshData();
    } catch {
      // silently fail
    }
  }, [refreshData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const renderNotification = ({ item }: { item: any }) => {
    const isUnread = !item.read;
    const Icon = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(colors, item.type);

    return (
      <View
        style={[
          styles.notificationItem,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.cardPadding,
            borderLeftWidth: 3,
            borderLeftColor: isUnread ? colors.primary : 'transparent',
            shadowColor: '#0b1c30',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 2,
            borderColor: colors.outlineVariant + '30',
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.notificationRow}>
          <View
            style={[
              styles.notifIconWrapper,
              {
                backgroundColor: iconColor + '15',
                borderRadius: radius.md,
                width: 36,
                height: 36,
              },
            ]}
          >
            <Icon size={18} color={iconColor} />
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              {item.code ? (
                <Text style={[typography.monoId, { color: colors.onSurfaceVariant }]}>
                  {item.code}
                </Text>
              ) : null}
              {isUnread && (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: colors.primary, width: 8, height: 8, borderRadius: 4 },
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                typography.bodySm,
                { color: colors.onSurface, marginTop: 2 },
              ]}
              numberOfLines={2}
            >
              {item.message ?? item.description ?? ''}
            </Text>
            <Text style={[typography.micro, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              {relativeTime(item.createdAt ?? item.timestamp ?? new Date())}
            </Text>
          </View>
        </View>
        <View style={[styles.notifActions, { marginTop: spacing.xs, gap: spacing.xs }]}>
          {isUnread && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.primary + '10',
                  borderRadius: radius.full,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                },
              ]}
              onPress={() => handleMarkRead(item.id)}
              activeOpacity={0.7}
            >
              <Check size={12} color={colors.primary} />
              <Text style={[typography.micro, { color: colors.primary, marginLeft: 4 }]}>
                Mark read
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.secondaryContainer,
                borderRadius: radius.full,
                paddingHorizontal: 10,
                paddingVertical: 4,
              },
            ]}
            onPress={() => handleDismiss(item.id)}
            activeOpacity={0.7}
          >
            <Trash2 size={12} color={colors.onSurfaceVariant} />
            <Text style={[typography.micro, { color: colors.onSurfaceVariant, marginLeft: 4 }]}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <TopAppBar
        title="Notifications"
        onNotificationPress={() => {}}
        onProfilePress={() => (navigation as any).navigate('Profile')}
      />

      <View
        style={[
          styles.toolbar,
          {
            paddingHorizontal: pagePadding,
            marginTop: spacing.elementGap,
            gap: spacing.xs,
          },
        ]}
      >
        <View style={styles.toolbarLeft}>
          <BellRing size={16} color={colors.onSurface} />
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                {
                  backgroundColor: colors.error,
                  borderRadius: radius.full,
                  minWidth: 20,
                  height: 20,
                },
              ]}
            >
              <Text style={[typography.labelBadge, { color: '#FFFFFF', textAlign: 'center' }]}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.toolbarRight}>
          <TouchableOpacity
            style={[
              styles.toolbarButton,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: radius.full,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
              },
            ]}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <CheckCheck size={14} color={colors.onSurfaceVariant} />
            <Text style={[typography.bodySmBold, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toolbarButton,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: radius.full,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
              },
            ]}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Trash2 size={14} color={colors.error} />
            <Text style={[typography.bodySmBold, { color: colors.error, marginLeft: 6 }]}>
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sectionData}
        keyExtractor={(_, index) => `section-${index}`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[styles.listContent, { paddingHorizontal: pagePadding, paddingBottom: 120 }]}
        style={{ flex: 1 }}
        renderItem={({ item: section }) => (
          <View>
            {section.title ? (
              <Text
                style={[
                  typography.nanoCaps,
                  {
                    color: colors.onSurfaceVariant,
                    marginTop: spacing.elementGap,
                    marginBottom: spacing.xs,
                  },
                ]}
              >
                {section.title}
              </Text>
            ) : null}
            {section.data.map((notif: any, idx: number) => (
              <AnimatedEntry key={notif.id} index={idx} delay={40}>
                <View style={{ marginBottom: spacing.xs }}>
                  {renderNotification({ item: notif })}
                </View>
              </AnimatedEntry>
            ))}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<BellRing size={40} color={colors.onSurfaceVariant} />}
              title="No Notifications"
              subtitle="You're all caught up! New notifications will appear here."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 12,
  },
  notificationItem: {},
  notificationRow: {
    flexDirection: 'row',
  },
  notifIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    marginLeft: 12,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {},
  notifActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
