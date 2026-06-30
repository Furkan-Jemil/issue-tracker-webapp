import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Button } from '../components/ui';
import { relativeTime } from '../utils/formatters';

interface Notif {
  id: string;
  type: 'critical' | 'mention' | 'member' | 'info';
  title: string;
  message: string;
  code: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const { colors, pagePadding } = useTheme();
  const { notifications, markNotificationsRead } = useAppContext();
  const [items, setItems] = useState<Notif[]>(notifications as unknown as Notif[]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((ns) => ns.map((n) => ({ ...n, read: true })));
    markNotificationsRead();
  };

  const markOneRead = (id: string) =>
    setItems((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const removeOne = (id: string) =>
    setItems((ns) => ns.filter((n) => n.id !== id));

  return (
    <Screen title="Notifications" subtitle={`${unread} unread alerts`}>
      <View style={{ paddingHorizontal: pagePadding, paddingVertical: 16, gap: 8, width: '100%' }}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <Text style={[styles.unread, { color: colors.mutedForeground }]}>{unread} unread</Text>
          <View style={styles.toolbarActions}>
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

        {/* List / empty state */}
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Bell size={36} color={colors.mutedForeground + '33'} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications</Text>
          </View>
        ) : (
          items.map((n) => (
            <Card
              key={n.id}
              padding={16}
              style={
                !n.read
                  ? { borderLeftWidth: 2, borderLeftColor: colors.green, backgroundColor: colors.green + '10' }
                  : undefined
              }
            >
              <View style={styles.cardRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: n.read ? colors.mutedForeground : colors.green },
                  ]}
                />
                <View style={styles.body}>
                  <Text style={[styles.title, { color: colors.foreground }]}>{n.title}</Text>
                  <Text style={[styles.message, { color: colors.foreground }]}>{n.message}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {n.code} · {relativeTime(n.created_at)}
                  </Text>
                </View>
                <View style={styles.actions}>
                  {!n.read && (
                    <TouchableOpacity
                      onPress={() => markOneRead(n.id)}
                      activeOpacity={0.7}
                      style={[styles.iconBtn, { backgroundColor: colors.green + '20' }]}
                    >
                      <CheckCheck size={11} color={colors.green} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => removeOne(n.id)}
                    activeOpacity={0.7}
                    style={[styles.iconBtn, { backgroundColor: colors.muted }]}
                  >
                    <X size={11} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  unread: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  toolbarActions: { flexDirection: 'row', gap: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 96, gap: 12 },
  emptyText: { fontFamily: 'Outfit_400Regular', fontSize: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  message: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 1 },
  meta: { fontFamily: 'Outfit_400Regular', fontSize: 10, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
