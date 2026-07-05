import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard, ListChecks, Bell, Users, Plus, Activity, Settings, Shield, Moon, Sun, LogOut,
} from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import Avatar from '../components/ui/Avatar';

const TABS: Record<string, { Icon: React.ElementType; i18nKey: string }> = {
  Dashboard: { Icon: LayoutDashboard, i18nKey: 'dashboard' },
  TasksList: { Icon: ListChecks, i18nKey: 'issues' },
  Members: { Icon: Users, i18nKey: 'members' },
  AuditLog: { Icon: Activity, i18nKey: 'logs' },
  Settings: { Icon: Settings, i18nKey: 'settings' },
};

export default function BottomTabBar(props: BottomTabBarProps) {
  const { isTablet } = useTheme();
  return isTablet ? <Sidebar {...props} /> : <FloatingBar {...props} />;
}

// ─── Tablet sidebar (Figma w-56 rail) ───────────────────────────────────────
function Sidebar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark, toggleTheme, radius } = useTheme();
  const { user, notifications, logout } = useAppContext();
  const unread = notifications.filter((n) => !(n as { read?: boolean }).read).length;
  const activeRoute = state.routes[state.index]?.name;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  const { t } = useTranslation();

  const items = [
    { key: 'Dashboard', label: t('dashboard', 'Dashboard'), Icon: LayoutDashboard, badge: 0 },
    { key: 'TasksList', label: t('issues', 'Issues'), Icon: ListChecks, badge: 0 },
    { key: 'Notifications', label: t('notifications', 'Notifications'), Icon: Bell, badge: unread },
    ...(isAdmin ? [{ key: 'Members', label: t('members', 'Members'), Icon: Users, badge: 0 }] : []),
    ...(isAdmin ? [] : [{ key: 'AuditLog', label: t('auditLog', 'Audit Log'), Icon: Activity, badge: 0 }]),
    { key: 'Settings', label: t('settings', 'Settings'), Icon: Settings, badge: 0 },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.card, borderRightColor: colors.cardBorder }]}>
      {/* Logo */}
      <View style={[styles.brand, { borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.brandIcon, { backgroundColor: colors.green, borderRadius: radius.md }]}>
          <Shield size={15} color="#fff" />
        </View>
        <View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>IssueTracker</Text>
          <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>Ethio Telecom</Text>
        </View>
      </View>

      {/* Nav */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 2 }}>
        {items.map((it) => {
          const active = activeRoute === it.key;
          return (
            <TouchableOpacity
              key={it.key}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(it.key as never)}
              accessibilityRole="button"
              accessibilityLabel={`Navigate to ${it.label}`}
              style={[
                styles.navItem,
                { borderRadius: radius.md },
                active && { backgroundColor: colors.green + '18', borderColor: colors.green + '30', borderLeftWidth: 3, borderLeftColor: colors.green },
              ]}
            >
              <it.Icon size={15} color={active ? colors.greenFg : colors.mutedForeground} />
              <Text style={[styles.navLabel, { color: active ? colors.greenFg : colors.mutedForeground }]}>
                {it.label}
              </Text>
              {it.badge ? (
                <View style={[styles.navBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.navBadgeText}>{it.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer: theme toggle + user */}
      <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={toggleTheme} 
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={[styles.navItem, { borderRadius: radius.md }]}
        >
          {isDark ? <Moon size={15} color={colors.mutedForeground} /> : <Sun size={15} color={colors.mutedForeground} />}
          <Text style={[styles.navLabel, { color: colors.mutedForeground }]}>{isDark ? 'Light mode' : 'Dark mode'}</Text>
        </TouchableOpacity>
        <View style={styles.userRow}>
          <Avatar name={user?.name} email={user?.email} size="sm" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? 'User'}</Text>
            <Text style={[styles.userRole, { color: colors.mutedForeground }]}>{user?.role ?? ''}</Text>
          </View>
          <TouchableOpacity 
            onPress={logout} 
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <LogOut size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Phone floating bar — role-based tabs + center FAB ─────────────────────
function FloatingBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { user } = useAppContext();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  const order = isAdmin
    ? ['Dashboard', 'TasksList', '__FAB__', 'Members', 'Settings']
    : ['Dashboard', 'TasksList', '__FAB__', 'AuditLog', 'Settings'];

  return (
    <View style={[styles.barWrap, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
      <View style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {order.map((name) => {
          if (name === '__FAB__') {
            return (
              <TouchableOpacity
                key="fab"
                activeOpacity={0.85}
                onPress={() => navigation.navigate('CreateTask' as never)}
                accessibilityRole="button"
                accessibilityLabel="Create new issue"
                style={styles.fabSlot}
              >
                <View style={[styles.fab, { backgroundColor: colors.green, borderColor: colors.card }]}>
                  <Plus size={26} color="#fff" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          }
          const idx = state.routes.findIndex((r) => r.name === name);
          const active = state.index === idx;
          const meta = TABS[name];
          
          return (
            <TouchableOpacity
              key={name}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(name as never)}
              accessibilityRole="button"
              accessibilityLabel={t(`navigateTo_${meta.i18nKey}`, `Navigate to ${t(meta.i18nKey, meta.i18nKey)}`)}
              style={styles.tab}
            >
              <meta.Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                color={active ? colors.greenFg : colors.mutedForeground}
              />
              <Text style={[styles.tabLabel, { color: active ? colors.greenFg : colors.mutedForeground, opacity: active ? 1 : 0.8 }]}>
                {t(meta.i18nKey, meta.i18nKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // sidebar
  sidebar: { width: 224, borderRightWidth: StyleSheet.hairlineWidth },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  brandIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: 'Outfit_700Bold', fontSize: 14 },
  brandSub: { fontFamily: 'Outfit_400Regular', fontSize: 10 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 9, borderLeftWidth: 0, borderColor: 'transparent', borderWidth: 1 },
  navLabel: { fontFamily: 'Outfit_500Medium', fontSize: 14, flex: 1 },
  navBadge: { minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  navBadgeText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 8 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 4 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  userName: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  userRole: { fontFamily: 'Outfit_400Regular', fontSize: 10 },
  // floating bar
  barWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '94%',
    maxWidth: 520,
    height: 60,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6 },
  tabLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 9 },
  tabActive: { transform: [{ scale: 1.15 }] },
  tabBadge: { position: 'absolute', top: -5, right: -7, minWidth: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabBadgeText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 7 },
  fabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginTop: -30,
    borderWidth: 4,
    ...Platform.select({
      ios: { shadowColor: '#80ca28', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12 },
      android: { elevation: 10 },
      default: {},
    }),
  },
});
