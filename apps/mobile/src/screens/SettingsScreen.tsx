import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Moon, Sun, Bell, Shield, Trash2, ChevronRight, LogOut, Edit3, Activity } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Badge, Avatar, Button } from '../components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = [
  'tasks_search', 'tasks_status', 'tasks_priority', 'tasks_severity', 'tasks_view',
  'members_role',
  'dashboard_range', 'dashboard_status', 'dashboard_priority', 'dashboard_severity',
];

export default function SettingsScreen() {
  const { colors, spacing, typography, isDark, toggleTheme, pagePadding } = useTheme();
  const navigation = useNavigation<any>();
  const { user, logout } = useAppContext();

  const signOut = async () => {
    await logout();
    let nav: any = navigation;
    while (nav.getParent && nav.getParent()) nav = nav.getParent();
    nav.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const clearCache = () => {
    Alert.alert('Clear Cache', 'This will reset all filters and view preferences.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove(CACHE_KEYS);
          Alert.alert('Done', 'Cache cleared successfully.');
        },
      },
    ]);
  };

  const rows = [
    { Icon: Bell, label: 'Notifications', sub: 'Email and in-app alerts' },
    { Icon: Activity, label: 'Audit Logs', sub: 'Track system activity and changes' },
  ];

  return (
    <Screen title="Settings" subtitle="Account, appearance, and preferences">
      <View style={{ paddingHorizontal: pagePadding, paddingVertical: spacing.xl, gap: spacing.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {/* Profile card */}
        <Card padding={20}>
            <View style={[styles.profile, { gap: spacing.lg }]}>
            <Avatar name={user?.name} email={user?.email} size="lg" onPress={() => navigation.navigate('Profile')} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.sectionHeading, { color: colors.foreground }]}>{user?.name ?? 'User'}</Text>
              <Text style={[typography.micro, { color: colors.mutedForeground }]}>{user?.email ?? ''}</Text>
              <Badge kind="role" value={user?.role ?? 'USER'} style={{ marginTop: 6 }} />
            </View>
            <Button title="Edit" variant="outline" size="sm" icon={<Edit3 size={12} color={colors.foreground} />} onPress={() => navigation.navigate('Profile')} />
          </View>
        </Card>

        {/* Preferences */}
        <Card padding={0}>
          <View style={[styles.row, { borderBottomColor: colors.cardBorder, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }]}>
            <View style={[styles.rowLeft, { gap: spacing.md }]}>
              {isDark ? <Moon size={16} color={colors.mutedForeground} /> : <Sun size={16} color={colors.mutedForeground} />}
              <View>
                <Text style={[typography.bodySmBold, { color: colors.foreground }]}>Appearance</Text>
                <Text style={[typography.micro, { color: colors.mutedForeground }]}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleTheme} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Toggle theme" style={[styles.toggle, { backgroundColor: isDark ? colors.green : colors.outline }]}>
              <View style={[styles.knob, { alignSelf: isDark ? 'flex-end' : 'flex-start' }]} />
            </TouchableOpacity>
          </View>
          {rows.map((r, i) => (
            <TouchableOpacity key={r.label} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={r.label} style={[styles.row, { paddingHorizontal: spacing.xl, paddingVertical: spacing.md }, i < rows.length - 1 && { borderBottomColor: colors.cardBorder, borderBottomWidth: StyleSheet.hairlineWidth }]}
              onPress={() => {
                if (r.label === 'Notifications') navigation.navigate('Notifications');
                else if (r.label === 'Audit Logs') navigation.navigate('AuditLog');
              }}>
              <View style={[styles.rowLeft, { gap: spacing.md }]}>
                <r.Icon size={16} color={colors.mutedForeground} />
                <View>
                  <Text style={[typography.bodySmBold, { color: colors.foreground }]}>{r.label}</Text>
                  <Text style={[typography.micro, { color: colors.mutedForeground }]}>{r.sub}</Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
          {/* Clear cache */}
          <TouchableOpacity activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Clear cache" style={[styles.row, { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 0 }]}
            onPress={clearCache}>
            <View style={[styles.rowLeft, { gap: spacing.md }]}>
              <Trash2 size={16} color={colors.mutedForeground} />
              <View>
                <Text style={[typography.bodySmBold, { color: colors.foreground }]}>Clear Cache</Text>
                <Text style={[typography.micro, { color: colors.mutedForeground }]}>Reset filters and view preferences</Text>
              </View>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Card>

        <Button title="Sign Out" variant="destructive" fullWidth icon={<LogOut size={14} color="#fff" />} onPress={signOut} />
        <Text style={[typography.micro, { color: colors.mutedForeground, textAlign: 'center', marginTop: 4 }]}>Version 2.4.1 · Ethio Telecom IssueTracker</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
