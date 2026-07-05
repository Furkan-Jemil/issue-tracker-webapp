import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Button, AnimatedEntry, Skeleton } from '../components/ui';
import { relativeTime } from '../utils/formatters';

interface Notif {
  id: string;
  type: 'critical' | 'mention' | 'member' | 'info';
  title: string;
  message: string;
  code: string;
  read: boolean;
  created_at: string;
  targetType?: 'issue' | 'none';
  targetId?: string;
}

export default function NotificationsScreen() {
  const { colors, spacing, typography, pagePadding } = useTheme();
  const navigation = useNavigation<any>();
  const { notifications, markNotificationsRead, refreshData, isLoading } = useAppContext();
   const [items, setItems] = useState<Notif[]>(notifications as unknown as Notif[]);
   
   // Sync state with context when notifications change
   React.useEffect(() => {
     setItems(notifications as unknown as Notif[]);
   }, [notifications]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const unread = items.filter((n) => !n.read).length;

   const markAllRead = async () => {
     setItems((ns) => ns.map((n) => ({ ...n, read: true, isRead: true })));
     await markNotificationsRead();
     await refreshData();
   };

   const markOneRead = (id: string) =>
     setItems((ns) => ns.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n)));

  const removeOne = (id: string) =>
    setItems((ns) => ns.filter((n) => n.id !== id));

  /** Resolve an issue id to open: prefer explicit target fields, else parse an ET-#### code. */
  const resolveIssueId = (n: Notif): string | null => {
    if (n.targetType === 'issue' && n.targetId) return n.targetId;
    if (n.targetType === 'none') return null;
    const match = `${n.title} ${n.message}`.match(/ET-\d+/);
    return match ? match[0] : null;
  };

  const handlePress = (n: Notif) => {
    markOneRead(n.id);
    const issueId = resolveIssueId(n);
    if (issueId) navigation.navigate('TaskDetail', { issueId });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={{ gap: spacing.sm }}>
          {[1,2,3,4].map((i) => (
            <Card key={i} padding={spacing.cardPadding}>
              <View style={{ gap: spacing.xs }}>
                <Skeleton width="50%" height={12} borderRadius={4} />
                <Skeleton width="80%" height={10} borderRadius={4} />
                <Skeleton width="30%" height={8} borderRadius={4} />
              </View>
            </Card>
          ))}
        </View>
      );
    }
    if (items.length === 0) {
      return (
        <AnimatedEntry>
          <View style={[styles.empty, { gap: spacing.md }]}>
            <Bell size={36} color={colors.mutedForeground + '33'} />
            <Text style={[typography.bodySm, { color: colors.mutedForeground }]}>No notifications</Text>
          </View>
        </AnimatedEntry>
      );
    }
    return items.map((n) => {
      const linkable = resolveIssueId(n) != null;
      return (
      <Card
        key={n.id}
        padding={spacing.cardPadding}
        onPress={linkable ? () => handlePress(n) : undefined}
        accessibilityRole={linkable ? 'button' : undefined}
        accessibilityLabel={linkable ? `Open ${n.title}` : undefined}
      >
        <View style={[styles.cardRow, { gap: spacing.md }]}>
          <View
            style={[
              styles.dot,
              { backgroundColor: n.read ? 'transparent' : colors.green },
            ]}
          />
          <View style={styles.body}>
            <Text style={[typography.bodySmBold, { color: colors.foreground }]}>{n.title}</Text>
            <Text style={[typography.bodySm, { color: colors.foreground }]}>{n.message}</Text>
            <Text style={[typography.cardDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
              {n.code} · {relativeTime(n.created_at)}
            </Text>
          </View>
          <View style={[styles.actions, { gap: spacing.xs }]}>
            {!n.read && (
              <TouchableOpacity
                onPress={() => markOneRead(n.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Mark as read"
                style={[styles.iconBtn, { backgroundColor: colors.green + '20' }]}
              >
                <CheckCheck size={11} color={colors.green} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => removeOne(n.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Remove notification"
              style={[styles.iconBtn, { backgroundColor: colors.muted }]}
            >
              <X size={11} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
      );
    });
  };

  return (
    <Screen title="Notifications" subtitle={`${unread} unread alerts`} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={{ paddingHorizontal: pagePadding, paddingVertical: spacing.lg, gap: spacing.sm, width: '100%' }}>
        <View style={styles.toolbar}>
          <Text style={[typography.micro, { color: colors.mutedForeground }]}>{unread} unread</Text>
          <View style={[styles.toolbarActions, { gap: spacing.sm }]}>
            <Button
              title="Mark all read"
              variant="outline"
              size="sm"
              icon={<CheckCheck size={12} color={colors.foreground} />}
              onPress={markAllRead}
            />
            <Button
              title="Clear all"
              variant="outline"
              size="sm"
              icon={<Trash2 size={12} color={colors.foreground} />}
              onPress={() => setItems([])}
            />
          </View>
        </View>
        {renderContent()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  unread: {},
  toolbarActions: { flexDirection: 'row' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 96 },
  emptyText: {},
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  body: { flex: 1, minWidth: 0 },
  title: {},
  message: { marginTop: 1 },
  meta: { marginTop: 4 },
  actions: { flexDirection: 'row' },
  iconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
